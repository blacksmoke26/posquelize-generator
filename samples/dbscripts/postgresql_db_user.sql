/*
 Source Server         : Localhost
 Source Server Type    : PostgreSQL
 Source Server Version : 170002 (170002)
 Source Host           : 127.0.0.1:5432
 Source Catalog        : test_db
 Source Schema         : user

 Target Server Type    : PostgreSQL
 Target Server Version : 170002 (170002)
 File Encoding         : 65001

 Date: 19/11/2025 22:58:18
*/


-- ----------------------------
-- Sequence structure for users_user_id_seq
-- ----------------------------
DROP SEQUENCE IF EXISTS "user"."users_user_id_seq";
CREATE SEQUENCE "user"."users_user_id_seq"
INCREMENT 1
MINVALUE  1
MAXVALUE 2147483647
START 1
CACHE 1;

-- ----------------------------
-- Table structure for users
-- ----------------------------
DROP TABLE IF EXISTS "user"."users";
CREATE TABLE "user"."users" (
  "user_id" int4 NOT NULL DEFAULT nextval('"user".users_user_id_seq'::regclass),
  "username" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "email" varchar(100) COLLATE "pg_catalog"."default" NOT NULL,
  "password_hash" text COLLATE "pg_catalog"."default" NOT NULL,
  "full_name" varchar(100) COLLATE "pg_catalog"."default",
  "date_of_birth" date,
  "gender" varchar(10) COLLATE "pg_catalog"."default",
  "created_at" timestamp(6) DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamp(6) DEFAULT CURRENT_TIMESTAMP,
  "is_active" bool DEFAULT true,
  "last_login" timestamp(6)
)
;

-- ----------------------------
-- Records of users
-- ----------------------------
INSERT INTO "user"."users" VALUES (1, 'Hasegawa Mitsuki', 'mitsukih5@gmail.com', 'The Information Pane shows the detailed object information, project activities, the DDL of database objects, object dependencies, membership of users/roles and preview. All the Navicat Cloud objects are located under different projects. You can share the project to other Navicat Cloud accounts for collaboration. To successfully establish a new connection to local/remote server - no matter via SSL or SSH, set the database login information in the General tab. Difficult circumstances serve as a textbook of life for people. Flexible settings enable you to set up a custom key for comparison and synchronization. Navicat Monitor requires a repository to store alerts and metrics for historical analysis. Optimism is the one quality more associated with success and happiness than any other. To open a query using an external editor, control-click it and select Open with External Editor. You can set the file path of an external editor in Preferences. I destroy my enemies when I make them my friends. It wasn’t raining when Noah built the ark. A query is used to extract data from the database in a readable format according to the user''s request. Navicat is a multi-connections Database Administration tool allowing you to connect to MySQL, Oracle, PostgreSQL, SQLite, SQL Server, MariaDB and/or MongoDB databases, making database administration to multiple kinds of database so easy.', 'Hasegawa Mitsuki', '2020-02-15', 'F', '2016-07-30 21:51:44', '2016-04-11 22:42:16', 'f', '2014-05-26 01:32:31');
INSERT INTO "user"."users" VALUES (2, 'Lo Sze Kwan', 'sklo7@yahoo.com', 'To successfully establish a new connection to local/remote server - no matter via SSL or SSH, set the database login information in the General tab. Such sessions are also susceptible to session hijacking, where a malicious user takes over your session once you have authenticated. Navicat Monitor requires a repository to store alerts and metrics for historical analysis. The past has no power over the present moment. After logged in the Navicat Cloud feature, the Navigation pane will be divided into Navicat Cloud and My Connections sections. Navicat Cloud provides a cloud service for synchronizing connections, queries, model files and virtual group information from Navicat, other Navicat family members, different machines and different platforms. Navicat 15 has added support for the system-wide dark mode. If you wait, all that happens is you get older. You will succeed because most people are lazy. Typically, it is employed as an encrypted version of Telnet. If the Show objects under schema in navigation pane option is checked at the Preferences window, all database objects are also displayed in the pane. A comfort zone is a beautiful place, but nothing ever grows there.', 'Lo Sze Kwan', '2018-07-23', 'F', '2019-10-15 05:24:21', '2024-07-18 07:00:52', 'f', '2000-01-20 10:02:32');

-- ----------------------------
-- Function structure for pg_stat_statements
-- ----------------------------
DROP FUNCTION IF EXISTS "user"."pg_stat_statements"("showtext" bool, OUT "userid" oid, OUT "dbid" oid, OUT "toplevel" bool, OUT "queryid" int8, OUT "query" text, OUT "plans" int8, OUT "total_plan_time" float8, OUT "min_plan_time" float8, OUT "max_plan_time" float8, OUT "mean_plan_time" float8, OUT "stddev_plan_time" float8, OUT "calls" int8, OUT "total_exec_time" float8, OUT "min_exec_time" float8, OUT "max_exec_time" float8, OUT "mean_exec_time" float8, OUT "stddev_exec_time" float8, OUT "rows" int8, OUT "shared_blks_hit" int8, OUT "shared_blks_read" int8, OUT "shared_blks_dirtied" int8, OUT "shared_blks_written" int8, OUT "local_blks_hit" int8, OUT "local_blks_read" int8, OUT "local_blks_dirtied" int8, OUT "local_blks_written" int8, OUT "temp_blks_read" int8, OUT "temp_blks_written" int8, OUT "shared_blk_read_time" float8, OUT "shared_blk_write_time" float8, OUT "local_blk_read_time" float8, OUT "local_blk_write_time" float8, OUT "temp_blk_read_time" float8, OUT "temp_blk_write_time" float8, OUT "wal_records" int8, OUT "wal_fpi" int8, OUT "wal_bytes" numeric, OUT "jit_functions" int8, OUT "jit_generation_time" float8, OUT "jit_inlining_count" int8, OUT "jit_inlining_time" float8, OUT "jit_optimization_count" int8, OUT "jit_optimization_time" float8, OUT "jit_emission_count" int8, OUT "jit_emission_time" float8, OUT "jit_deform_count" int8, OUT "jit_deform_time" float8, OUT "stats_since" timestamptz, OUT "minmax_stats_since" timestamptz);
CREATE FUNCTION "user"."pg_stat_statements"(IN "showtext" bool, OUT "userid" oid, OUT "dbid" oid, OUT "toplevel" bool, OUT "queryid" int8, OUT "query" text, OUT "plans" int8, OUT "total_plan_time" float8, OUT "min_plan_time" float8, OUT "max_plan_time" float8, OUT "mean_plan_time" float8, OUT "stddev_plan_time" float8, OUT "calls" int8, OUT "total_exec_time" float8, OUT "min_exec_time" float8, OUT "max_exec_time" float8, OUT "mean_exec_time" float8, OUT "stddev_exec_time" float8, OUT "rows" int8, OUT "shared_blks_hit" int8, OUT "shared_blks_read" int8, OUT "shared_blks_dirtied" int8, OUT "shared_blks_written" int8, OUT "local_blks_hit" int8, OUT "local_blks_read" int8, OUT "local_blks_dirtied" int8, OUT "local_blks_written" int8, OUT "temp_blks_read" int8, OUT "temp_blks_written" int8, OUT "shared_blk_read_time" float8, OUT "shared_blk_write_time" float8, OUT "local_blk_read_time" float8, OUT "local_blk_write_time" float8, OUT "temp_blk_read_time" float8, OUT "temp_blk_write_time" float8, OUT "wal_records" int8, OUT "wal_fpi" int8, OUT "wal_bytes" numeric, OUT "jit_functions" int8, OUT "jit_generation_time" float8, OUT "jit_inlining_count" int8, OUT "jit_inlining_time" float8, OUT "jit_optimization_count" int8, OUT "jit_optimization_time" float8, OUT "jit_emission_count" int8, OUT "jit_emission_time" float8, OUT "jit_deform_count" int8, OUT "jit_deform_time" float8, OUT "stats_since" timestamptz, OUT "minmax_stats_since" timestamptz)
  RETURNS SETOF "pg_catalog"."record" AS '$libdir/pg_stat_statements', 'pg_stat_statements_1_11'
  LANGUAGE c VOLATILE STRICT
  COST 1
  ROWS 1000;

-- ----------------------------
-- Function structure for pg_stat_statements_info
-- ----------------------------
DROP FUNCTION IF EXISTS "user"."pg_stat_statements_info"(OUT "dealloc" int8, OUT "stats_reset" timestamptz);
CREATE FUNCTION "user"."pg_stat_statements_info"(OUT "dealloc" int8, OUT "stats_reset" timestamptz)
  RETURNS "pg_catalog"."record" AS '$libdir/pg_stat_statements', 'pg_stat_statements_info'
  LANGUAGE c VOLATILE STRICT
  COST 1;

-- ----------------------------
-- Function structure for pg_stat_statements_reset
-- ----------------------------
DROP FUNCTION IF EXISTS "user"."pg_stat_statements_reset"("userid" oid, "dbid" oid, "queryid" int8, "minmax_only" bool);
CREATE FUNCTION "user"."pg_stat_statements_reset"("userid" oid=0, "dbid" oid=0, "queryid" int8=0, "minmax_only" bool=false)
  RETURNS "pg_catalog"."timestamptz" AS '$libdir/pg_stat_statements', 'pg_stat_statements_reset_1_11'
  LANGUAGE c VOLATILE STRICT
  COST 1;

-- ----------------------------
-- View structure for pg_stat_statements_info
-- ----------------------------
DROP VIEW IF EXISTS "user"."pg_stat_statements_info";
CREATE VIEW "user"."pg_stat_statements_info" AS  SELECT dealloc,
    stats_reset
   FROM "user".pg_stat_statements_info() pg_stat_statements_info(dealloc, stats_reset);

-- ----------------------------
-- View structure for pg_stat_statements
-- ----------------------------
DROP VIEW IF EXISTS "user"."pg_stat_statements";
CREATE VIEW "user"."pg_stat_statements" AS  SELECT userid,
    dbid,
    toplevel,
    queryid,
    query,
    plans,
    total_plan_time,
    min_plan_time,
    max_plan_time,
    mean_plan_time,
    stddev_plan_time,
    calls,
    total_exec_time,
    min_exec_time,
    max_exec_time,
    mean_exec_time,
    stddev_exec_time,
    rows,
    shared_blks_hit,
    shared_blks_read,
    shared_blks_dirtied,
    shared_blks_written,
    local_blks_hit,
    local_blks_read,
    local_blks_dirtied,
    local_blks_written,
    temp_blks_read,
    temp_blks_written,
    shared_blk_read_time,
    shared_blk_write_time,
    local_blk_read_time,
    local_blk_write_time,
    temp_blk_read_time,
    temp_blk_write_time,
    wal_records,
    wal_fpi,
    wal_bytes,
    jit_functions,
    jit_generation_time,
    jit_inlining_count,
    jit_inlining_time,
    jit_optimization_count,
    jit_optimization_time,
    jit_emission_count,
    jit_emission_time,
    jit_deform_count,
    jit_deform_time,
    stats_since,
    minmax_stats_since
   FROM "user".pg_stat_statements(true) pg_stat_statements(userid, dbid, toplevel, queryid, query, plans, total_plan_time, min_plan_time, max_plan_time, mean_plan_time, stddev_plan_time, calls, total_exec_time, min_exec_time, max_exec_time, mean_exec_time, stddev_exec_time, rows, shared_blks_hit, shared_blks_read, shared_blks_dirtied, shared_blks_written, local_blks_hit, local_blks_read, local_blks_dirtied, local_blks_written, temp_blks_read, temp_blks_written, shared_blk_read_time, shared_blk_write_time, local_blk_read_time, local_blk_write_time, temp_blk_read_time, temp_blk_write_time, wal_records, wal_fpi, wal_bytes, jit_functions, jit_generation_time, jit_inlining_count, jit_inlining_time, jit_optimization_count, jit_optimization_time, jit_emission_count, jit_emission_time, jit_deform_count, jit_deform_time, stats_since, minmax_stats_since);

-- ----------------------------
-- Alter sequences owned by
-- ----------------------------
ALTER SEQUENCE "user"."users_user_id_seq"
OWNED BY "user"."users"."user_id";
SELECT setval('"user"."users_user_id_seq"', 1, false);

-- ----------------------------
-- Uniques structure for table users
-- ----------------------------
ALTER TABLE "user"."users" ADD CONSTRAINT "users_username_key" UNIQUE ("username");
ALTER TABLE "user"."users" ADD CONSTRAINT "users_email_key" UNIQUE ("email");

-- ----------------------------
-- Primary Key structure for table users
-- ----------------------------
ALTER TABLE "user"."users" ADD CONSTRAINT "users_pkey" PRIMARY KEY ("user_id");
