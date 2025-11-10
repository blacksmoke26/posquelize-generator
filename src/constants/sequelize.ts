/**
 * @fileoverview This module provides type definitions and mappings for PostgreSQL data types
 * to their corresponding Sequelize data type representations. It serves as a comprehensive
 * reference for converting between PostgreSQL native types and Sequelize ORM types, enabling
 * smooth database schema definitions and migrations.
 *
 * @author Junaid Atari <mj.atari@gmail.com>
 * @copyright 2025 Junaid Atari
 * @see https://github.com/blacksmoke26
 * @version 1.0.0
 * @since 2025-01-01
 *
 * @example
 * ```typescript
 * import { TypesMap, SequelizeType } from './types';
 *
 * // Using the type mapping
 * const sequelizeType: SequelizeType = TypesMap.integer; // Returns 'INTEGER'
 *
 * // Working with range types
 * const dateRange = TypesMap.daterange; // Returns 'RANGE(DATEONLY)'
 * ```
 */

import { DataTypes } from 'sequelize';

/**
 * Represents all supported Sequelize data types that can be used for database field definitions.
 * This union type encompasses the complete set of available data types in Sequelize,
 * providing type safety for schema definitions and model configurations.
 *
 * Each type corresponds to a specific database column type and affects how data is stored,
 * validated, and retrieved. The types range from basic numeric and string types to
 * specialized types like geometric shapes and network addresses.
 *
 * @type {string}
 * @see {@link https://sequelize.org/docs/v6/other-topics/other-data-types/}
 */
export type SequelizeType =
  | 'ABSTRACT'      /** Abstract base type for custom implementations */
  | 'STRING'        /** Variable-length string with configurable length */
  | 'CHAR'          /** Fixed-length character string */
  | 'TEXT'          /** Unlimited-length text field */
  | 'NUMBER'        /** Generic numeric type (deprecated in favor of specific types) */
  | 'TINYINT'       /** 1-byte integer (-128 to 127) */
  | 'SMALLINT'      /** 2-byte integer (-32768 to 32767) */
  | 'MEDIUMINT'     /** 3-byte integer (-8388608 to 8388607) */
  | 'INTEGER'       /** 4-byte integer (-2147483648 to 2147483647) */
  | 'BIGINT'        /** 8-byte integer */
  | 'FLOAT'         /** Single-precision floating point number */
  | 'REAL'          /** Double-precision floating point number (PostgreSQL specific) */
  | 'DOUBLE'        /** Double-precision floating point number */
  | 'DECIMAL'       /** Fixed-point decimal number with precision and scale */
  | 'BOOLEAN'       /** True/false boolean value */
  | 'TIME'          /** Time value without timezone */
  | 'DATE'          /** Date and time value */
  | 'DATEONLY'      /** Date value without time */
  | 'HSTORE'        /** Key-value store (PostgreSQL specific) */
  | 'JSON'          /** JSON data stored as text */
  | 'JSONB'         /** Binary JSON with indexing support (PostgreSQL) */
  | 'NOW'           /** Current timestamp function */
  | 'BLOB'          /** Binary large object */
  | 'RANGE'         /** Range type for numeric and date values */
  | 'UUID'          /** Universally unique identifier */
  | 'UUIDV1'        /** UUID version 1 generator */
  | 'UUIDV4'        /** UUID version 4 generator */
  | 'VIRTUAL'       /** Virtual field not stored in database */
  | 'ENUM'          /** Enumeration of predefined values */
  | 'ARRAY'         /** Array type (PostgreSQL specific) */
  | 'GEOMETRY'      /** Geometric spatial data */
  | 'GEOGRAPHY'     /** Geographic spatial data with Earth curvature */
  | 'CIDR'          /** Classless Inter-Domain Routing (IP address range) */
  | 'INET'          /** IP address (IPv4 or IPv6) */
  | 'MACADDR'       /** MAC address */
  | 'CITEXT'        /** Case-insensitive text (PostgreSQL extension) */
  | 'TSVECTOR';     /** Text search vector for full-text search (PostgreSQL) */

/**
 * Comprehensive mapping of PostgreSQL native data types to their corresponding Sequelize
 * type representations. This mapping enables seamless conversion between PostgreSQL schema
 * definitions and Sequelize model definitions, ensuring proper type handling and compatibility.
 *
 * The mapping covers all major PostgreSQL data type categories:
 * - Numeric types (integers, floating-point, decimal)
 * - Character types (fixed and variable length)
 * - Temporal types (dates, times, timestamps)
 * - Specialized types (JSON, arrays, geometric, network)
 * - PostgreSQL-specific extensions (range, hstore, tsvector)
 *
 * @type {readonly Object<string, SequelizeType|typeof DataTypes.ARRAY>}
 * @const
 *
 * @example
 * // Basic numeric mapping
 * const userIdType = TypesMap.integer;      // Returns 'INTEGER'
 * const priceType = TypesMap.decimal;      // Returns 'DECIMAL'
 *
 * // Array handling
 * const tagsArrayType = TypesMap.array;     // Returns DataTypes.ARRAY
 *
 * // PostgreSQL extensions
 * const addressType = TypesMap.inet;       // Returns 'INET'
 * const geoType = TypesMap.point;         // Returns "GEOMETRY('POINT')"
 */
export const TypesMap = {
  // Numeric types
  /** Maps PostgreSQL int2 (2-byte integer) to Sequelize SMALLINT */
  int2: 'SMALLINT',
  /** Maps PostgreSQL int4 (4-byte integer) to Sequelize INTEGER */
  int4: 'INTEGER',
  /** Maps PostgreSQL int8 (8-byte integer) to Sequelize BIGINT */
  int8: 'BIGINT',
  /** Maps PostgreSQL smallint alias to Sequelize SMALLINT */
  smallint: 'SMALLINT',
  /** Maps PostgreSQL integer to Sequelize INTEGER */
  integer: 'INTEGER',
  /** Maps PostgreSQL bigint to Sequelize BIGINT */
  bigint: 'BIGINT',
  /** Maps PostgreSQL decimal to Sequelize DECIMAL */
  decimal: 'DECIMAL',
  /** Maps PostgreSQL numeric (synonymous with decimal) to Sequelize DECIMAL */
  numeric: 'DECIMAL',
  /** Maps PostgreSQL num alias to Sequelize DECIMAL */
  num: 'DECIMAL',
  /** Maps PostgreSQL real to Sequelize REAL */
  real: 'REAL',
  /** Maps PostgreSQL double to Sequelize DOUBLE */
  double: 'DOUBLE',
  /** Maps PostgreSQL double precision to Sequelize DOUBLE */
  'double precision': 'DOUBLE',
  /** Maps PostgreSQL serial (auto-incrementing integer) to Sequelize INTEGER */
  serial: 'INTEGER',
  /** Maps PostgreSQL bigserial (auto-incrementing bigint) to Sequelize BIGINT */
  bigserial: 'BIGINT',

  // Ranges (PostgreSQL only)
  /** Maps PostgreSQL int4range to Sequelize RANGE(INTEGER) */
  int4range: 'RANGE(INTEGER)',
  /** Maps PostgreSQL int8range to Sequelize RANGE(BIGINT) */
  int8range: 'RANGE(BIGINT)',
  /** Maps PostgreSQL tstzrange (timestamp with timezone range) to Sequelize RANGE(DATE) */
  tstzrange: 'RANGE(DATE)',
  /** Maps PostgreSQL daterange to Sequelize RANGE(DATEONLY) */
  daterange: 'RANGE(DATEONLY)',
  /** Maps PostgreSQL numrange to Sequelize RANGE(DECIMAL) */
  numrange: 'RANGE(DECIMAL)',

  // Character types
  /** Maps PostgreSQL char to Sequelize CHAR */
  char: 'CHAR',
  /** Maps PostgreSQL character alias to Sequelize CHAR */
  character: 'CHAR',
  /** Maps PostgreSQL varchar to Sequelize STRING */
  varchar: 'STRING',
  /** Maps PostgreSQL bit to Sequelize STRING */
  bit: 'STRING',
  /** Maps PostgreSQL varbit to Sequelize STRING */
  varbit: 'STRING',
  /** Maps PostgreSQL character varying to Sequelize STRING */
  'character varying': 'STRING',
  /** Maps PostgreSQL bit varying to Sequelize STRING */
  'bit varying': 'STRING',
  /** Maps PostgreSQL text to Sequelize TEXT */
  text: 'TEXT',
  /** Maps PostgreSQL citext (case-insensitive) to Sequelize CITEXT */
  citext: 'CITEXT',

  // Boolean
  /** Maps PostgreSQL boolean to Sequelize BOOLEAN */
  boolean: 'BOOLEAN',

  // Date/Time
  /** Maps PostgreSQL date (date only) to Sequelize DATEONLY */
  date: 'DATEONLY',
  /** Maps PostgreSQL time to Sequelize TIME */
  time: 'TIME',
  /** Maps PostgreSQL time without time zone to Sequelize TIME */
  'time without time zone': 'TIME',
  /** Maps PostgreSQL time with time zone to Sequelize TIME */
  'time with time zone': 'TIME',
  /** Maps PostgreSQL timestamp to Sequelize DATE */
  timestamp: 'DATE',
  /** Maps PostgreSQL timestamp without time zone to Sequelize DATE */
  'timestamp without time zone': 'DATE',
  /** Maps PostgreSQL timestamp with time zone to Sequelize DATE */
  'timestamp with time zone': 'DATE',

  // UUID
  /** Maps PostgreSQL uuid to Sequelize UUID */
  uuid: 'UUID',

  // JSON
  /** Maps PostgreSQL json to Sequelize JSON */
  json: 'JSON',
  /** Maps PostgreSQL jsonb to Sequelize JSONB */
  jsonb: 'JSONB',

  // Binary
  /** Maps PostgreSQL bytea to Sequelize BLOB */
  bytea: 'BLOB',

  // Enum (mapped generically; actual enum values must be defined separately)
  /** Maps PostgreSQL enum to Sequelize ENUM (requires explicit values in Sequelize) */
  enum: 'ENUM',

  // Geometric, network, etc. (not directly supported by Sequelize — map to STRING or custom)
  /** Maps PostgreSQL inet (IP address) to Sequelize INET */
  inet: 'INET',
  /** Maps PostgreSQL cidr (IP range) to Sequelize CIDR */
  cidr: 'CIDR',
  /** Maps PostgreSQL macaddr (MAC address) to Sequelize MACADDR */
  macaddr: 'MACADDR',
  /** Maps PostgreSQL interval to Sequelize STRING (or custom type) */
  interval: 'STRING',

  // Array
  /** Maps PostgreSQL array to Sequelize DataTypes.ARRAY */
  array: DataTypes.ARRAY,

  // Geometric types
  /** Maps PostgreSQL point to Sequelize GEOMETRY('POINT') */
  point: `GEOMETRY('POINT')`,
  /** Maps PostgreSQL line to Sequelize GEOMETRY */
  line: 'GEOMETRY',
  /** Maps PostgreSQL lseg (line segment) to Sequelize GEOMETRY */
  lseg: 'GEOMETRY',
  /** Maps PostgreSQL box to Sequelize GEOMETRY */
  box: 'GEOMETRY',
  /** Maps PostgreSQL path to Sequelize GEOMETRY */
  path: 'GEOMETRY',
  /** Maps PostgreSQL polygon to Sequelize GEOMETRY('POLYGON') */
  polygon: `GEOMETRY('POLYGON')`,
  /** Maps PostgreSQL circle to Sequelize GEOMETRY */
  circle: 'GEOMETRY',

  // Money
  /** Maps PostgreSQL money to Sequelize DECIMAL */
  money: 'DECIMAL',

  // XML
  /** Maps PostgreSQL xml to Sequelize TEXT */
  xml: 'TEXT',

  // TSVector
  /** Maps PostgreSQL tsvector to Sequelize STRING */
  tsvector: 'STRING',

  // User-defined types
  /** Maps PostgreSQL user-defined types to Sequelize JSON (default for composite types) */
  'user-defined': 'JSON',
  /** Maps PostgreSQL composite types to Sequelize JSON */
  composite: 'JSON',
  /** Maps PostgreSQL domain types to Sequelize STRING */
  domain: 'STRING',
} as const;
