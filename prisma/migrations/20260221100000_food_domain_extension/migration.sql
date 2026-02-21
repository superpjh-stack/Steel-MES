-- Food Domain Extension Migration
-- 제품(Product) 식품 필드 추가
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "shelf_life_days" INTEGER;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "storage_temp" TEXT;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "allergen_info" TEXT;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "is_haccp" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "net_weight" DOUBLE PRECISION;

-- 원자재(Material) 식품 필드 추가
ALTER TABLE "materials" ADD COLUMN IF NOT EXISTS "origin_country" TEXT;
ALTER TABLE "materials" ADD COLUMN IF NOT EXISTS "expiry_days" INTEGER;
ALTER TABLE "materials" ADD COLUMN IF NOT EXISTS "storage_temp" TEXT;
ALTER TABLE "materials" ADD COLUMN IF NOT EXISTS "allergen_flag" TEXT;
ALTER TABLE "materials" ADD COLUMN IF NOT EXISTS "is_organic" BOOLEAN NOT NULL DEFAULT false;

-- 배합비(Recipe) 테이블
CREATE TABLE IF NOT EXISTS "recipes" (
    "id"            TEXT NOT NULL,
    "product_id"    TEXT NOT NULL,
    "version"       TEXT NOT NULL DEFAULT '1.0',
    "batch_size_kg" DOUBLE PRECISION NOT NULL,
    "status"        TEXT NOT NULL DEFAULT 'draft',
    "approved_by"   TEXT,
    "approved_at"   TIMESTAMPTZ,
    "notes"         TEXT,
    "created_by"    TEXT NOT NULL,
    "created_at"    TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"    TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "recipes_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "recipes_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- 배합비 원료 상세(RecipeIngredient)
CREATE TABLE IF NOT EXISTS "recipe_ingredients" (
    "id"          TEXT NOT NULL,
    "recipe_id"   TEXT NOT NULL,
    "material_id" TEXT NOT NULL,
    "ratio"       DOUBLE PRECISION NOT NULL,
    "amount_kg"   DOUBLE PRECISION NOT NULL,
    "sort_order"  INTEGER NOT NULL DEFAULT 0,
    "notes"       TEXT,
    CONSTRAINT "recipe_ingredients_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "recipe_ingredients_recipe_id_fkey" FOREIGN KEY ("recipe_id") REFERENCES "recipes"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "recipe_ingredients_material_id_fkey" FOREIGN KEY ("material_id") REFERENCES "materials"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- HACCP 계획(HaccpPlan)
CREATE TABLE IF NOT EXISTS "haccp_plans" (
    "id"                 TEXT NOT NULL,
    "product_id"         TEXT,
    "process_code"       TEXT,
    "ccp_no"             TEXT NOT NULL,
    "hazard_type"        TEXT NOT NULL,
    "hazard_desc"        TEXT NOT NULL,
    "critical_limit"     TEXT NOT NULL,
    "monitoring_freq"    TEXT NOT NULL,
    "corrective_action"  TEXT NOT NULL,
    "verify_method"      TEXT,
    "status"             TEXT NOT NULL DEFAULT 'active',
    "effective_date"     TIMESTAMPTZ NOT NULL,
    "created_by"         TEXT NOT NULL,
    "created_at"         TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"         TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "haccp_plans_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "haccp_plans_ccp_no_key" UNIQUE ("ccp_no")
);

-- CCP 모니터링(CcpMonitoring)
CREATE TABLE IF NOT EXISTS "ccp_monitoring" (
    "id"              TEXT NOT NULL,
    "haccp_plan_id"   TEXT NOT NULL,
    "work_order_id"   TEXT,
    "lot_no"          TEXT,
    "monitored_at"    TIMESTAMPTZ NOT NULL,
    "measured_value"  TEXT NOT NULL,
    "result"          TEXT NOT NULL,
    "deviation_note"  TEXT,
    "operator_id"     TEXT NOT NULL,
    "created_at"      TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ccp_monitoring_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "ccp_monitoring_haccp_plan_id_fkey" FOREIGN KEY ("haccp_plan_id") REFERENCES "haccp_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- 위생점검(HygieneCheck)
CREATE TABLE IF NOT EXISTS "hygiene_checks" (
    "id"                 TEXT NOT NULL,
    "check_date"         TIMESTAMPTZ NOT NULL,
    "shift"              TEXT NOT NULL,
    "area"               TEXT NOT NULL,
    "checked_by"         TEXT NOT NULL,
    "items"              TEXT NOT NULL,
    "result"             TEXT NOT NULL,
    "fail_items"         TEXT,
    "corrective_action"  TEXT,
    "notes"              TEXT,
    "created_at"         TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "hygiene_checks_pkey" PRIMARY KEY ("id")
);

-- 이물검출(ForeignBodyReport)
CREATE TABLE IF NOT EXISTS "foreign_body_reports" (
    "id"                 TEXT NOT NULL,
    "report_no"          TEXT NOT NULL,
    "detected_at"        TIMESTAMPTZ NOT NULL,
    "lot_no"             TEXT,
    "product_id"         TEXT,
    "detection_point"    TEXT NOT NULL,
    "foreign_type"       TEXT NOT NULL,
    "size"               TEXT,
    "disposition"        TEXT NOT NULL,
    "root_cause"         TEXT,
    "corrective_action"  TEXT,
    "affected_qty"       INTEGER NOT NULL DEFAULT 0,
    "reported_by"        TEXT NOT NULL,
    "status"             TEXT NOT NULL DEFAULT 'open',
    "created_at"         TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "foreign_body_reports_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "foreign_body_reports_report_no_key" UNIQUE ("report_no")
);

-- 알레르기 코드(AllergenCode)
CREATE TABLE IF NOT EXISTS "allergen_codes" (
    "id"       TEXT NOT NULL,
    "code"     TEXT NOT NULL,
    "name"     TEXT NOT NULL,
    "name_en"  TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "allergen_codes_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "allergen_codes_code_key" UNIQUE ("code")
);

-- 알레르기 초기 데이터 (식품위생법 21종)
INSERT INTO "allergen_codes" ("id", "code", "name", "name_en") VALUES
    (gen_random_uuid()::text, 'ALG-01', '난류(가금류)', 'Eggs'),
    (gen_random_uuid()::text, 'ALG-02', '우유', 'Milk'),
    (gen_random_uuid()::text, 'ALG-03', '메밀', 'Buckwheat'),
    (gen_random_uuid()::text, 'ALG-04', '땅콩', 'Peanuts'),
    (gen_random_uuid()::text, 'ALG-05', '대두(콩)', 'Soybeans'),
    (gen_random_uuid()::text, 'ALG-06', '밀', 'Wheat'),
    (gen_random_uuid()::text, 'ALG-07', '고등어', 'Mackerel'),
    (gen_random_uuid()::text, 'ALG-08', '게', 'Crab'),
    (gen_random_uuid()::text, 'ALG-09', '새우', 'Shrimp'),
    (gen_random_uuid()::text, 'ALG-10', '돼지고기', 'Pork'),
    (gen_random_uuid()::text, 'ALG-11', '복숭아', 'Peach'),
    (gen_random_uuid()::text, 'ALG-12', '토마토', 'Tomato'),
    (gen_random_uuid()::text, 'ALG-13', '아황산류', 'Sulfites'),
    (gen_random_uuid()::text, 'ALG-14', '호두', 'Walnut'),
    (gen_random_uuid()::text, 'ALG-15', '닭고기', 'Chicken'),
    (gen_random_uuid()::text, 'ALG-16', '쇠고기', 'Beef'),
    (gen_random_uuid()::text, 'ALG-17', '오징어', 'Squid'),
    (gen_random_uuid()::text, 'ALG-18', '조개류(굴, 전복, 홍합 포함)', 'Shellfish'),
    (gen_random_uuid()::text, 'ALG-19', '잣', 'Pine nuts'),
    (gen_random_uuid()::text, 'ALG-20', '참깨', 'Sesame'),
    (gen_random_uuid()::text, 'ALG-21', '아몬드', 'Almond')
ON CONFLICT ("code") DO NOTHING;
