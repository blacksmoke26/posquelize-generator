-- @author Junaid Atari <mj.atari@gmail.com>
-- @copyright 2025 Junaid Atari
-- @see https://github.com/blacksmoke26
--
-- @description Retrieves detailed information about database indexes, including
-- schema name, table name, index name, index type, constraint type, column names,
-- and index comments. Filters results to include only indexes in the 'public'
-- schema and excludes system columns.
--
-- @columns
--   SCHEMA_NAME: Name of the schema containing the index
--   TABLE_NAME: Name of the table the index belongs to
--   index_name: Name of the index
--   index_type: Type of index (e.g., btree, hash)
--   constraint_type: Type of constraint (PRIMARY KEY, UNIQUE, or INDEX)
--   COLUMNS: Comma-separated list of column names included in the index
--   index_comment: Comment associated with the index (if any)
--
-- @returns A result set with index metadata sorted by schema, table, constraint type, and index name

SELECT
  n.nspname AS SCHEMA_NAME,
  t.relname AS TABLE_NAME,
  i.relname AS index_name,
  am.amname AS index_type,
  CASE
    WHEN ix.indisprimary THEN
      'PRIMARY KEY'
    WHEN ix.indisunique THEN
      'UNIQUE'
    ELSE
      'INDEX'
    END AS constraint_type,
  STRING_AGG (a.attname, ', ' ORDER BY array_position (ix.indkey, a.attnum)) AS COLUMNS,
  idx_desc.description AS index_comment -- Index comment
FROM
  pg_class t
    JOIN pg_index ix ON t.OID = ix.indrelid
    JOIN pg_class i ON i.OID = ix.indexrelid
    JOIN pg_namespace n ON n.OID = t.relnamespace
    JOIN pg_am am ON am.OID = i.relam
    JOIN pg_attribute a ON a.attrelid = t.OID
    AND a.attnum = ANY (ix.indkey)
    LEFT JOIN pg_description idx_desc ON idx_desc.objoid = i.OID
    AND idx_desc.objsubid = 0 -- comment on the index itself
WHERE
  n.nspname IN ('public')
  AND a.attnum > 0 -- exclude system columns
GROUP BY
  n.nspname,
  t.relname,
  i.relname,
  am.amname,
  ix.indisprimary,
  ix.indisunique,
  idx_desc.description
ORDER BY
  n.nspname,
  t.relname,
  constraint_type DESC,
  i.relname;
