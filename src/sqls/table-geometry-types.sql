-- Retrieves geometry column information for a specific table and schema
-- @author Junaid Atari <mj.atari@gmail.com>
-- @copyright 2025 Junaid Atari
-- @see https://github.com/blacksmoke26
--
-- @param {string} f_table_name - The name of the table to query
-- @param {string} f_table_schema - The schema containing the table
-- @returns {object} Column metadata including name, type, SRID, and dimensions

SELECT
  f_geometry_column AS "columnName",
  TYPE AS "udtName",
  srid AS "dataType",
  coord_dimension AS "elementType"
FROM
  geometry_columns
WHERE
  f_table_name = ?
  AND f_table_schema = ?
