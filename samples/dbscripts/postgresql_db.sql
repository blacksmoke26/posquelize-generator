/*
 Source Server         : Localhost
 Source Server Type    : PostgreSQL
 Source Server Version : 170002 (170002)
 Source Host           : 127.0.0.1:5432
 Source Catalog        : test_db
 Source Schema         : public

 Target Server Type    : PostgreSQL
 Target Server Version : 170002 (170002)
 File Encoding         : 65001

 Date: 15/11/2025 17:56:57
*/


-- ----------------------------
-- Type structure for address_type
-- ----------------------------
DROP TYPE IF EXISTS "public"."address_type";
CREATE TYPE "public"."address_type" AS (
  "street" text COLLATE "pg_catalog"."default",
  "city" text COLLATE "pg_catalog"."default",
  "zip_code" text COLLATE "pg_catalog"."default"
);

-- ----------------------------
-- Type structure for status
-- ----------------------------
DROP TYPE IF EXISTS "public"."status";
CREATE TYPE "public"."status" AS ENUM (
  'active',
  'inactive',
  'blocked',
  'disabled'
);

-- ----------------------------
-- Sequence structure for brands_id_seq
-- ----------------------------
DROP SEQUENCE IF EXISTS "public"."brands_id_seq";
CREATE SEQUENCE "public"."brands_id_seq"
INCREMENT 1
MINVALUE  1
MAXVALUE 9223372036854775807
START 1
CACHE 1;

-- ----------------------------
-- Sequence structure for product_tags_id_seq
-- ----------------------------
DROP SEQUENCE IF EXISTS "public"."product_tags_id_seq";
CREATE SEQUENCE "public"."product_tags_id_seq"
INCREMENT 1
MINVALUE  1
MAXVALUE 9223372036854775807
START 1
CACHE 1;

-- ----------------------------
-- Sequence structure for products_id_seq
-- ----------------------------
DROP SEQUENCE IF EXISTS "public"."products_id_seq";
CREATE SEQUENCE "public"."products_id_seq"
INCREMENT 1
MINVALUE  1
MAXVALUE 9223372036854775807
START 1
CACHE 1;

-- ----------------------------
-- Sequence structure for tags_id_seq
-- ----------------------------
DROP SEQUENCE IF EXISTS "public"."tags_id_seq";
CREATE SEQUENCE "public"."tags_id_seq"
INCREMENT 1
MINVALUE  1
MAXVALUE 9223372036854775807
START 1
CACHE 1;

-- ----------------------------
-- Table structure for brands
-- ----------------------------
DROP TABLE IF EXISTS "public"."brands";
CREATE TABLE "public"."brands" (
  "id" int8 NOT NULL DEFAULT nextval('brands_id_seq'::regclass),
  "name" varchar(40) COLLATE "pg_catalog"."default" NOT NULL
)
;
COMMENT ON COLUMN "public"."brands"."id" IS 'PK';

-- ----------------------------
-- Records of brands
-- ----------------------------
INSERT INTO "public"."brands" VALUES (1, 'Knorr');

-- ----------------------------
-- Table structure for product_details
-- ----------------------------
DROP TABLE IF EXISTS "public"."product_details";
CREATE TABLE "public"."product_details" (
  "product_id" int8 NOT NULL,
  "color" varchar(20) COLLATE "pg_catalog"."default" NOT NULL,
  "sku" varchar(50) COLLATE "pg_catalog"."default" NOT NULL
)
;

-- ----------------------------
-- Records of product_details
-- ----------------------------
INSERT INTO "public"."product_details" VALUES (1, 'red', 'SHRT-BLU-MED');

-- ----------------------------
-- Table structure for product_tags
-- ----------------------------
DROP TABLE IF EXISTS "public"."product_tags";
CREATE TABLE "public"."product_tags" (
  "id" int8 NOT NULL DEFAULT nextval('product_tags_id_seq'::regclass),
  "product_id" int8 NOT NULL,
  "tag_id" int8 NOT NULL
)
;

-- ----------------------------
-- Records of product_tags
-- ----------------------------
INSERT INTO "public"."product_tags" VALUES (1, 1, 1);
INSERT INTO "public"."product_tags" VALUES (2, 1, 2);

-- ----------------------------
-- Table structure for products
-- ----------------------------
DROP TABLE IF EXISTS "public"."products";
CREATE TABLE "public"."products" (
  "id" int8 NOT NULL DEFAULT nextval('products_id_seq'::regclass),
  "name_varchar100" varchar(100) COLLATE "pg_catalog"."default" NOT NULL,
  "price_numeric10_2" numeric(10,2) DEFAULT 0.0,
  "jsonb_meta" jsonb DEFAULT '{"sku": null, "address": {"city": "Anytown", "street": "123 Main St"}}'::jsonb,
  "created_at_timestamp" timestamp(6) DEFAULT CURRENT_TIMESTAMP,
  "status_enum" "public"."status",
  "is_verified_bool" bool DEFAULT false,
  "count_real" float4,
  "todos_strarray" varchar[][][] COLLATE "pg_catalog"."default",
  "thumb_bytea" bytea,
  "duration_int4range" int4range,
  "ip_macaddr" macaddr,
  "definition_xml" xml,
  "address_composite" "public"."address_type",
  "brand_id_int8" int8,
  "run_at_time" time(6),
  "letter_char" char(1) COLLATE "pg_catalog"."default",
  "tag_bit" bit(1),
  "counter_interval" interval(6),
  "rollno_domain" "public"."positive_integer",
  "guid_uuid" uuid,
  "tags_jsonba" jsonb DEFAULT '[{"name": "test"}]'::jsonb,
  "status" int2,
  "visibility" varchar(30) COLLATE "pg_catalog"."default" DEFAULT 'public'::character varying,
  "deleted_at" timestamp(0)
)
;
COMMENT ON COLUMN "public"."products"."run_at_time" IS 'Run at specific time';
COMMENT ON COLUMN "public"."products"."letter_char" IS 'Letter type';
COMMENT ON COLUMN "public"."products"."deleted_at" IS 'Deleted at';

-- ----------------------------
-- Records of products
-- ----------------------------
INSERT INTO "public"."products" VALUES (1, 'test', 2.00, '{}', '2025-10-26 18:50:10.846131', 'blocked', 't', 2.22, NULL, NULL, NULL, NULL, NULL, NULL, 1, NULL, NULL, NULL, NULL, NULL, '7cf8c7b3-d0e7-42a8-ae7e-e059c4e30d8f', '[]', 10, 'public', NULL);

-- ----------------------------
-- Table structure for tags
-- ----------------------------
DROP TABLE IF EXISTS "public"."tags";
CREATE TABLE "public"."tags" (
  "id" int8 NOT NULL DEFAULT nextval('tags_id_seq'::regclass),
  "name" varchar(80) COLLATE "pg_catalog"."default"
)
;

-- ----------------------------
-- Records of tags
-- ----------------------------
INSERT INTO "public"."tags" VALUES (1, 'Food');
INSERT INTO "public"."tags" VALUES (2, 'Medicine');

-- ----------------------------
-- Function structure for add_numbers
-- ----------------------------
DROP FUNCTION IF EXISTS "public"."add_numbers"("a" int4, "b" int4);
CREATE FUNCTION "public"."add_numbers"("a" int4, "b" int4)
  RETURNS "pg_catalog"."int4" AS $BODY$
DECLARE
    sum_result integer;
BEGIN
    sum_result := a + b;
    RETURN sum_result;
END;
$BODY$
  LANGUAGE plpgsql VOLATILE
  COST 100;

-- ----------------------------
-- Function structure for auto_insert
-- ----------------------------
DROP FUNCTION IF EXISTS "public"."auto_insert"();
CREATE FUNCTION "public"."auto_insert"()
  RETURNS "pg_catalog"."trigger" AS $BODY$
BEGIN
  INSERT INTO B (a_id)
  VALUES
  (NEW.id);
  RETURN NEW;
END;
$BODY$
  LANGUAGE plpgsql VOLATILE
  COST 100;

-- ----------------------------
-- Function structure for my_utf8_to_latin1_func
-- ----------------------------
DROP FUNCTION IF EXISTS "public"."my_utf8_to_latin1_func"(text);
CREATE FUNCTION "public"."my_utf8_to_latin1_func"(text)
  RETURNS "pg_catalog"."text" AS $BODY$
BEGIN
    -- In a real function, you would perform the actual encoding conversion here.
    -- For demonstration, we'll simply return the input.
    RETURN $1;
END;
$BODY$
  LANGUAGE plpgsql VOLATILE
  COST 100;

-- ----------------------------
-- View structure for twice_value_products
-- ----------------------------
DROP VIEW IF EXISTS "public"."twice_value_products";
CREATE VIEW "public"."twice_value_products" AS  SELECT id,
    name_varchar100,
    price_numeric10_2,
    jsonb_meta,
    created_at_timestamp,
    status_enum,
    is_verified_bool,
    count_real,
    todos_strarray,
    thumb_bytea,
    duration_int4range,
    ip_macaddr,
    definition_xml,
    address_composite,
    brand_id_int8,
    run_at_time,
    letter_char,
    tag_bit,
    counter_interval,
    rollno_domain,
    guid_uuid
   FROM products
  WHERE price_numeric10_2 > 1::numeric;

-- ----------------------------
-- Alter sequences owned by
-- ----------------------------
ALTER SEQUENCE "public"."brands_id_seq"
OWNED BY "public"."brands"."id";
SELECT setval('"public"."brands_id_seq"', 1, true);

-- ----------------------------
-- Alter sequences owned by
-- ----------------------------
ALTER SEQUENCE "public"."product_tags_id_seq"
OWNED BY "public"."product_tags"."id";
SELECT setval('"public"."product_tags_id_seq"', 2, true);

-- ----------------------------
-- Alter sequences owned by
-- ----------------------------
ALTER SEQUENCE "public"."products_id_seq"
OWNED BY "public"."products"."id";
SELECT setval('"public"."products_id_seq"', 1, true);

-- ----------------------------
-- Alter sequences owned by
-- ----------------------------
ALTER SEQUENCE "public"."tags_id_seq"
OWNED BY "public"."tags"."id";
SELECT setval('"public"."tags_id_seq"', 2, true);

-- ----------------------------
-- Uniques structure for table brands
-- ----------------------------
ALTER TABLE "public"."brands" ADD CONSTRAINT "UNQ_brands_name" UNIQUE ("name");
COMMENT ON CONSTRAINT "UNQ_brands_name" ON "public"."brands" IS 'unique brand name';

-- ----------------------------
-- Primary Key structure for table brands
-- ----------------------------
ALTER TABLE "public"."brands" ADD CONSTRAINT "brands_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Uniques structure for table product_details
-- ----------------------------
ALTER TABLE "public"."product_details" ADD CONSTRAINT "fk_product_id_UNQ" UNIQUE ("product_id");

-- ----------------------------
-- Primary Key structure for table product_details
-- ----------------------------
ALTER TABLE "public"."product_details" ADD CONSTRAINT "product_details_pkey" PRIMARY KEY ("product_id");

-- ----------------------------
-- Primary Key structure for table product_tags
-- ----------------------------
ALTER TABLE "public"."product_tags" ADD CONSTRAINT "product_tags_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Indexes structure for table products
-- ----------------------------
CREATE UNIQUE INDEX "IDX_UNQ_guid_uuid" ON "public"."products" USING btree (
  "guid_uuid" "pg_catalog"."uuid_ops" ASC NULLS LAST
);
COMMENT ON INDEX "public"."IDX_UNQ_guid_uuid" IS 'Unique UUID';
CREATE INDEX "IDX_is_verified_bool" ON "public"."products" USING hash (
  "is_verified_bool" "pg_catalog"."bool_ops"
);
CREATE INDEX "IDX_jsonb_meta" ON "public"."products" USING gin (
  "jsonb_meta" "pg_catalog"."jsonb_ops"
) WITH (GIN_PENDING_LIST_LIMIT = 65000);
CREATE INDEX "IDX_name_varchar100" ON "public"."products" USING btree (
  "name_varchar100" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);
CREATE INDEX "IDX_tags_jsonba_jsonb" ON "public"."products" USING gin (
  "tags_jsonba" "pg_catalog"."jsonb_ops"
) WITH (GIN_PENDING_LIST_LIMIT = 65000);

-- ----------------------------
-- Uniques structure for table products
-- ----------------------------
ALTER TABLE "public"."products" ADD CONSTRAINT "UNQ_name_composite" UNIQUE ("name_varchar100");
COMMENT ON CONSTRAINT "UNQ_name_composite" ON "public"."products" IS 'Unique name and email';

-- ----------------------------
-- Primary Key structure for table products
-- ----------------------------
ALTER TABLE "public"."products" ADD CONSTRAINT "products_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Triggers structure for table tags
-- ----------------------------
CREATE TRIGGER "auto_inserter" AFTER INSERT ON "public"."tags"
FOR EACH ROW
EXECUTE PROCEDURE "public"."auto_insert"();

-- ----------------------------
-- Primary Key structure for table tags
-- ----------------------------
ALTER TABLE "public"."tags" ADD CONSTRAINT "tags_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Foreign Keys structure for table product_details
-- ----------------------------
ALTER TABLE "public"."product_details" ADD CONSTRAINT "FK_product_details_product_id" FOREIGN KEY ("product_id") REFERENCES "public"."products" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ----------------------------
-- Foreign Keys structure for table product_tags
-- ----------------------------
ALTER TABLE "public"."product_tags" ADD CONSTRAINT "FK_product_tags_product_id" FOREIGN KEY ("product_id") REFERENCES "public"."products" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."product_tags" ADD CONSTRAINT "FK_product_tags_tag_id" FOREIGN KEY ("tag_id") REFERENCES "public"."tags" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ----------------------------
-- Foreign Keys structure for table products
-- ----------------------------
ALTER TABLE "public"."products" ADD CONSTRAINT "FK_products_id_brands_id" FOREIGN KEY ("brand_id_int8") REFERENCES "public"."brands" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
COMMENT ON CONSTRAINT "FK_products_id_brands_id" ON "public"."products" IS 'Relate Brand ID with product FK';
