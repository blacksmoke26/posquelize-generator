/**
 * @author Junaid Atari <mj.atari@gmail.com>
 * @copyright 2025 Junaid Atari
 * @see https://github.com/blacksmoke26
 */

import { SequelizeType, TypesMap } from '~/constants/sequelize';

// utils
import ColumnInfoUtils from '~/classes/ColumnInfoUtils';

// types
import { ExclusiveColumnInfo } from '~/typings/utils';

/**
 * A utility class that provides methods for parsing and converting PostgreSQL data types
 * to their corresponding Sequelize data types. This class handles both standard PostgreSQL
 * types and user-defined types (ENUMs, composite types, and domain types), providing
 * formatted output suitable for Sequelize model definitions.
 *
 * @example
 * ```typescript
 * const result = SequelizeParser.parse(columnInfo);
 * console.log(result); // ['STRING', 'VARCHAR(255)']
 * ```
 */
export default abstract class SequelizeParser {
  /**
   * Extracts numeric parameters from a type definition string.
   * Commonly used for types that require precision or length specifications.
   *
   * @param paramType - String containing type parameters (e.g., "10,2" for DECIMAL(10,2))
   * @returns Array of extracted numeric parameters as strings. Empty array if no matches found.
   *
   * @example
   * ```typescript
   * SequelizeParser.parseTypeParams("10,2"); // ["10", "2"]
   * SequelizeParser.parseTypeParams("255"); // ["255", undefined]
   * ```
   */
  public static parseTypeParams(paramType: string): string[] {
    const matches = paramType?.match?.(/(\d+)(?:,(\d+))?/) ?? null;
    if (!matches) {
      return [];
    }

    const [, ...params] = matches;
    return params;
  }

  /**
   * Creates a formatted Sequelize data type string with optional parameters.
   * Handles both simple types and types that require length/precision specifications.
   *
   * @param type - Base Sequelize data type (e.g., 'STRING', 'DECIMAL')
   * @param args - Optional type arguments (length, precision, scale, etc.)
   * @returns Tuple containing the raw Sequelize type and formatted type string
   *
   * @example
   * ```typescript
   * SequelizeParser.format('STRING', 255); // ['STRING', 'STRING(255)']
   * SequelizeParser.format('DECIMAL', 10, 2); // ['DECIMAL', 'DECIMAL(10, 2)']
   * SequelizeParser.format('BOOLEAN'); // ['BOOLEAN', 'BOOLEAN']
   * ```
   */
  public static format(type: string, ...args: (string | number | null)[]): [SequelizeType, string] {
    const formattedArgs = args.filter((x) => String(x || '').length);

    if (!formattedArgs.length) {
      return [type as SequelizeType, type];
    }

    return [type as SequelizeType, `${type}(${formattedArgs.filter(Boolean).join(', ')})`];
  }

  /**
   * Converts PostgreSQL user-defined types to their Sequelize equivalents.
   * Handles ENUMs (native Sequelize support), composite types (with metadata),
   * and domain types (with constraint information).
   *
   * @param columnInfo - Complete column information including type metadata
   * @returns Tuple with Sequelize type and formatted string, or null for unsupported types
   *
   * @example
   * ```typescript
   * // For ENUM type
   * const enumResult = SequelizeParser.parseUserDefined(enumColumnInfo);
   * // Returns: ['ENUM', "ENUM('active','inactive','pending')"]
   *
   * // For composite type
   * const compResult = SequelizeParser.parseUserDefined(compositeColumnInfo);
   * // Returns: ['ADDRESS', "$RAW.ADDRESS|PostgreSQL's Composite Type 'ADDRESS(street: VARCHAR, city: VARCHAR)'."]
   * ```
   */
  private static parseUserDefined(columnInfo: ExclusiveColumnInfo): [SequelizeType, string] | null {
    //region ENUMs: Supported natively by Sequelize.
    if (columnInfo.element.isEnum) {
      return ['ENUM', `ENUM(${columnInfo?.element?.enumData!.map((x) => `'${x.replaceAll('"', '')}'`).join(', ')})`];
    }
    //endregion

    //region Composite types: Struct-like types with multiple fields
    if (columnInfo.element.isComposite) {
      const {compositeData} = columnInfo.element;
      const type = compositeData?.typeName?.toUpperCase();

      const attrs = compositeData!.attributeNames.replace(/([}{])/g, '').split(',');
      const map = attrs.map((x, i) => `${x}: ${compositeData!.attributeTypes[i]}`)
      return [type as SequelizeType, `$RAW.${type}|PostgreSQL's Composite Type '${compositeData?.typeName}(${map.join(', ')})'.`];
    }
    //endregion

    //region Domain types: Custom types based on existing ones with constraints.
    if (columnInfo.element.isDomain) {
      const {domainData} = columnInfo.element;
      const type = TypesMap[domainData?.baseType as keyof typeof TypesMap] ?? 'STRING';
      return [type as SequelizeType, `$COMMENT.${type}|PostgreSQL's Domain Type '${domainData?.domainName}'.`];
    }
    //endregion

    return null;
  }

  /**
   * Checks if a type string represents an ENUM type.
   *
   * @param paramsType - Type string to check (e.g., "ENUM('a','b')")
   * @returns True if the type is an ENUM, false otherwise
   */
  public static isEnum(paramsType: string): boolean {
    return String(paramsType || '').startsWith('ENUM');
  }

  /**
   * Checks if a type string represents a JSON type.
   *
   * @param paramsType - Type string to check (e.g., "JSON" or "JSONB")
   * @returns True if the type is JSON-based, false otherwise
   */
  public static isJSON(paramsType: string): boolean {
    return String(paramsType || '').startsWith('JSON');
  }

  /**
   * Extracts ENUM values from a type definition string.
   * Removes quotes and whitespace from each value.
   *
   * @param paramsType - ENUM type string (e.g., "ENUM('red','green','blue')")
   * @returns Array of clean ENUM values. Empty array if not a valid ENUM.
   *
   * @example
   * ```typescript
   * SequelizeParser.parseEnums("ENUM('apple','banana','cherry')");
   * // Returns: ['apple', 'banana', 'cherry']
   * ```
   */
  public static parseEnums(paramsType: string): string[] {
    if (!this.isEnum(paramsType)) return [];

    const matches = paramsType?.match?.(/ENUM\((.*)\)/);
    if (!matches) {
      return [];
    }

    const [, enums] = matches;
    return enums.split(',').map((e) => e.replace(/['"]/g, '').trim());
  }

  /**
   * Main parser method that converts PostgreSQL column information to Sequelize types.
   * Handles all standard PostgreSQL types, arrays, ranges, and user-defined types.
   *
   * @param info - Complete column information including data type and constraints
   * @returns Tuple containing the Sequelize type and formatted type string, or null if parsing fails
   *
   * @example
   * ```typescript
   * const result = SequelizeParser.parse(columnInfo);
   * console.log(result); // ['DECIMAL', 'DECIMAL(10, 2)']
   * ```
   */
  public static parse(info: ExclusiveColumnInfo): [SequelizeType, string] | null {
    const type = info.element.dataType.toLowerCase();
    let sequelizeType: SequelizeType = TypesMap[type as keyof typeof TypesMap] as SequelizeType;
    const udtType: string | null = ColumnInfoUtils.toUdtType(info.info);

    if (info.element.isDomain || info.element.isEnum || info.element.isComposite) {
      return this.parseUserDefined(info);
    }

    if (type === 'array') {
      sequelizeType = 'ARRAY';
    }

    if (!Object.hasOwn(TypesMap, type) && type.endsWith('range')) {
      sequelizeType = 'RANGE';
    }

    switch (sequelizeType) {
      case 'STRING':
        return this.format(sequelizeType, info.info.character_maximum_length!);

      case 'DECIMAL': {
        const precisions = ColumnInfoUtils.toNumericPrecision(info.info) as number[];
        return this.format(sequelizeType, ...precisions);
      }

      case 'REAL':
        return this.format(sequelizeType);

      case 'BOOLEAN':
        return this.format(sequelizeType);

      case 'DATE':
        return this.format(sequelizeType);

      case 'DATEONLY':
        return this.format(sequelizeType);

      case 'TIME':
        return this.format(sequelizeType);

      case 'TINYINT':
        return this.format(sequelizeType);

      case 'SMALLINT':
        return this.format(sequelizeType);

      case 'MEDIUMINT':
        return this.format(sequelizeType);

      case 'INTEGER':
        return [sequelizeType, info.info.numeric_precision ? `INTEGER({ precision: ${info.info.numeric_precision} })` : 'INTEGER'];

      case 'BIGINT':
        return this.format(sequelizeType);

      case 'FLOAT':
        return this.format(sequelizeType);

      case 'DOUBLE':
        return this.format(sequelizeType, info.info.numeric_precision);

      case 'BLOB':
        return this.format(sequelizeType, info.info.character_maximum_length);

      case 'TEXT':
        return this.format(sequelizeType, info.info.character_maximum_length);

      case 'JSON':
        return this.format(sequelizeType);

      case 'JSONB':
        return this.format(sequelizeType);

      case 'CIDR':
        return this.format(sequelizeType);

      case 'INET':
        return this.format(sequelizeType);

      case 'MACADDR':
        return this.format(sequelizeType);

      case 'CHAR':
        return this.format(sequelizeType, info.info.character_maximum_length);

      case 'UUID':
      case 'UUIDV1':
      case 'UUIDV4':
        return this.format(sequelizeType);

      case 'ARRAY': {
        return this.format(sequelizeType, (TypesMap[udtType as keyof typeof TypesMap] ?? 'STRING') as string);
      }

      case 'RANGE': {
        const rangeType = sequelizeType.replace(/multirange|range$/i, '').toLowerCase();
        return this.format(sequelizeType, (TypesMap[rangeType as keyof typeof TypesMap] ?? 'STRING') as string);
      }

      /*case 'ABSTRACT':
        break;
      case 'NUMBER':
        break;
      case 'HSTORE':
        break;
      case 'NOW':
        break;
      case 'VIRTUAL':
        break;
      case 'ENUM':
        break;
      case 'GEOMETRY':
        break;
      case 'GEOGRAPHY':
        break;
      case 'CITEXT':
        break;
      case 'TSVECTOR':
        break;*/

      default:
        return this.format(sequelizeType);
    }
  }
}
