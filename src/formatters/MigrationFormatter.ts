/**
 * @author Junaid Atari <mj.atari@gmail.com>
 * @copyright 2025 Junaid Atari
 * @see https://github.com/blacksmoke26
 */

import {format} from 'sql-formatter';
import {sp} from '~/core/ModelGenerator';

/**
 * MigrationFormatter - A utility class for formatting and handling SQL migrations.
 * Provides static methods for escaping strings, formatting SQL queries, and initializing migration variables.
 * This class is designed to help standardize migration files with proper SQL formatting and escaping.
 */
export default abstract class MigrationFormatter {
  /**
   * Escapes single quotes in a string by replacing them with escaped versions.
   * This is useful when constructing SQL queries where string values need to be properly escaped.
   * @param str - The input string to escape single quotes from
   * @returns The string with all single quotes escaped with backslashes
   * @example
   * ```typescript
   * MigrationFormatter.escape("O'Reilly") // Returns "O\\'Reilly"
   * ```
   */
  public static escape(str: string): string {
    return str.replaceAll(`'`, `\\'`);
  }

  /**
   * Formats a SQL string with proper indentation and SQL keyword casing.
   * Uses sql-formatter to standardize the SQL appearance with PostgreSQL dialect.
   * @param sql - The raw SQL string to format
   * @returns The formatted SQL string with proper indentation and uppercase keywords
   * @example
   * ```typescript
   * MigrationFormatter.formatSQL("select * from users where id=1")
   * // Returns formatted SQL with proper indentation
   * ```
   */
  public static formatSQL(sql: string): string {
    return format(sql, {
      language: 'postgresql',
      tabWidth: 2,
      keywordCase: 'upper',
      linesBetweenQueries: 2,
      useTabs: false,
    }).replace(/^./gim, (s) => {
      return sp(4) + s;
    });
  }

  /**
   * Initializes a migration variables object containing empty strings for up and down migrations.
   * This provides a standardized structure for building migration content.
   * @returns An object with empty `up` and `down` properties ready to be populated with migration code
   * @example
   * ```typescript
   * const vars = MigrationFormatter.initVariables();
   * // vars.up = ""
   * // vars.down = ""
   * ```
   */
  public static initVariables(): { up: string; down: string } {
    return {
      up: '',
      down: '',
    };
  }
}
