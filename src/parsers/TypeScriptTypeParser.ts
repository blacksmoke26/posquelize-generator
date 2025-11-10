/**
 * @author Junaid Atari <mj.atari@gmail.com>
 * @copyright 2025 Junaid Atari
 * @see https://github.com/blacksmoke26
 */

import { json2ts } from 'json-ts';

// utils
import { getJsType } from '~/constants/pg';
import TableUtils from '~/classes/TableUtils';
import TypeUtils from '~/classes/TypeUtils';
import ColumnInfoUtils from '~/classes/ColumnInfoUtils';

// types
import type { TableColumnRaw } from '~/typings/knex';
import type { SequelizeType } from '~/constants/sequelize';

/**
 * Parameters required for converting a JSON column to a TypeScript interface.
 * These parameters provide the necessary context to generate appropriate type definitions
 * for columns containing JSON or JSONB data.
 */
interface JsonToTypescriptParams {
  /** The SQL column type (e.g., 'json', 'jsonb') */
  columnType: string;
  /** The default value of the column, expected to be a JSON string or 'null' */
  defaultValue: string;
  /** The name of the table containing the column */
  tableName: string;
  /** The name of the column being processed */
  columnName: string;
}

/**
 * Arguments passed to the TypeScript type parser method.
 * This interface encapsulates all necessary information about a database column
 * to determine its appropriate TypeScript type representation.
 */
export interface ParseArgs {
  /** The SQL type of the column (e.g., 'integer', 'varchar', 'timestamp') */
  columnType: string;
  /** Complete column metadata as retrieved from the database schema */
  columnInfo: TableColumnRaw;
  /** The corresponding Sequelize type mapping for the column */
  sequelizeType: SequelizeType;
  /** Additional parameters that may be required for complex Sequelize types */
  sequelizeTypeParams: string;
}

/**
 * Abstract utility class for parsing and converting database column types
 * into their appropriate TypeScript type representations.
 *
 * This class provides static methods to:
 * - Convert SQL column types to TypeScript types
 * - Generate TypeScript interfaces from JSON/JSONB column definitions
 * - Handle array types and custom UDT (User-Defined Type) mappings
 *
 * @example
 * ```typescript
 * const type = TypeScriptTypeParser.parse({
 *   columnType: 'varchar',
 *   columnInfo: { /* column metadata *!/ },
 *   sequelizeType: 'STRING',
 *   sequelizeTypeParams: ''
 * });
 * ```
 */
export default abstract class TypeScriptTypeParser {
  /**
   * Converts a database column's type definition into its TypeScript equivalent.
   * This method handles standard types, arrays, and User-Defined Types (UDT).
   *
   * @param params - The parsing arguments containing column and type information
   * @returns A string representing the TypeScript type (e.g., 'string', 'Array<number>')
   *
   * @example
   * ```typescript
   * // Returns 'string'
   * TypeScriptTypeParser.parse({ columnType: 'varchar', ... });
   *
   * // Returns 'Array<number>' for array types with UDT mapping
   * TypeScriptTypeParser.parse({ columnType: '_int4', ... });
   * ```
   */
  public static parse(params: ParseArgs): string {
    const { columnType, columnInfo } = params;

    const jsType = getJsType(columnType);

    const udtType = ColumnInfoUtils.toUdtType(columnInfo);

    if (jsType.startsWith('Array<') && udtType) {
      return `Array<${getJsType(udtType)}>`;
    }

    return jsType;
  }

  /**
   * Converts a JSON or JSONB column's default value into a TypeScript interface.
   * This method generates type definitions for structured data stored in JSON columns.
   *
   * @param params - The parameters containing column information and default value
   * @returns A string containing the generated TypeScript interface, or null if not a JSON type
   *
   * @example
   * ```typescript
   * // For column with JSON default '{"name": "John", "age": 30}'
   * // Returns: 'interface TableNameColumnName { name: string; age: number; }'
   * TypeScriptTypeParser.jsonToInterface({
   *   columnType: 'json',
   *   defaultValue: '{"name": "John", "age": 30}',
   *   tableName: 'users',
   *   columnName: 'metadata'
   * });
   * ```
   */
  public static jsonToInterface(
    params: JsonToTypescriptParams,
  ): string | null {
    const { columnType, tableName, columnName, defaultValue } = params;

    return !TypeUtils.isJSON(columnType)
      ? defaultValue
      : json2ts(
        JSON.parse(defaultValue === 'null' ? '{}' : defaultValue),
        {prefix: '', rootName: TableUtils.toJsonColumnTypeName(tableName, columnName)},
      );
  }
}
