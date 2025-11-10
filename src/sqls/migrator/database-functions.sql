-- @author Junaid Atari <mj.atari@gmail.com>
-- @copyright 2025 Junaid Atari
-- @see https://github.com/blacksmoke26
--
-- @description Retrieves all user-defined functions from the database, excluding system schemas.
-- @columns
--   - schema: The namespace/schema name where the function is defined
--   - name: The name of the function
--   - arguments: The function's argument list
--   - returnType: The function's return type
--   - language: The language the function is implemented in (e.g., 'sql', 'plpgsql')
--   - volatility: The function's volatility classification ('Immutable', 'Stable', or 'Volatile')
--   - isSecurityDefiner: Whether the function has SECURITY DEFINER privileges
--   - definition: The complete function definition source code

SELECT
  n.nspname AS "schema",
  p.proname AS "name",
  pg_get_function_identity_arguments (p.OID) AS arguments,
  pg_get_function_result (p.OID) AS "returnType",
  l.lanname AS "language",
  CASE
    WHEN p.provolatile = 'i' THEN
      'Immutable'
    WHEN p.provolatile = 's' THEN
      'Stable'
    WHEN p.provolatile = 'v' THEN
      'Volatile'
  END AS volatility,
  p.prosecdef AS "isSecurityDefiner",
  pg_get_functiondef (p.OID) AS definition
FROM
  pg_proc p
  INNER JOIN pg_namespace n ON p.pronamespace = n.
  OID INNER JOIN pg_language l ON p.prolang = l.OID
WHERE
  n.nspname NOT IN ('pg_catalog', 'information_schema')
  AND n.nspname NOT LIKE'pg_%'
ORDER BY
  "schema",
  "name";
