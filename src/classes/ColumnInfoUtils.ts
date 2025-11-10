/**
 * @author Junaid Atari <mj.atari@gmail.com>
 * @copyright 2025 Junaid Atari
 * @see https://github.com/blacksmoke26
 */

// types
import type { TableColumnRaw } from '~/typings/knex';

/**
 * Utility class for processing and transforming column metadata from database schema information.
 *
 * This class provides static methods to extract and normalize various properties of database columns,
 * particularly focusing on numeric precision/scale values and user-defined type (UDT) information.
 * It serves as a helper for database introspection and schema analysis operations.
 *
 * @since 1.0.0
 * @example
 * ```typescript
 * // Get numeric precision and scale
 * const [precision, scale] = ColumnInfoUtils.toNumericPrecision(columnInfo);
 *
 * // Get normalized UDT type
 * const udtType = ColumnInfoUtils.toUdtType(columnInfo);
 * ```
 */
export default abstract class ColumnInfoUtils {
  /**
   * Extracts numeric precision and scale values from column metadata.
   *
   * This method converts the numeric_precision and numeric_scale fields from the
   * database column information into numeric values. If the column information
   * is null or undefined, it returns null values for both precision and scale.
   *
   * @param columnInfo - The raw column information object from the database metadata,
   *                     or null if the column information is not available
   * @returns A tuple containing [precision, scale] where:
   *          - precision: The numeric precision as a number or null
   *          - scale: The numeric scale as a number or null
   *          Returns [null, null] when columnInfo is null
   *
   * @example
   * ```typescript
   * const result = ColumnInfoUtils.toNumericPrecision({
   *   numeric_precision: '10',
   *   numeric_scale: '2'
   * });
   * // result = [10, 2]
   * ```
   */
  public static toNumericPrecision(columnInfo: TableColumnRaw | null): [number | null, number | null] {
    return !columnInfo
      ? [null, null]
      : [+columnInfo.numeric_precision!, +columnInfo.numeric_scale!];
  }

  /**
   * Normalizes the User-Defined Type (UDT) name from column metadata.
   *
   * This method extracts the UDT name from the column information and applies
   * normalization transformations:
   * - Converts to string (handles non-string values)
   * - Trims whitespace
   * - Converts to lowercase
   * - Removes underscore characters
   *
   * The normalized format is useful for consistent type comparisons and
   * mappings. If the UDT name is not available in the column information,
   * the method returns null.
   *
   * @param columnInfo - The raw column information object from the database metadata,
   *                     or null if the column information is not available
   * @returns The normalized UDT name (lowercase, no underscores) or null
   *          if the UDT name is not available
   *
   * @example
   * ```typescript
   * const result = ColumnInfoUtils.toUdtType({
   *   udt_name: 'USER_DEFINED_TYPE'
   * });
   * // result = 'userdefinedtype'
   * ```
   */
  public static toUdtType(columnInfo: TableColumnRaw | null): string | null {
    return (
      columnInfo?.udt_name
        ?.toString?.()
        ?.trim?.()
        ?.toLowerCase?.()
        ?.replace?.('_', '') ?? null
    );
  }
}
