/**
 * @fileoverview Provides utilities for retrieving and processing table column information
 * from a database, including type mappings, constraints, and metadata transformations.
 *
 * This module contains interfaces and classes for working with database column information,
 * converting between different type systems (PostgreSQL, Sequelize, TypeScript), and
 * generating comprehensive column metadata for use in ORM and type generation.
 *
 * @author Junaid Atari <mj.atari@gmail.com>
 * @copyright 2025 Junaid Atari
 * @see https://github.com/blacksmoke26
 * @since 1.0.0
 */

import {camelCase} from 'change-case';

// utils
import DbUtils from '~/classes/DbUtils';
import DataUtils from '~/classes/DataUtils';
import ColumnInfoUtils from '~/classes/ColumnInfoUtils';
import ExclusiveTableInfoUtils from '~/classes/ExclusiveTableInfoUtils';

// parsers
import SequelizeParser from '~/parsers/SequelizeParser';
import DefaultValueParser from '~/parsers/DefaultValueParser';
import TypeScriptTypeParser from '~/parsers/TypeScriptTypeParser';

// types
import type { Knex } from 'knex';
import type {SequelizeType} from '~/constants/sequelize';

/**
 * Interface representing comprehensive metadata for a database table column.
 *
 * This interface encapsulates all relevant information about a column including
 * its basic properties, constraints, default values, and type mappings across
 * different systems (PostgreSQL, Sequelize, TypeScript).
 *
 * @example
 * ```typescript
 * const column: ColumnInfo = {
 *   table: 'users',
 *   name: 'email_address',
 *   propertyName: 'emailAddress',
 *   type: 'varchar',
 *   udtName: 'varchar',
 *   flags: {
 *     nullable: false,
 *     primary: false,
 *     autoIncrement: false,
 *     defaultNow: false
 *   },
 *   defaultValueRaw: null,
 *   defaultValue: null,
 *   comment: 'User email address',
 *   tsType: 'string',
 *   sequelizeType: 'STRING',
 *   sequelizeTypeParams: '(255)',
 *   tsInterface: null
 * };
 * ```
 */
export interface ColumnInfo {
  /** The name of the table containing this column */
  table: string;

  /** The original column name as defined in the database */
  name: string;

  /** The camelCase transformed property name for use in JavaScript/TypeScript */
  propertyName: string;

  /** The PostgreSQL data type of the column (e.g., 'varchar', 'integer', 'timestamp') */
  type: string;

  /**
   * The User Defined Type (UDT) name if the column uses a custom type.
   * Null for built-in PostgreSQL types.
   */
  udtName: string | null;

  /**
   * Object containing boolean flags for various column constraints and properties.
   * These flags provide quick access to common column characteristics.
   */
  flags: {
    /** Indicates whether the column accepts NULL values */
    nullable: boolean;

    /** Indicates whether the column is part of the primary key */
    primary: boolean;

    /** Indicates whether the column automatically increments (serial/bigserial) */
    autoIncrement: boolean;

    /**
     * Indicates whether a date/time column uses CURRENT_TIMESTAMP as default.
     * This is typically true for timestamp columns with automatic timestamp creation.
     */
    defaultNow: boolean;
  };

  /** The raw default value expression as stored in the database (e.g., "'default'::text") */
  defaultValueRaw: string | null;

  /**
   * The parsed and escaped default value ready for use.
   * The type varies based on the column type (string, number, boolean, object, etc.).
   */
  defaultValue: unknown;

  /** The comment/description associated with the column, if any */
  comment: string | null;

  /**
   * The TypeScript type equivalent for the column.
   * Examples: 'string', 'number', 'boolean', 'Date', 'MyInterface'
   */
  tsType: string;

  /** The Sequelize ORM type equivalent for the column (e.g., 'STRING', 'INTEGER', 'BOOLEAN') */
  sequelizeType: string;

  /**
   * The Sequelize type parameters specification.
   * Includes length, precision, scale, or other type-specific parameters.
   * Example: '(255)', '(10,2)', "['enum1', 'enum2']"
   */
  sequelizeTypeParams: string;

  /**
   * The generated TypeScript interface definition for complex types.
   * Non-null only for JSON/JSONB columns with structured data.
   * Example: 'interface MyJsonType { prop1: string; prop2: number; }'
   */
  tsInterface: string | null;
}

/**
 * Abstract utility class for retrieving and processing database table column information.
 *
 * This class provides a static method to fetch comprehensive column metadata from a
 * database table and transform it into a structured format suitable for ORM configuration
 * and TypeScript type generation. It handles the conversion between different type systems
 * and extracts additional metadata like comments and constraints.
 *
 * The class uses various utility classes and parsers to:
 * - Fetch raw column information from the database
 * - Parse and map PostgreSQL types to Sequelize types
 * - Generate TypeScript type equivalents
 * - Extract default values and constraints
 * - Handle special cases like JSON columns
 *
 * @example
 * ```typescript
 * const columns = await TableColumns.list(knex, 'users', 'public');
 * // Returns array of ColumnInfo objects for all columns in the users table
 * ```
 */
export default abstract class TableColumns {
  /**
   * Retrieves comprehensive column information for a database table.
   *
   * This method fetches all column metadata for the specified table and transforms
   * it into a structured format that includes type mappings, constraints, defaults,
   * and other relevant information. The process involves:
   *
   * 1. Fetching raw table and column information from the database
   * 2. Parsing each column's metadata and type information
   * 3. Converting PostgreSQL types to equivalent Sequelize and TypeScript types
   * 4. Extracting and processing default values (including special handling for JSON/JSONB)
   * 5. Determining column constraints and properties (nullable, primary, auto-increment, etc.)
   * 6. Generating TypeScript interfaces for complex types when applicable
   *
   * @param knex - The configured Knex.js instance for database connection
   * @param tableName - The name of the table to retrieve column information for
   * @param schemaName - The schema name containing the table (defaults to 'public')
   * @returns Promise resolving to an array of ColumnInfo objects representing all columns
   *
   * @throws {Error} When the table doesn't exist or database access fails
   * @throws {Error} When column parsing encounters unsupported types
   *
   * @example
   * ```typescript
   * // Basic usage
   * const columns = await TableColumns.list(knex, 'users');
   *
   * // With explicit schema
   * const columns = await TableColumns.list(knex, 'products', 'inventory');
   *
   * // Processing the results
   * columns.forEach(col => {
   *   console.log(`${col.name}: ${col.tsType} (${col.sequelizeType})`);
   * });
   * ```
   */
  public static async list(knex: Knex, tableName: string, schemaName: string = 'public'): Promise<ColumnInfo[]> {
    const columnInfos: ColumnInfo[] = [];
    const tableColumns = await DbUtils.getExclusiveTableInfo(knex, tableName, schemaName);

    for (const columnInfo of tableColumns) {
      const { name, column, element, info } = columnInfo;

      const columnType = element.dataType.toLowerCase();

      const [sequelizeType, sequelizeTypeParams] = SequelizeParser.parse(columnInfo) || [];

      const defaultValue = DefaultValueParser.parse(sequelizeType as SequelizeType, columnInfo) as string;

      let jsonbDataType = defaultValue;
      if (sequelizeType === 'JSONB' && jsonbDataType === '{}') {
        jsonbDataType = await DataUtils.getLongestJson(knex, { schemaName, tableName, columnName: column?.name ?? '' });
      }

      columnInfos.push({
        table: info.table_name,
        name,
        propertyName: camelCase(name),
        type: columnType,
        udtName: ColumnInfoUtils.toUdtType(info),
        comment: column.comment,
        sequelizeType: sequelizeType as string,
        sequelizeTypeParams: sequelizeTypeParams as string,
        defaultValueRaw: info.column_default,
        defaultValue,
        tsType: TypeScriptTypeParser.parse({
          columnType,
          columnInfo: info,
          sequelizeType: sequelizeType as SequelizeType,
          sequelizeTypeParams: sequelizeTypeParams as string,
        }),
        tsInterface: jsonbDataType?.trim?.()
          ? TypeScriptTypeParser.jsonToInterface({
              columnType: columnType,
              columnName: name,
              tableName,
              defaultValue: jsonbDataType,
            })
          : null,
        flags: {
          nullable: column.nullable,
          primary: ExclusiveTableInfoUtils.isPrimaryKey(columnInfo),
          autoIncrement: ExclusiveTableInfoUtils.isSerialKey(columnInfo),
          defaultNow: ExclusiveTableInfoUtils.isDefaultNow(columnInfo),
        },
      });
    }

    return columnInfos;
  }
}
