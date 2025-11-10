/**
 * @author Junaid Atari <mj.atari@gmail.com>
 * @copyright 2025 Junaid Atari
 * @see https://github.com/blacksmoke26
 */

/**
 * Utility class providing static methods for database field type checking and parsing.
 * This class offers comprehensive type detection capabilities for various database field types
 * including numeric, boolean, date/time, string, array, enum, JSON, and range types.
 * Additionally, it provides utilities for parsing type definitions with precision and scale.
 *
 * @example
 * ```typescript
 * // Check if a field type is numeric
 * const isNumeric = TypeUtils.isNumber('int(11)'); // true
 *
 * // Check if a field type is a string
 * const isString = TypeUtils.isString('varchar(255)'); // true
 *
 * // Parse decimal precision and scale
 * const decimalInfo = TypeUtils.parseDecimalRange('numeric(10,2)'); // [10, 2]
 * ```
 */
export default abstract class TypeUtils {
  /**
   * Determines whether the given field type represents a numeric type.
   * This includes integer types (smallint, mediumint, tinyint, int, bigint),
   * floating-point types (float, double, real), and decimal types (money, smallmoney, decimal, numeric).
   * Also supports PostgreSQL's oid type.
   *
   * @param fieldType - The database field type string to evaluate
   * @returns `true` if the field type is numeric, `false` otherwise
   *
   * @example
   * ```typescript
   * TypeUtils.isNumber('int(11)'); // true
   * TypeUtils.isNumber('decimal(10,2)'); // true
   * TypeUtils.isNumber('varchar'); // false
   * ```
   */
  public static isNumber(fieldType: string): boolean {
    return /^(smallint|mediumint|tinyint|int|bigint|float|money|smallmoney|double|decimal|numeric|real|oid)/i.test(
      fieldType,
    );
  }

  /**
   * Determines whether the given field type represents a boolean type.
   * Supports standard boolean types and bit fields commonly used in databases.
   *
   * @param fieldType - The database field type string to evaluate
   * @returns `true` if the field type is boolean, `false` otherwise
   *
   * @example
   * ```typescript
   * TypeUtils.isBoolean('boolean'); // true
   * TypeUtils.isBoolean('bit(1)'); // true
   * TypeUtils.isBoolean('int'); // false
   * ```
   */
  public static isBoolean(fieldType: string): boolean {
    return /^(boolean|bit)/i.test(fieldType);
  }

  /**
   * Determines whether the given field type represents a date or time type.
   * This method checks for datetime and timestamp types commonly used for
   * storing date and time information.
   *
   * @param fieldType - The database field type string to evaluate
   * @returns `true` if the field type is date/time, `false` otherwise
   *
   * @example
   * ```typescript
   * TypeUtils.isDate('datetime'); // true
   * TypeUtils.isDate('timestamp'); // true
   * TypeUtils.isDate('date'); // false (handled by isString)
   * ```
   */
  public static isDate(fieldType: string): boolean {
    return /^(datetime|timestamp)/i.test(fieldType);
  }

  /**
   * Determines whether the given field type represents a string or text type.
   * This includes character types (char, nchar, varchar, nvarchar),
   * text types (text, longtext, mediumtext, tinytext, ntext),
   * special types (uuid, uniqueidentifier), network address types (inet, cidr, macaddr),
   * and date/time primitive types (date, time).
   *
   * @param fieldType - The database field type string to evaluate
   * @returns `true` if the field type is string-based, `false` otherwise
   *
   * @example
   * ```typescript
   * TypeUtils.isString('varchar(255)'); // true
   * TypeUtils.isString('text'); // true
   * TypeUtils.isString('uuid'); // true
   * TypeUtils.isString('date'); // true
   * TypeUtils.isString('int'); // false
   * ```
   */
  public static isString(fieldType: string): boolean {
    return /^(char|nchar|string|varying|varchar|nvarchar|text|longtext|mediumtext|tinytext|ntext|uuid|uniqueidentifier|date|time|inet|cidr|macaddr)/i.test(
      fieldType,
    );
  }

  /**
   * Determines whether the given field type represents an array or range type.
   * This method checks for types starting with 'array' or ending with 'range',
   * which are common in PostgreSQL and other advanced database systems.
   *
   * @param fieldType - The database field type string to evaluate
   * @returns `true` if the field type is array or range, `false` otherwise
   *
   * @example
   * ```typescript
   * TypeUtils.isArray('array<int>'); // true
   * TypeUtils.isArray('int4range'); // true
   * TypeUtils.isArray('int'); // false
   * ```
   */
  public static isArray(fieldType: string): boolean {
    return /(^array)|(range$)/i.test(fieldType);
  }

  /**
   * Determines whether the given field type represents an enum type.
   * Enum types are used to store a value from a predefined list of allowed values.
   *
   * @param fieldType - The database field type string to evaluate
   * @returns `true` if the field type is enum, `false` otherwise
   *
   * @example
   * ```typescript
   * TypeUtils.isEnum("enum('red','green','blue')"); // true
   * TypeUtils.isEnum('varchar'); // false
   * ```
   */
  public static isEnum(fieldType: string): boolean {
    return /^(enum)/i.test(fieldType);
  }

  /**
   * Determines whether the given field type represents a JSON data type.
   * Supports both JSON and JSONB types, with JSONB being the binary format
   * commonly used in PostgreSQL for improved performance.
   *
   * @param fieldType - The database field type string to evaluate
   * @returns `true` if the field type is JSON or JSONB, `false` otherwise
   *
   * @example
   * ```typescript
   * TypeUtils.isJSON('json'); // true
   * TypeUtils.isJSON('jsonb'); // true
   * TypeUtils.isJSON('text'); // false
   * ```
   */
  public static isJSON(fieldType: string): boolean {
    return /^(json|jsonb)/i.test(fieldType);
  }

  /**
   * Determines whether the given field type represents a range type.
   * Range types are typically postfix types that end with 'range',
   * commonly used in PostgreSQL for representing intervals.
   *
   * @param fieldType - The database field type string to evaluate
   * @returns `true` if the field type is a range type, `false` otherwise
   *
   * @example
   * ```typescript
   * TypeUtils.isRange('int4range'); // true
   * TypeUtils.isRange('numrange'); // true
   * TypeUtils.isRange('array'); // false
   * ```
   */
  public static isRange(fieldType: string): boolean {
    return fieldType.toLowerCase().endsWith('range');
  }

  /**
   * Parses a PostgreSQL decimal or numeric type definition to extract precision and scale.
   * This method handles type definitions in the format "numeric(precision, scale)" or
   * "decimal(precision, scale)" and returns the numeric values as a tuple.
   *
   * @param typeDefinition - The complete type definition string from PostgreSQL
   * @returns A tuple containing [precision, scale] if the pattern matches, `null` otherwise
   *
   * @example
   * ```typescript
   * TypeUtils.parseDecimalRange('numeric(10,2)'); // [10, 2]
   * TypeUtils.parseDecimalRange('decimal(20,5)'); // [20, 5]
   * TypeUtils.parseDecimalRange('int'); // null
   * TypeUtils.parseDecimalRange('numeric(10)'); // null
   * ```
   */
  public static parseDecimalRange(
    typeDefinition: string,
  ): [number, number] | null {
    const match =
      typeDefinition.match(/^numeric\((\d+),\s*(\d+)\)$/i) ||
      typeDefinition.match(/^decimal\((\d+),\s*(\d+)\)$/i);

    return !match ? null : [parseInt(match[1], 10), parseInt(match[2], 10)];
  }
}
