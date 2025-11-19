/*
 Source Server         : Localhost
 Source Server Type    : PostgreSQL
 Source Server Version : 170002 (170002)
 Source Host           : 127.0.0.1:5432
 Source Catalog        : test_db
 Source Schema         : store

 Target Server Type    : PostgreSQL
 Target Server Version : 170002 (170002)
 File Encoding         : 65001

 Date: 19/11/2025 22:58:07
*/


-- ----------------------------
-- Sequence structure for categories_category_id_seq
-- ----------------------------
DROP SEQUENCE IF EXISTS "store"."categories_category_id_seq";
CREATE SEQUENCE "store"."categories_category_id_seq"
INCREMENT 1
MINVALUE  1
MAXVALUE 2147483647
START 1
CACHE 1;

-- ----------------------------
-- Sequence structure for order_items_order_item_id_seq
-- ----------------------------
DROP SEQUENCE IF EXISTS "store"."order_items_order_item_id_seq";
CREATE SEQUENCE "store"."order_items_order_item_id_seq"
INCREMENT 1
MINVALUE  1
MAXVALUE 2147483647
START 1
CACHE 1;

-- ----------------------------
-- Sequence structure for orders_order_id_seq
-- ----------------------------
DROP SEQUENCE IF EXISTS "store"."orders_order_id_seq";
CREATE SEQUENCE "store"."orders_order_id_seq"
INCREMENT 1
MINVALUE  1
MAXVALUE 2147483647
START 1
CACHE 1;

-- ----------------------------
-- Sequence structure for payments_payment_id_seq
-- ----------------------------
DROP SEQUENCE IF EXISTS "store"."payments_payment_id_seq";
CREATE SEQUENCE "store"."payments_payment_id_seq"
INCREMENT 1
MINVALUE  1
MAXVALUE 2147483647
START 1
CACHE 1;

-- ----------------------------
-- Table structure for categories
-- ----------------------------
DROP TABLE IF EXISTS "store"."categories";
CREATE TABLE "store"."categories" (
  "category_id" int4 NOT NULL DEFAULT nextval('"store".categories_category_id_seq'::regclass),
  "name" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "description" text COLLATE "pg_catalog"."default"
)
;

-- ----------------------------
-- Records of categories
-- ----------------------------

-- ----------------------------
-- Table structure for order_items
-- ----------------------------
DROP TABLE IF EXISTS "store"."order_items";
CREATE TABLE "store"."order_items" (
  "order_item_id" int4 NOT NULL DEFAULT nextval('"store".order_items_order_item_id_seq'::regclass),
  "order_id" int4,
  "product_id" int4,
  "quantity" int4 NOT NULL,
  "unit_price" numeric(10,2) NOT NULL
)
;

-- ----------------------------
-- Records of order_items
-- ----------------------------

-- ----------------------------
-- Table structure for orders
-- ----------------------------
DROP TABLE IF EXISTS "store"."orders";
CREATE TABLE "store"."orders" (
  "order_id" int4 NOT NULL DEFAULT nextval('"store".orders_order_id_seq'::regclass),
  "user_id" int4,
  "order_date" timestamp(6) DEFAULT CURRENT_TIMESTAMP,
  "status" varchar(20) COLLATE "pg_catalog"."default" DEFAULT 'pending'::character varying,
  "total_amount" numeric(10,2) NOT NULL
)
;

-- ----------------------------
-- Records of orders
-- ----------------------------

-- ----------------------------
-- Table structure for payments
-- ----------------------------
DROP TABLE IF EXISTS "store"."payments";
CREATE TABLE "store"."payments" (
  "payment_id" int4 NOT NULL DEFAULT nextval('"store".payments_payment_id_seq'::regclass),
  "order_id" int4,
  "payment_date" timestamp(6) DEFAULT CURRENT_TIMESTAMP,
  "amount" numeric(10,2) NOT NULL,
  "payment_method" varchar(50) COLLATE "pg_catalog"."default",
  "status" varchar(20) COLLATE "pg_catalog"."default" DEFAULT 'completed'::character varying
)
;

-- ----------------------------
-- Records of payments
-- ----------------------------

-- ----------------------------
-- Alter sequences owned by
-- ----------------------------
ALTER SEQUENCE "store"."categories_category_id_seq"
OWNED BY "store"."categories"."category_id";
SELECT setval('"store"."categories_category_id_seq"', 1, false);

-- ----------------------------
-- Alter sequences owned by
-- ----------------------------
ALTER SEQUENCE "store"."order_items_order_item_id_seq"
OWNED BY "store"."order_items"."order_item_id";
SELECT setval('"store"."order_items_order_item_id_seq"', 1, false);

-- ----------------------------
-- Alter sequences owned by
-- ----------------------------
ALTER SEQUENCE "store"."orders_order_id_seq"
OWNED BY "store"."orders"."order_id";
SELECT setval('"store"."orders_order_id_seq"', 1, false);

-- ----------------------------
-- Alter sequences owned by
-- ----------------------------
ALTER SEQUENCE "store"."payments_payment_id_seq"
OWNED BY "store"."payments"."payment_id";
SELECT setval('"store"."payments_payment_id_seq"', 1, false);

-- ----------------------------
-- Uniques structure for table categories
-- ----------------------------
ALTER TABLE "store"."categories" ADD CONSTRAINT "categories_name_key" UNIQUE ("name");

-- ----------------------------
-- Primary Key structure for table categories
-- ----------------------------
ALTER TABLE "store"."categories" ADD CONSTRAINT "categories_pkey" PRIMARY KEY ("category_id");

-- ----------------------------
-- Primary Key structure for table order_items
-- ----------------------------
ALTER TABLE "store"."order_items" ADD CONSTRAINT "order_items_pkey" PRIMARY KEY ("order_item_id");

-- ----------------------------
-- Primary Key structure for table orders
-- ----------------------------
ALTER TABLE "store"."orders" ADD CONSTRAINT "orders_pkey" PRIMARY KEY ("order_id");

-- ----------------------------
-- Primary Key structure for table payments
-- ----------------------------
ALTER TABLE "store"."payments" ADD CONSTRAINT "payments_pkey" PRIMARY KEY ("payment_id");

-- ----------------------------
-- Foreign Keys structure for table order_items
-- ----------------------------
ALTER TABLE "store"."order_items" ADD CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "store"."orders" ("order_id") ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE "store"."order_items" ADD CONSTRAINT "order_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- ----------------------------
-- Foreign Keys structure for table orders
-- ----------------------------
ALTER TABLE "store"."orders" ADD CONSTRAINT "orders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"."users" ("user_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- ----------------------------
-- Foreign Keys structure for table payments
-- ----------------------------
ALTER TABLE "store"."payments" ADD CONSTRAINT "payments_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "store"."orders" ("order_id") ON DELETE NO ACTION ON UPDATE NO ACTION;
