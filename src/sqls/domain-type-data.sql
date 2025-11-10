-- Retrieves domain information including base type, check expression, constraint details, and default value
-- @author Junaid Atari <mj.atari@gmail.com>
-- @copyright 2025 Junaid Atari
-- @see https://github.com/blacksmoke26
--
-- @param string table_name The name of the table
-- @param string column_name The name of the column
-- @param string schema_name The name of the schema
-- @return {
--   domain_name: string,
--   base_type: string,
--   check_expression: string,
--   constraint_name: string,
--   constraint_type: string,
--   default_value: string
-- }

SELECT
  t.typname AS domain_name,
  bt.typname AS base_type,
  COALESCE(pg_get_expr(conbin, conrelid), '') AS check_expression,
  conname AS constraint_name,
  contype AS constraint_type,
  pg_get_expr(adbin, adrelid) AS default_value
FROM pg_type t
       JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
       JOIN pg_attribute a ON a.atttypid = t.oid
       JOIN pg_class c ON c.oid = a.attrelid
       LEFT JOIN pg_type bt ON t.typbasetype = bt.oid
       LEFT JOIN pg_constraint co ON co.contypid = t.oid
       LEFT JOIN pg_attrdef ad ON ad.adrelid = c.oid AND ad.adnum = a.attnum
WHERE c.relname = ?
  AND a.attname = ?
  AND n.nspname = ?
  AND t.typtype = 'd'
