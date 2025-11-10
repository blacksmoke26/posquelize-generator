/**
 * @author Junaid Atari <mj.atari@gmail.com>
 * @copyright 2025 Junaid Atari
 * @see https://github.com/blacksmoke26
 */

import pluralize from 'pluralize';
import {camelCase, pascalCase} from 'change-case';

/**
 * Utility class for table-related operations
 *
 * This abstract class provides static methods for common table-related transformations
 * and naming conventions used in database modeling and TypeScript type generation.
 * It includes utilities for converting between different naming conventions,
 * singularizing/pluralizing words, and generating type-safe identifiers.
 *
 * @example
 * ```typescript
 * // Convert table name to model name
 * const modelName = TableUtils.table2ModelName('users'); // Returns 'User'
 *
 * // Convert column name to camelCase
 * const columnName = TableUtils.toColumnName('first_name'); // Returns 'firstName'
 *
 * // Generate JSON column type name
 * const typeName = TableUtils.toJsonColumnTypeName('users', 'metadata'); // Returns 'UserMetadataData'
 * ```
 */
export default abstract class TableUtils {
  /**
   * Converts a database table name to a model name in PascalCase
   *
   * This method transforms a table name (typically in snake_case or plural form)
   * into a model name following TypeScript class naming conventions.
   * The table name is first singularized before being converted to PascalCase.
   *
   * @param tableName - The database table name to convert (e.g., 'users', 'user_profiles')
   * @returns The model name in PascalCase, singular form (e.g., 'User', 'UserProfile')
   *
   * @example
   * ```typescript
   * TableUtils.table2ModelName('users');        // Returns 'User'
   * TableUtils.table2ModelName('products');    // Returns 'Product'
   * TableUtils.table2ModelName('user_orders'); // Returns 'UserOrder'
   * ```
   */
  public static table2ModelName(tableName: string): string {
    return pascalCase(pluralize.singular(tableName));
  }

  /**
   * Converts a column name to camelCase format
   *
   * This method transforms database column names (typically in snake_case)
   * into camelCase format suitable for JavaScript/ TypeScript property names.
   * It handles various naming patterns including underscores and hyphens.
   *
   * @param name - The column name to convert (e.g., 'first_name', 'created-at', 'user_id')
   * @returns The column name converted to camelCase (e.g., 'firstName', 'createdAt', 'userId')
   *
   * @example
   * ```typescript
   * TableUtils.toColumnName('first_name');    // Returns 'firstName'
   * TableUtils.toColumnName('created_at');    // Returns 'createdAt'
   * TableUtils.toColumnName('user-email');    // Returns 'userEmail'
   * ```
   */
  public static toColumnName(name: string): string {
    return camelCase(name);
  }

  /**
   * Generates a TypeScript type name for JSON column data
   *
   * This method creates a standardized type name for TypeScript interfaces
   * that represent the structure of JSON data stored in database columns.
   * The generated name follows the pattern: {ModelName}{ColumnName}{Postfix}.
   * This is particularly useful for generating type definitions for JSON columns
   * in ORMs or database access layers.
   *
   * @param tableName - The name of the table containing the JSON column
   * @param columnName - The name of the JSON column
   * @param postfix - Optional postfix to append to the type name (defaults to 'data')
   * @returns The generated TypeScript type name in PascalCase format
   *
   * @example
   * ```typescript
   * TableUtils.toJsonColumnTypeName('users', 'metadata');        // Returns 'UserMetadataData'
   * TableUtils.toJsonColumnTypeName('products', 'settings', 'config'); // Returns 'ProductSettingsConfig'
   * TableUtils.toJsonColumnTypeName('orders', 'details', '');     // Returns 'OrderDetails'
   * ```
   */
  public static toJsonColumnTypeName(
    tableName: string,
    columnName: string,
    postfix: string = 'data',
  ): string {
    return pascalCase(
      `${this.table2ModelName(tableName)}_${columnName}${
        postfix.length ? '_' + postfix : ''
      }`,
    );
  }
}
