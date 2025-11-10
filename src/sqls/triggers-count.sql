-- @author Junaid Atari <mj.atari@gmail.com>
-- @copyright 2025 Junaid Atari
-- @see https://github.com/blacksmoke26
--
-- @doc This query counts the number of triggers associated with a specific table in a given schema.
--
-- @param string event_object_table The name of the table to check for triggers.
-- @param string event_object_schema The name of the schema containing the table.
-- @return integer The count of triggers for the specified table and schema.

SELECT COUNT(0) AS "triggerCount"
FROM information_schema.triggers AS t
WHERE t.event_object_table = ?
  AND t.event_object_schema = ?
