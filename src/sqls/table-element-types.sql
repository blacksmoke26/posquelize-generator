-- @author Junaid Atari <mj.atari@gmail.com>
-- @copyright 2025 Junaid Atari
-- @see https://github.com/blacksmoke26
--
-- @description Retrieves column metadata for a specific table including:
--              - Column name and data type information
--              - User-defined type names
--              - Element types for array columns
--              - Enum data values for enum columns
-- @param tableName The name of the table to query
-- @param schemaName The schema name where the table resides
-- @returns ResultSet containing column metadata with enum values when applicable
-- @example SELECT * FROM table_name WHERE table_schema = 'public' AND table_name = 'users';

SELECT
  c.column_name AS "columnName",
  LOWER(c.data_type) AS "dataType",
  c.udt_name AS "udtName",
  e.data_type AS "elementType",
  (
    SELECT
      ARRAY_AGG(pe.enumlabel)
    FROM
      pg_catalog.pg_type pt
        JOIN pg_catalog.pg_enum pe ON pt.OID = pe.enumtypid
    WHERE
      pt.typname = c.udt_name
       OR CONCAT ('_', pt.typname) = c.udt_name
  ) AS "enumData"
FROM
  information_schema.COLUMNS c
    LEFT JOIN information_schema.element_types e ON (
    (c.table_catalog, c.table_schema, c.TABLE_NAME, 'TABLE', c.dtd_identifier) = (e.object_catalog, e.object_schema, e.object_name, e.object_type, e.collection_type_identifier)
    )
WHERE
  c.TABLE_NAME = ?
  AND c.table_schema = ?;
