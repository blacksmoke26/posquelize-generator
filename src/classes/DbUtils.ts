/**
 * @fileoverview Database utilities for PostgreSQL schema introspection
 * @author Junaid Atari <mj.atari@gmail.com>
 * @copyright 2025 Junaid Atari
 * @see https://github.com/blacksmoke26
 * @description This module provides a comprehensive set of utility methods for querying and analyzing PostgreSQL database schemas.
 * It offers functionality to inspect schemas, tables, columns, relationships, indexes, foreign keys, triggers,
 * and various PostgreSQL-specific types like geometry, geography, composite types, and domain types.
 * The module is designed to work with Knex.js query builder and returns detailed metadata about database objects.
 */

// helpers
import FileHelper from '~/helpers/FileHelper';

// types
import type { Knex } from 'knex';
import type { TableColumnRaw, ForeignKeyRaw, IndexRaw, RelationshipRaw } from '~/typings/knex';
import type {
  TableIndex,
  ForeignKey,
  TableGeoType,
  TableElementType,
  TableColumnType,
  CompositeTypeData,
  DomainTypeData,
  ExclusiveColumnInfo,
  Relationship,
} from '~/typings/utils';

/**
 * Enum representing the types of constraints that can be applied to a database table.
 * @enum {string}
 * @readonly
 */
export enum ConstraintType {
  /** Primary key constraint - Ensures unique identification of each row in a table */
  PrimaryKey = 'PRIMARY KEY',
  /** Foreign key constraint - Enforces referential integrity between tables */
  ForeignKey = 'FOREIGN KEY',
  /** Unique constraint - Ensures all values in a column are unique */
  Unique = 'UNIQUE',
}

/**
 * Enum representing the types of relationships that can exist between database tables.
 * These relationships define how tables are connected and interact with each other.
 * @enum {string}
 * @readonly
 */
export enum RelationshipType {
  /** BelongsTo relationship (many-to-one) - Multiple records in this table reference one record in the target table */
  BelongsTo = 'BelongsTo',
  /** HasOne relationship (one-to-one) - One record in this table references one record in the target table */
  HasOne = 'HasOne',
  /** HasMany relationship (one-to-many) - One record in this table is referenced by multiple records in the target table */
  HasMany = 'HasMany',
  /** ManyToMany relationship (many-to-many) - Records in this table are linked to multiple records in the target table via a junction table */
  ManyToMany = 'ManyToMany',
}

/**
 * Utility class for database operations providing static methods to query table information.
 * This class serves as a centralized interface for database schema introspection,
 * offering methods to retrieve metadata about schemas, tables, columns, constraints,
 * relationships, and various PostgreSQL-specific features.
 *
 * @abstract
 * @readonly
 */
export default abstract class DbUtils {
  /**
   * Retrieves a list of user-defined schema names from the database.
   * Filters out system schemas (pg_catalog, information_schema, pg_toast)
   * and any additional system schemas found in the database.
   *
   * @param {Knex} knex - Knex instance configured for database connection
   * @returns {Promise<Readonly<string[]>>} Promise resolving to a readonly array of schema names
   *
   * @example
   * ```typescript
   * const schemas = await DbUtils.getSchemas(knex);
   * schemas.forEach(schema => console.log('Schema:', schema));
   * ```
   */
  public static async getSchemas(knex: Knex): Promise<Readonly<string[]>> {
    const list: Awaited<{ schema_name: string }[]> = await knex
      .select('schema_name')
      .from('information_schema.schemata')
      .whereNotIn('schema_name', ['information_schema'])
      .andWhereRaw(`schema_name NOT ILIKE 'pg_%'`)
      .orderBy('schema_name');

    return list.map((x) => x.schema_name);
  }

  /**
   * Retrieves a list of table names from a specific schema in the database.
   * Excludes system tables like 'SequelizeMeta' and only returns base tables (not views).
   *
   * @param {Knex} knex - Knex instance configured for database connection
   * @param {string} [schemaName='public'] - Name of the schema to query tables from
   * @returns {Promise<Readonly<string[]>>} Promise resolving to a readonly array of table names
   *
   * @example
   * ```typescript
   * const tables = await DbUtils.getTables(knex, 'public');
   * console.log('Tables:', tables);
   * ```
   */
  public static async getTables(
    knex: Knex,
    schemaName: string = 'public',
  ): Promise<Readonly<string[]>> {
    const query = `
    SELECT table_name
    FROM
      information_schema.TABLES
    WHERE
      table_type = 'BASE TABLE'
      AND table_name <> 'SequelizeMeta'
      AND table_schema = ?
    ORDER BY
      table_name ASC`;

    const { rows = [] } = await knex.raw<{
      rows: { table_name: string }[];
    }>(query, [schemaName]);

    return rows.map((x) => x.table_name);
  }

  /**
   * Retrieves comprehensive relationship information between database tables.
   * Analyzes foreign key constraints to determine relationships and their types.
   * Returns detailed information about source, target, and junction tables when applicable.
   *
   * @param {Knex} knex - Knex instance configured for database connection
   * @returns {Promise<Relationship[]>} Promise resolving to an array of relationship objects
   *
   * @example
   * ```typescript
   * const relationships = await DbUtils.getRelationships(knex);
   * relationships.forEach(rel => {
   *   console.log(`${rel.type}: ${rel.source.table} -> ${rel.target.table}`);
   * });
   * ```
   */
  public static async getRelationships(knex: Knex): Promise<Relationship[]> {
    const query = FileHelper.readSqlFile('database-relationships.sql');

    const relations: Relationship[] = [];

    try {
      const { rows = [] } = await knex.raw<{
        rows: RelationshipRaw[];
      }>(query);

      for (const row of rows) {
        relations.push({
          type: RelationshipType[row.relationship_type as keyof typeof RelationshipType],
          source: {
            schema: row.source_schema,
            table: row.source_table,
            column: row.source_column,
          },
          target: {
            schema: row.target_schema,
            table: row.target_table,
            column: row.target_column,
          },
          junction: { schema: row.junction_schema, table: row.junction_table },
        });
      }

      return relations;
    } catch {
      return [];
    }
  }

  /**
   * Retrieves detailed foreign key information for database tables.
   * Returns comprehensive metadata including constraint details, referenced tables,
   * update/delete rules, and comments. Can be filtered by table and schema.
   *
   * @param {Knex} knex - Knex instance configured for database connection
   * @param {string | null} [tableName=null] - Optional table name to filter foreign keys
   * @param {string | null} [schemaName=null] - Optional schema name to filter foreign keys
   * @returns {Promise<ForeignKey[]>} Promise resolving to an array of foreign key objects
   *
   * @example
   * ```typescript
   * // Get all foreign keys
   * const allFks = await DbUtils.getForeignKeys(knex);
   *
   * // Get foreign keys for a specific table
   * const tableFks = await DbUtils.getForeignKeys(knex, 'users', 'public');
   * ```
   */
  public static async getForeignKeys(knex: Knex, tableName: string | null = null, schemaName: string | null = null): Promise<ForeignKey[]> {
    const query = FileHelper.readSqlFile('database-foreign-keys.sql');

    try {
      const { rows = [] } = await knex.raw<{
        rows: ForeignKeyRaw[];
      }>(query);

      return rows
        .filter((x) => {
          let isSchema: boolean = true;
          let isTable: boolean = true;

          if (schemaName) {
            isSchema = x.table_schema === schemaName;
          }
          if (tableName) {
            isTable = x.table_name === tableName;
          }

          return isSchema && isTable;
        })
        .map(
          (x) =>
            ({
              schema: x.fk_schema,
              constraintName: x.fk_constraint_name,
              comment: x.constraint_comment,
              tableSchema: x.table_schema,
              tableName: x.table_name,
              columnName: x.column_name,
              defaultValue: x.column_default,
              referenced: {
                schema: x.referenced_schema,
                table: x.referenced_table,
                column: x.referenced_column,
                tableComment: x.referenced_table_comment,
                columnComment: x.referenced_column_comment,
              },
              source: {
                tableComment: x.source_table_comment,
                columnComment: x.source_column_comment,
              },
              rule: {
                update: x.update_rule,
                delete: x.delete_rule,
              },
              matchOption: x.match_option,
              isDeferrable: x.is_deferrable,
              isDeferred: x.is_deferred,
            }) satisfies ForeignKey,
        );
    } catch {
      return [];
    }
  }

  /**
   * Retrieves index information for database tables.
   * Returns details about index types, constraints, columns, and comments.
   * Can be filtered by table and schema to retrieve specific index metadata.
   *
   * @param {Knex} knex - Knex instance configured for database connection
   * @param {string | null} [tableName=null] - Optional table name to filter indexes
   * @param {string | null} [schemaName=null] - Optional schema name to filter indexes
   * @returns {Promise<TableIndex[]>} Promise resolving to an array of index objects
   *
   * @example
   * ```typescript
   * // Get all indexes in the database
   * const allIndexes = await DbUtils.getIndexes(knex);
   *
   * // Get indexes for a specific table
   * const tableIndexes = await DbUtils.getIndexes(knex, 'users', 'public');
   * ```
   */
  public static async getIndexes(knex: Knex, tableName: string | null = null, schemaName: string | null = null): Promise<TableIndex[]> {
    const query = FileHelper.readSqlFile('database-indexes.sql');

    try {
      const { rows = [] } = await knex.raw<{
        rows: IndexRaw[];
      }>(query);

      return rows
        .filter((x) => {
          let isSchema: boolean = true;
          let isTable: boolean = true;

          if (schemaName) {
            isSchema = x.schema_name === schemaName;
          }
          if (tableName) {
            isTable = x.table_name === tableName;
          }

          return isSchema && isTable;
        })
        .map(
          (x) =>
            ({
              schema: x.schema_name,
              table: x.table_name,
              name: x.index_name,
              type: x.index_type as TableIndex['type'],
              constraint: x.constraint_type as TableIndex['constraint'],
              columns: x.columns.split(','),
              comment: x.index_comment,
            }) satisfies TableIndex,
        );
    } catch {
      return [];
    }
  }

  /**
   * Retrieves comprehensive information about a table's columns, including types, elements, and additional metadata.
   * Combines data from multiple sources to provide a complete picture of each column including
   * its type information, element types (for arrays), and informational metadata.
   *
   * @param {Knex} knex - Knex instance configured for database connection
   * @param {string} tableName - Name of the table to query
   * @param {string} [schemaName='public'] - Schema name where the table resides
   * @returns {Promise<ExclusiveColumnInfo[]>} Promise resolving to an array of comprehensive column information
   *
   * @example
   * ```typescript
   * const columns = await DbUtils.getExclusiveTableInfo(knex, 'users', 'public');
   * columns.forEach(col => {
   *   console.log(`Column: ${col.name}, Type: ${col.column.dataType}`);
   * });
   * ```
   */
  public static async getExclusiveTableInfo(
    knex: Knex,
    tableName: string,
    schemaName: string = 'public',
  ): Promise<ExclusiveColumnInfo[]> {
    const [columnTypes, elementTypes, columnsInfo] = await Promise.all([
      this.getTableColumnTypes(knex, tableName, schemaName),
      this.getTableElementTypes(knex, tableName, schemaName),
      this.getTableColumnsInfo(knex, tableName, schemaName),
    ]);

    const list: ExclusiveColumnInfo[] = [];

    for (const column of columnTypes) {
      list.push({
        name: column.name!,
        column,
        element: elementTypes.find((x) => x.columnName === column.name)!,
        info: columnsInfo.find((x) => x.column_name === column.name)!,
      });
    }

    return list;
  }

  /**
   * Retrieves detailed column information for a specific table from the information schema.
   * Returns standard PostgreSQL column metadata including data types, defaults, nullability,
   * character information, and other standard column attributes.
   *
   * @param {Knex} knex - Knex instance configured for database connection
   * @param {string} tableName - Name of the table to query
   * @param {string} [schemaName='public'] - Schema name where the table resides
   * @returns {Promise<TableColumnRaw[]>} Promise resolving to an array of raw column information
   *
   * @example
   * ```typescript
   * const columns = await DbUtils.getTableColumnsInfo(knex, 'users');
   * columns.forEach(col => {
   *   console.log(`${col.column_name}: ${col.data_type}`);
   * });
   * ```
   */
  public static async getTableColumnsInfo(
    knex: Knex,
    tableName: string,
    schemaName: string = 'public',
  ): Promise<TableColumnRaw[]> {
    return (await knex
      .select('*')
      .from('information_schema.columns')
      .where({ table_name: tableName, table_schema: schemaName })) as Awaited<
      TableColumnRaw[]
    >;
  }

  /**
   * Retrieves detailed column type information for a specified table.
   * Provides PostgreSQL-specific type details including array dimensions,
   * collation, default values, identity information, and generation expressions.
   *
   * @param {Knex} knex - Knex instance configured for database connection
   * @param {string} tableName - Name of the table to query
   * @param {string} [schemaName='public'] - Schema name where the table resides
   * @returns {Promise<Readonly<TableColumnType[]>>} Promise resolving to a readonly array of column type details
   *
   * @example
   * ```typescript
   * const columnTypes = await DbUtils.getTableColumnTypes(knex, 'users');
   * columnTypes.forEach(col => {
   *   console.log(`${col.name}: ${col.dataType}`);
   * });
   * ```
   */
  public static async getTableColumnTypes(
    knex: Knex,
    tableName: string,
    schemaName: string = 'public',
  ): Promise<Readonly<TableColumnType[]>> {
    const query = FileHelper.readSqlFile('table-column-types.sql');

    const { rows = [] } = await knex.raw<{
      rows: TableColumnType[];
    }>(query, [tableName, schemaName]);

    return rows;
  }

  /**
   * Retrieves element type information for columns in a specified table.
   * Provides detailed information about complex column types including enums,
   * composite types, domain types, and array element types. For complex types,
   * retrieves additional metadata such as enum values, composite type fields,
   * and domain constraints.
   *
   * @param {Knex} knex - Knex instance configured for database connection
   * @param {string} tableName - Name of the table to query
   * @param {string} [schemaName='public'] - Schema name where the table resides
   * @returns {Promise<Readonly<TableElementType[]>>} Promise resolving to a readonly array of element type information
   *
   * @example
   * ```typescript
   * const elementTypes = await DbUtils.getTableElementTypes(knex, 'users');
   * elementTypes.forEach(elem => {
   *   if (elem.isEnum) {
   *     console.log(`Enum values for ${elem.columnName}:`, elem.enumData);
   *   }
   * });
   * ```
   */
  public static async getTableElementTypes(
    knex: Knex,
    tableName: string,
    schemaName: string = 'public',
  ): Promise<Readonly<TableElementType[]>> {
    const query = FileHelper.readSqlFile('table-element-types.sql');

    const { rows = [] } = (await knex.raw(query, [
      tableName,
      schemaName,
    ])) as Awaited<{
      rows: TableElementType[];
    }>;

    const finalRows: TableElementType[] = [];

    for await (const row of rows) {
      const [compositeData, domainData] = await Promise.all([
        this.getCompositeTypeData(knex, tableName, row.columnName),
        this.getDomainTypeData(knex, tableName, row.columnName),
      ]);

      const isEnum = row.enumData !== null;

      finalRows.push({
        columnName: row.columnName,
        dataType: row.dataType,
        elementType: row.elementType,
        udtName: row.udtName,
        isEnum,
        enumData: isEnum
          ? String(row.enumData).replace(/[{}]+/g, '').split(',')
          : null,
        isComposite: compositeData !== null,
        compositeData,
        isDomain: domainData !== null,
        domainData,
      });
    }

    return finalRows;
  }

  /**
   * Retrieves composite type information for a specific table column.
   * Composite types (also known as row types or user-defined types) contain
   * multiple fields with their own data types. This method returns the structure
   * of the composite type if the column uses one.
   *
   * @param {Knex} knex - Knex instance configured for database connection
   * @param {string} tableName - Name of the table containing the column
   * @param {string} columnName - Name of the column to query
   * @param {string} [schemaName='public'] - Schema name where the table resides
   * @returns {Promise<Readonly<CompositeTypeData | null>>} Promise resolving to composite type data or null if not a composite type
   *
   * @example
   * ```typescript
   * const composite = await DbUtils.getCompositeTypeData(knex, 'users', 'address');
   * if (composite) {
   *   console.log('Composite type fields:', composite.fields);
   * }
   * ```
   */
  public static async getCompositeTypeData(
    knex: Knex,
    tableName: string,
    columnName: string,
    schemaName: string = 'public',
  ): Promise<Readonly<CompositeTypeData | null>> {
    const query = FileHelper.readSqlFile('composite-type-data.sql');

    const { rows = [] } = (await knex.raw(query, [
      tableName,
      columnName,
      schemaName,
    ])) as Awaited<{
      rows: CompositeTypeData[];
    }>;

    return rows?.[0] ?? null;
  }

  /**
   * Retrieves domain type information for a specific table column.
   * Domain types are user-defined data types based on underlying base types
   * with optional constraints. This method returns the domain definition
   * including its base type and any applied constraints.
   *
   * @param {Knex} knex - Knex instance configured for database connection
   * @param {string} tableName - Name of the table containing the column
   * @param {string} columnName - Name of the column to query
   * @param {string} [schemaName='public'] - Schema name where the table resides
   * @returns {Promise<Readonly<DomainTypeData | null>>} Promise resolving to domain type data or null if not a domain type
   *
   * @example
   * ```typescript
   * const domain = await DbUtils.getDomainTypeData(knex, 'users', 'email');
   * if (domain) {
   *   console.log('Domain base type:', domain.baseType);
   *   console.log('Constraints:', domain.constraints);
   * }
   * ```
   */
  public static async getDomainTypeData(
    knex: Knex,
    tableName: string,
    columnName: string,
    schemaName: string = 'public',
  ): Promise<Readonly<DomainTypeData | null>> {
    const query = FileHelper.readSqlFile('domain-type-data.sql');

    try {
      const { rows = [] } = await knex.raw(query, [
        tableName,
        columnName,
        schemaName,
      ]);

      if (!rows.length) {
        return null;
      }

      return {
        domainName: rows[0].domain_name,
        baseType: rows[0].base_type,
        constraints: rows.map((row: any) => ({
          name: row.constraint_name,
          checkExpression: row.check_expression || undefined,
          notNull: row.constraint_type === 'n',
          default: row.default_value || undefined,
        })),
      };
    } catch {
      return null;
    }
  }

  /**
   * Counts the number of triggers defined on a specified table.
   * Triggers are special stored procedures that automatically execute
   * in response to certain events on a particular table or view.
   *
   * @param {Knex} knex - Knex instance configured for database connection
   * @param {string} tableName - Name of the table to query for triggers
   * @param {string} [schemaName='public'] - Schema name where the table resides
   * @returns {Promise<number>} Promise resolving to the count of triggers on the table
   *
   * @example
   * ```typescript
   * const triggerCount = await DbUtils.getTriggersCount(knex, 'users');
   * console.log(`Table 'users' has ${triggerCount} triggers`);
   * ```
   */
  public static async getTriggersCount(
    knex: Knex,
    tableName: string,
    schemaName: string = 'public',
  ): Promise<number> {
    const query = FileHelper.readSqlFile('triggers-count.sql');
    const { rows = [] } = await knex.raw<{
      rows: { trigger_count: string }[];
    }>(query, [tableName, schemaName]);

    return Number(rows?.[0]?.trigger_count ?? 0);
  }

  /**
   * Retrieves geographic column types (geography) for a specified table.
   * Geography types store geographic data using spherical coordinates
   * on the Earth's surface. This requires PostGIS extension to be installed.
   *
   * @param {Knex} knex - Knex instance configured for database connection
   * @param {string} tableName - Name of the table to query
   * @param {string} [schemaName='public'] - Schema name where the table resides
   * @returns {Promise<Readonly<TableGeoType[]>>} Promise resolving to a readonly array of geography column types
   *
   * @example
   * ```typescript
   * const geoColumns = await DbUtils.getTableGeographyTypes(knex, 'locations');
   * geoColumns.forEach(col => {
   *   console.log(`Geography column: ${col.column_name}, Type: ${col.type}`);
   * });
   * ```
   */
  public static async getTableGeographyTypes(
    knex: Knex,
    tableName: string,
    schemaName: string = 'public',
  ): Promise<Readonly<TableGeoType[]>> {
    const query = FileHelper.readSqlFile('table-geography-types.sql');

    try {
      const { rows = [] } = await knex.raw<{
        rows: TableGeoType[];
      }>(query, [tableName, schemaName]);
      return rows;
    } catch {
      return [];
    }
  }

  /**
   * Retrieves geometry column types for a specified table.
   * Geometry types store geometric data using planar coordinates.
   * This requires PostGIS extension to be installed and is commonly used
   * for spatial data analysis and mapping applications.
   *
   * @param {Knex} knex - Knex instance configured for database connection
   * @param {string} tableName - Name of the table to query
   * @param {string} [schemaName='public'] - Schema name where the table resides
   * @returns {Promise<Readonly<TableGeoType[]>>} Promise resolving to a readonly array of geometry column types
   *
   * @example
   * ```typescript
   * const geometryColumns = await DbUtils.getTableGeometryTypes(knex, 'maps');
   * geometryColumns.forEach(col => {
   *   console.log(`Geometry column: ${col.column_name}, SRID: ${col.srid}`);
   * });
   * ```
   */
  public static async getTableGeometryTypes(
    knex: Knex,
    tableName: string,
    schemaName: string = 'public',
  ): Promise<Readonly<TableGeoType[]>> {
    try {
      const query = FileHelper.readSqlFile('table-geometry-types.sql');

      const { rows = [] } = await knex.raw<{
        rows: TableGeoType[];
      }>(query, [tableName, schemaName]);

      return rows;
    } catch {
      return [];
    }
  }
}
