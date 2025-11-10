-- @author Junaid Atari <mj.atari@gmail.com>
-- @copyright 2025 Junaid Atari
-- @see https://github.com/blacksmoke26
--
-- Retrieves index information for a specific table in a PostgreSQL database.
-- This query returns details about all indexes on the specified table,
-- including whether they are primary or unique, their column composition,
-- and the full index definition.
--
-- @param string $tableName The name of the table to query indexes for
-- @param string $schemaName The schema name where the table resides
-- @return array List of indexes with their properties

SELECT
  i.relname AS "name",
  ix.indisprimary AS "primary",
  ix.indisunique AS "unique",
  ix.indkey AS "indKey",
  ARRAY_AGG(a.attnum) AS "columnIndexes",
  ARRAY_AGG(a.attname) AS "columnNames",
  pg_get_indexdef (ix.indexrelid) AS "definition"
FROM
  pg_class t,
  pg_class i,
  pg_index ix,
  pg_attribute a,
  pg_namespace s
WHERE
  t.OID = ix.indrelid
  AND i.OID = ix.indexrelid
  AND a.attrelid = t.OID
  AND t.relkind = 'r'
  AND t.relname = ?
  AND s.OID = t.relnamespace
  AND s.nspname = ?
GROUP BY
  i.relname,
  ix.indexrelid,
  ix.indisprimary,
  ix.indisunique,
  ix.indkey
ORDER BY
  i.relname;
