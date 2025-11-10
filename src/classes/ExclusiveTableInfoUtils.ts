/**
 * @author Junaid Atari <mj.atari@gmail.com>
 * @copyright 2025 Junaid Atari
 * @see https://github.com/blacksmoke26
 */

// utils
import TypeUtils from '~/classes/TypeUtils';
import { ConstraintType } from '~/classes/DbUtils';

// types
import type { ExclusiveColumnInfo } from '~/typings/utils';

/**
 * Utility class for handling exclusive table information operations.
 * Provides static methods to analyze and determine various properties of database columns
 * based on their metadata and constraints.
 */
export default abstract class ExclusiveTableInfoUtils {
  /**
   * Determines whether a datetime column has its default value set to `CURRENT_TIMESTAMP`.
   * This method checks both the column's data type (must be a date/datetime type) and
   * whether its default value starts with `CURRENT_` (commonly `CURRENT_TIMESTAMP`).
   *
   * @param columnInfo - An object containing comprehensive column metadata including
   *                     type information and default value specifications.
   * @returns true if the column is a datetime type with `CURRENT_TIMESTAMP` as default,
   *          false otherwise.
   *
   * @example
   * ```typescript
   * const columnInfo = {
   *   element: { udtName: 'timestamp' },
   *   info: { column_default: 'CURRENT_TIMESTAMP' }
   * };
   * ExclusiveTableInfoUtils.isDefaultNow(columnInfo); // true
   * ```
   */
  public static isDefaultNow(columnInfo: ExclusiveColumnInfo): boolean {
    return (
      TypeUtils.isDate(columnInfo.element.udtName) &&
      columnInfo?.info?.column_default?.startsWith?.('CURRENT_')
    );
  }

  /**
   * Checks whether the specified column is designated as a primary key.
   * A primary key is a constraint that uniquely identifies each record in a table.
   *
   * @param columnInfo - The column metadata object containing constraint information.
   * @returns true if the column has a primary key constraint, false otherwise.
   *
   * @example
   * ```typescript
   * const columnInfo = {
   *   column: { constraint: ConstraintType.PrimaryKey }
   * };
   * ExclusiveTableInfoUtils.isPrimaryKey(columnInfo); // true
   * ```
   */
  public static isPrimaryKey(columnInfo: ExclusiveColumnInfo): boolean {
    return columnInfo.column.constraint === ConstraintType.PrimaryKey;
  }

  /**
   * Verifies if the column is a serial key, which is an auto-incrementing integer column
   * commonly used in PostgreSQL databases. Serial columns utilize the nextval function
   * with a sequence generator to automatically increment for each new record.
   *
   * This method specifically looks for the pattern 'nextval('.+_seq'::regclass)' in the
   * column's default value, which is the standard PostgreSQL sequence generation syntax.
   *
   * @param columnInfo - The column information object containing default value details.
   *                     Only the 'column' property is destructured and used.
   * @returns true if the column is configured as a serial/auto-increment column,
   *          false otherwise.
   *
   * @example
   * ```typescript
   * const columnInfo = {
   *   column: { defaultValue: "nextval('table_id_seq'::regclass)" }
   * };
   * ExclusiveTableInfoUtils.isSerialKey(columnInfo); // true
   * ```
   */
  public static isSerialKey({ column }: ExclusiveColumnInfo): boolean {
    return /^nextval\('.+_seq'::regclass\)/.test(column?.defaultValue ?? '');
  }
}
