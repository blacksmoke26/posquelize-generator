/**
 * @fileoverview Provides type mapping utilities for PostgreSQL to JavaScript/TypeScript conversion.
 *
 * This module contains a comprehensive mapping between PostgreSQL data types and their
 * corresponding JavaScript/TypeScript types. It includes handling for all major PostgreSQL
 * type categories including numeric, character, date/time, boolean, geometric, network,
 * binary, text search, UUID, JSON, array, object identifier, and range types.
 *
 * The main export is the getJsType function which performs intelligent type mapping
 * with support for array types, precision/scale specifications, and case-insensitive
 * lookups. Unrecognized types default to 'any'.
 *
 * @author Junaid Atari <mj.atari@gmail.com>
 * @copyright 2025 Junaid Atari
 * @see https://github.com/blacksmoke26
 * @since 1.0.0
 */

/**
 * A comprehensive mapping from PostgreSQL data types to their JavaScript/TypeScript equivalents.
 *
 * This mapping covers all major PostgreSQL type categories:
 *
 * **Numeric Types**:
 * - Integer types (smallint, integer, bigint, serial, bigserial)
 * - Floating-point types (real, double precision)
 * - Arbitrary precision types (decimal, numeric)
 *
 * **Character Types**:
 * - Fixed-length (character, char)
 * - Variable-length (varchar, character varying, text)
 *
 * **Binary Data**:
 * - Raw binary data (bytea)
 *
 * **Date/Time Types**:
 * - Date values (date)
 * - Time values with/without time zones
 * - Timestamp values with/without time zones
 * - Time intervals
 *
 * **Boolean Types**:
 * - boolean, bool
 *
 * **Geometric Types**:
 * - Spatial data types (point, line, lseg, box, path, polygon, circle)
 *
 * **Network Address Types**:
 * - IPv4/IPv6 addresses (inet, cidr)
 * - MAC addresses (macaddr, macaddr8)
 *
 * **Bit String Types**:
 * - Fixed and variable-length bit strings
 *
 * **Text Search Types**:
 * - Full-text search data types (tsvector, tsquery)
 *
 * **Special Types**:
 * - UUID values
 * - XML and JSON data
 *
 * **Array Types**:
 * - Arrays of any supported base type
 *
 * **Object Identifier Types**:
 * - System catalog identifiers (oid, regproc, regprocedure, etc.)
 *
 * **Range Types**:
 * - Range values for various data types
 *
 * @type {Record<string, string>}
 * @readonly
 *
 * @example
 * // Numeric type mappings
 * postgresToJsType['integer']     // returns 'number'
 * postgresToJsType['bigint']      // returns 'string' (to preserve precision)
 * postgresToJsType['decimal']     // returns 'string' (to preserve precision)
 *
 * // Character type mappings
 * postgresToJsType['varchar']     // returns 'string'
 * postgresToJsType['text']        // returns 'string'
 *
 * // Date/Time type mappings
 * postgresToJsType['timestamp']   // returns 'Date'
 * postgresToJsType['timestamptz'] // returns 'Date'
 *
 * // Array type mappings
 * postgresToJsType['integer[]']   // returns 'Array<number>'
 * postgresToJsType['text[]']      // returns 'Array<string>'
 *
 * // JSON type mappings
 * postgresToJsType['json']        // returns 'object'
 * postgresToJsType['jsonb']       // returns 'object'
 *
 * // UUID type mappings
 * postgresToJsType['uuid']        // returns 'string'
 */
const postgresToJsType: Record<string, string> = {
  // Numeric types
  smallint: 'number',
  integer: 'number',
  bigint: 'string', // BigInt in JS, but often handled as string to avoid precision loss
  decimal: 'string', // Often represented as string to preserve precision
  numeric: 'string', // Same as decimal
  real: 'number',
  'double precision': 'number',
  serial: 'number',
  bigserial: 'string',

  // Monetary types
  money: 'string', // Usually handled as string to avoid floating point issues

  // Character types
  'character varying': 'string',
  varchar: 'string',
  character: 'string',
  char: 'string',
  text: 'string',

  // Binary data
  bytea: 'Buffer', // Node.js Buffer or Uint8Array in browsers

  // Date/Time types
  date: 'Date',
  time: 'Date', // or string, depending on precision needs
  'time without time zone': 'Date',
  'time with time zone': 'Date',
  timestamp: 'Date',
  'timestamp without time zone': 'Date',
  'timestamp with time zone': 'Date',
  timestamptz: 'Date',
  interval: 'string', // Complex duration, often kept as string

  // Boolean
  boolean: 'boolean',
  bool: 'boolean',

  // Geometric types (usually handled as strings or custom objects)
  point: 'object',
  line: 'object',
  lseg: 'object',
  box: 'object',
  path: 'object',
  polygon: 'object',
  circle: 'object',

  // Network address types
  cidr: 'string',
  inet: 'string',
  macaddr: 'string',
  macaddr8: 'string',

  // Bit string types
  bit: 'string',
  'bit varying': 'string',
  varbit: 'string',

  // Text search types
  tsvector: 'string',
  tsquery: 'string',

  // UUID
  uuid: 'string',

  // XML and JSON
  xml: 'string',
  json: 'object',
  jsonb: 'object',

  // Arrays (handled as arrays of the base type)
  'array': 'Array<unknown>',
  'integer[]': 'Array<number>',
  'text[]': 'Array<string>',
  'boolean[]': 'Array<boolean>',
  // Note: Generic array handling would require parsing

  // Object identifier types
  oid: 'number',
  regproc: 'string',
  regprocedure: 'string',
  regoper: 'string',
  regoperator: 'string',
  regclass: 'string',
  regtype: 'string',
  regconfig: 'string',
  regdictionary: 'string',

  // Range types (usually handled as objects or strings)
  int4range: 'object',
  int8range: 'object',
  numrange: 'object',
  tsrange: 'object',
  tstzrange: 'object',
  daterange: 'object',

  // Default fallback
  default: 'any',
};

/**
 * Maps a PostgreSQL data type to its corresponding JavaScript/TypeScript type.
 *
 * This function provides intelligent type mapping with support for:
 * - Case-insensitive type names (e.g., 'INTEGER', 'integer', 'Integer' all map to 'number')
 * - Array types (e.g., 'text[]' maps to 'Array<string>')
 * - Numeric types with precision/scale specifications (e.g., 'numeric(10,2)' maps to 'string')
 * - Character types with length specifications (e.g., 'varchar(255)' maps to 'string')
 * - All standard PostgreSQL types through the internal mapping table
 *
 * The function follows these mapping rules:
 *
 * **Numeric Types**:
 * - Integer types (smallint, integer, serial) → number
 * - Large integers (bigint, bigserial) → string (to preserve precision)
 * - Arbitrary precision (decimal, numeric) → string (to preserve precision)
 * - Floating-point (real, double precision) → number
 *
 * **Character Types**:
 * - All character types (varchar, text, char, etc.) → string
 *
 * **Date/Time Types**:
 * - All date/time types → Date
 * - Intervals → string
 *
 * **Binary Data**:
 * - bytea → Buffer
 *
 * **Boolean Types**:
 * - boolean, bool → boolean
 *
 * **Special Types**:
 * - UUID → string
 * - JSON/JSONB → object
 * - XML → string
 *
 * **Array Types**:
 * - Any type followed by [] → Array<baseType>
 *
 * **Fallback**:
 * - Unrecognized types → any
 *
 * @param postgresType - The PostgreSQL data type as a string. Can include type modifiers
 *                      like length or precision (e.g., 'varchar(255)', 'numeric(10,2)')
 *                      and array notation (e.g., 'text[]'). Case is ignored.
 *
 * @returns The corresponding JavaScript/TypeScript type as a string. If the type
 *          is not recognized, returns 'any'.
 *
 * @example
 * // Basic type mappings
 * getJsType('integer')     // returns 'number'
 * getJsType('text')        // returns 'string'
 * getJsType('boolean')     // returns 'boolean'
 * getJsType('date')        // returns 'Date'
 *
 * // Case-insensitive mappings
 * getJsType('INTEGER')     // returns 'number'
 * getJsType('Text')        // returns 'string'
 * getJsType('BOOLEAN')     // returns 'boolean'
 *
 * // Types with modifiers
 * getJsType('varchar(255)')  // returns 'string'
 * getJsType('numeric(10,2)') // returns 'string'
 * getJsType('decimal(5,2)')  // returns 'string'
 *
 * // Array types
 * getJsType('text[]')      // returns 'Array<string>'
 * getJsType('integer[]')   // returns 'Array<number>'
 * getJsType('boolean[]')   // returns 'Array<boolean>'
 *
 * // Special types
 * getJsType('uuid')        // returns 'string'
 * getJsType('json')        // returns 'object'
 * getJsType('jsonb')       // returns 'object'
 * getJsType('bytea')       // returns 'Buffer'
 *
 * // Fallback for unknown types
 * getJsType('unknown_type') // returns 'any'
 * getJsType('')             // returns 'any'
 *
 * @remarks
 * - The function performs case-insensitive lookups
 * - Array types are handled generically by stripping '[]' and mapping the base type
 * - Precision/scale specifications are ignored for numeric types (they map to string)
 * - Length specifications are ignored for character types (they map to string)
 * - The internal mapping table can be extended to support additional types
 * - The default fallback ensures the function never returns undefined
 */
export const getJsType = (postgresType: string): string => {
  const normalizedType = postgresType.toLowerCase().trim();

  // Handle array types generically
  if (normalizedType.endsWith('[]')) {
    const baseType = normalizedType.slice(0, -2);
    const jsBaseType =
      postgresToJsType[baseType] || postgresToJsType['default'];
    return `Array<${jsBaseType}>`;
  }

  // Handle numeric types with precision/scale (e.g., "numeric(10,2)")
  if (
    normalizedType.startsWith('numeric') ||
    normalizedType.startsWith('decimal')
  ) {
    return postgresToJsType['numeric'];
  }

  // Handle character types with length (e.g., "varchar(255)")
  if (
    normalizedType.startsWith('character varying') ||
    normalizedType.startsWith('varchar') ||
    normalizedType.startsWith('character') ||
    normalizedType.startsWith('char')
  ) {
    return 'string';
  }

  return postgresToJsType[normalizedType] || postgresToJsType['default'];
};
