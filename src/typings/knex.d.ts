/**
 * @author Junaid Atari <mj.atari@gmail.com>
 * @copyright 2025 Junaid Atari
 * @see https://github.com/blacksmoke26
 *
 * Database schema type definitions for raw table information.
 * These interfaces represent the structure of database metadata retrieved
 * from information_schema queries.
 */
import type { ForeignKey } from '~/typings/utils';

/**
 * Represents detailed information about a table column from the database.
 * Contains all column attributes including type, constraints, and metadata.
 */
export interface TableColumnRaw {
  /** The catalog containing the table (database name) */
  readonly table_catalog: string;
  /** The schema containing the table */
  readonly table_schema: string;
  /** The name of the table */
  readonly table_name: string;
  /** The name of the column */
  readonly column_name: string;
  /** The ordinal position of the column in the table (1-based) */
  readonly ordinal_position: number;
  /** The default value expression for the column */
  readonly column_default: string;
  /** Whether the column can contain NULL values */
  readonly is_nullable: 'YES' | 'NO';
  /** The data type of the column */
  readonly data_type: string;
  /** Maximum length for character data types */
  readonly character_maximum_length: string | null;
  /** Maximum octet length for character data types */
  readonly character_octet_length: string | null;
  /** Precision for numeric data types */
  readonly numeric_precision: string | null;
  /** Precision radix for numeric data types */
  readonly numeric_precision_radix: string | null;
  /** Scale for numeric data types */
  readonly numeric_scale: string | null;
  /** Precision for datetime data types */
  readonly datetime_precision: string | null;
  /** Interval type for interval data types */
  readonly interval_type: string | null;
  /** Precision for interval data types */
  readonly interval_precision: string | null;
  /** Character set catalog */
  readonly character_set_catalog: string | null;
  /** Character set schema */
  readonly character_set_schema: string | null;
  /** Character set name */
  readonly character_set_name: string | null;
  /** Collation catalog */
  readonly collation_catalog: string | null;
  /** Collation schema */
  readonly collation_schema: string | null;
  /** Collation name */
  readonly collation_name: string | null;
  /** Domain catalog */
  readonly domain_catalog: string | null;
  /** Domain schema */
  readonly domain_schema: string | null;
  /** Domain name */
  readonly domain_name: string | null;
  /** User-defined type catalog */
  readonly udt_catalog: string;
  /** User-defined type schema */
  readonly udt_schema: string;
  /** User-defined type name */
  readonly udt_name: string;
  /** Scope catalog */
  readonly scope_catalog: string | null;
  /** Scope schema */
  readonly scope_schema: string | null;
  /** Scope name */
  readonly scope_name: string | null;
  /** Maximum cardinality for array types */
  readonly maximum_cardinality: string | null;
  /** DTD identifier */
  readonly dtd_identifier: string;
  /** Whether the column is self-referencing */
  readonly is_self_referencing: 'YES' | 'NO';
  /** Whether the column is an identity column */
  readonly is_identity: 'YES' | 'NO';
  /** Identity generation type */
  readonly identity_generation: string | null;
  /** Identity start value */
  readonly identity_start: string | null;
  /** Identity increment value */
  readonly identity_increment: string | null;
  /** Identity maximum value */
  readonly identity_maximum: string | null;
  /** Identity minimum value */
  readonly identity_minimum: string | null;
  /** Whether identity cycles */
  readonly identity_cycle: 'YES' | 'NO';
  /** Whether column is generated and how */
  readonly is_generated: 'NEVER' | string;
  /** Generation expression for computed columns */
  readonly generation_expression: string | null;
  /** Whether the column is updatable */
  readonly is_updatable: 'YES' | 'NO';
}

/**
 * Represents raw foreign key constraint information from the database.
 * Includes details about the constraint, referenced table/column, and rules.
 */
export interface ForeignKeyRaw {
  /** Schema containing the foreign key constraint */
  readonly fk_schema: string;
  /** Name of the foreign key constraint */
  readonly fk_constraint_name: string;
  /** Schema containing the table with the foreign key */
  readonly table_schema: string;
  /** Name of the table containing the foreign key */
  readonly table_name: string;
  /** Name of the column that forms the foreign key */
  readonly column_name: string;
  /** Default value of the foreign key column */
  readonly column_default: string | null;
  /** Schema containing the referenced table */
  readonly referenced_schema: string;
  /** Name of the referenced table */
  readonly referenced_table: string;
  /** Name of the referenced column */
  readonly referenced_column: string;
  /** Type of constraint (always 'FOREIGN KEY') */
  readonly constraint_type: 'FOREIGN KEY';
  /** Rule for updates to the referenced key */
  readonly update_rule: ForeignKey['rule']['update'];
  /** Rule for deletions of the referenced key */
  readonly delete_rule: ForeignKey['rule']['delete'];
  /** Match option for the foreign key */
  readonly match_option: ForeignKey['matchOption'];
  /** Whether the constraint is deferrable */
  readonly is_deferrable: boolean;
  /** Whether the constraint is initially deferred */
  readonly is_deferred: boolean;
  /** Comment on the constraint */
  readonly constraint_comment: string | null;
  /** Comment on the source column */
  readonly source_column_comment: string | null;
  /** Comment on the referenced column */
  readonly referenced_column_comment: string | null;
  /** Comment on the source table */
  readonly source_table_comment: string | null;
  /** Comment on the referenced table */
  readonly referenced_table_comment: string | null;
}

/**
 * Represents raw index information from the database.
 * Contains index metadata including type, columns, and comments.
 */
export interface IndexRaw {
  /** Schema name where the index is defined */
  readonly schema_name: string;
  /** Name of the table the index belongs to */
  readonly table_name: string;
  /** Name of the index */
  readonly index_name: string;
  /** Type of index (e.g., BTREE, HASH) */
  readonly index_type: string;
  /** Type of constraint if index represents a constraint */
  readonly constraint_type: string;
  /** Column names included in the index (comma-separated) */
  readonly columns: string;
  /** Optional comment describing the index */
  readonly index_comment: string | null;
}

/**
 * Represents raw relationship information between tables.
 * Used to define table connections, including many-to-many relationships.
 */
export interface RelationshipRaw {
  /** Schema containing the source table */
  readonly source_schema: string;
  /** Name of the source table */
  readonly source_table: string;
  /** Name of the column in the source table */
  readonly source_column: string;
  /** Schema containing the target table */
  readonly target_schema: string;
  /** Name of the target table */
  readonly target_table: string;
  /** Name of the column in the target table */
  readonly target_column: string;
  /** Type of relationship between the tables */
  readonly relationship_type: string;
  /** Schema containing the junction table (for many-to-many relationships) */
  readonly junction_schema: string | null;
  /** Junction table name (for many-to-many relationships) */
  readonly junction_table: string | null;
}
