-- Retrieves geography column metadata for a specific table and schema
-- @author Junaid Atari <mj.atari@gmail.com>
-- @copyright 2025 Junaid Atari
-- @see https://github.com/blacksmoke26
--
-- @param f_table_name The name of the table to query
-- @param f_table_schema The schema of the table to query
-- @returns columnName, udtName, dataType, elementType

SELECT
  f_geography_column AS "columnName",
  TYPE AS "udtName",
  srid AS "dataType",
  coord_dimension AS "elementType"
FROM
  geography_columns
WHERE
  f_table_name = ?
  AND f_table_schema = ?
