-- Retrieves type information for a composite type in PostgreSQL
-- @author Junaid Atari <mj.atari@gmail.com>
-- @copyright 2025 Junaid Atari
-- @see https://github.com/blacksmoke26
--
-- @param {string} schemaName - The name of the schema containing the type
-- @param {string} tableName - The name of the table containing the column
-- @param {string} columnName - The name of the column referencing the type
-- @returns {object} An object containing:
--   - typeName: The name of the composite type
--   - attributeNames: Array of attribute (column) names in the type
--   - attributeTypes: Array of attribute types in the type

SELECT
  t.typname as "typeName",
  array_agg(a.attname ORDER BY a.attnum) as "attributeNames",
  array_agg(format_type(a.atttypid, a.atttypmod) ORDER BY a.attnum) as "attributeTypes"
FROM pg_type t
       JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
       JOIN pg_attribute a ON a.attrelid = t.typrelid
       JOIN pg_class c ON c.relname = ?
       JOIN pg_attribute ca ON ca.attrelid = c.oid AND ca.attname = ?
WHERE t.typtype = 'c'
  AND n.nspname = ?
  AND t.oid = ca.atttypid
GROUP BY t.typname
