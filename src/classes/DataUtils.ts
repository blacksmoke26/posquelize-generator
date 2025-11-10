/**
 * @author Junaid Atari <mj.atari@gmail.com>
 * @copyright 2025 Junaid Atari
 * @see https://github.com/blacksmoke26
 */

// types
import type { Knex } from 'knex';

/**
 * Utility class for data operations.
 *
 * This class provides static methods for performing common database operations,
 * particularly focused on JSON data handling and analysis.
 */
export default abstract class DataUtils {
  /**
   * Retrieves the longest JSON string from a specified column in a database table.
   *
   * This method queries the database to find the entry with the longest JSON content
   * in the specified column, which can be useful for analyzing maximum payload sizes
   * or for testing purposes.
   *
   * @param knex - A configured Knex instance for database connection and query building
   * @param params - Configuration object containing the query parameters
   * @param params.schemaName - Optional database schema name. Defaults to 'public' if not specified
   * @param params.tableName - The name of the table to query. Must be a valid table name in the specified schema
   * @param params.columnName - The name of the column containing JSON data to analyze
   *
   * @returns A Promise that resolves to the longest JSON string found in the specified column.
   *          If no records are found or the column is empty/null, returns an empty JSON object string '{}'.
   *          The returned string is trimmed of leading/trailing whitespace.
   *
   * @throws {Error} When the specified table or column does not exist
   * @throws {Error} When there's a database connection error
   *
   * @example
   * ```typescript
   * const longestJson = await DataUtils.getLongestJson(knex, {
   *   tableName: 'users',
   *   columnName: 'metadata'
   * });
   * console.log(longestJson); // e.g., '{"key":"value",...}'
   * ```
   *
   * @example
   * ```typescript
   * const longestJson = await DataUtils.getLongestJson(knex, {
   *   schemaName: 'custom_schema',
   *   tableName: 'products',
   *   columnName: 'attributes'
   * });
   * ```
   *
   * @since 1.0.0
   */
  public static async getLongestJson(knex: Knex, params: {
    schemaName?: string;
    tableName: string;
    columnName: string
  }): Promise<string> {
    const record = await knex(`${params?.schemaName ?? 'public'}.${params.tableName}`)
      .select(knex.raw(`${params.columnName}::TEXT`))
      .orderByRaw(`LENGTH(${params.columnName}::TEXT) DESC`)
      .limit(1)
      .first();

    return record?.[params.columnName]?.trim?.() ?? '{}';
  }
}
