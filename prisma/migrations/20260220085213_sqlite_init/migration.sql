-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "department" TEXT,
    "shift" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_login_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "customers" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contact" TEXT,
    "otd_target" REAL NOT NULL DEFAULT 98,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "products" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'EA',
    "customer_id" TEXT NOT NULL,
    "drawing_no" TEXT,
    "std_cycle_sec" INTEGER,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "products_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "equipment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "location" TEXT,
    "manufacturer" TEXT,
    "install_date" DATETIME,
    "pm_cycle_days" INTEGER,
    "last_pm_date" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'running',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "processes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "seq" INTEGER NOT NULL,
    "product_id" TEXT,
    "equipment_id" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "processes_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "processes_equipment_id_fkey" FOREIGN KEY ("equipment_id") REFERENCES "equipment" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "materials" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'KG',
    "spec" TEXT,
    "supplier" TEXT,
    "safety_stock" REAL NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "work_orders" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "wo_no" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "planned_qty" INTEGER NOT NULL,
    "produced_qty" INTEGER NOT NULL DEFAULT 0,
    "defect_qty" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "planned_start" DATETIME NOT NULL,
    "planned_end" DATETIME NOT NULL,
    "actual_start" DATETIME,
    "actual_end" DATETIME,
    "due_date" DATETIME NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 5,
    "notes" TEXT,
    "created_by" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "work_orders_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "work_orders_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "work_orders_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "production_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "work_order_id" TEXT NOT NULL,
    "process_id" TEXT NOT NULL,
    "equipment_id" TEXT NOT NULL,
    "operator_id" TEXT NOT NULL,
    "lot_no" TEXT NOT NULL,
    "planned_qty" INTEGER NOT NULL,
    "good_qty" INTEGER NOT NULL,
    "defect_qty" INTEGER NOT NULL DEFAULT 0,
    "scrap_qty" INTEGER NOT NULL DEFAULT 0,
    "start_time" DATETIME NOT NULL,
    "end_time" DATETIME,
    "cycle_time_sec" INTEGER,
    "notes" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "production_logs_work_order_id_fkey" FOREIGN KEY ("work_order_id") REFERENCES "work_orders" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "production_logs_process_id_fkey" FOREIGN KEY ("process_id") REFERENCES "processes" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "production_logs_equipment_id_fkey" FOREIGN KEY ("equipment_id") REFERENCES "equipment" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "production_logs_operator_id_fkey" FOREIGN KEY ("operator_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "inspection_records" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "work_order_id" TEXT NOT NULL,
    "lot_no" TEXT NOT NULL,
    "process_id" TEXT,
    "inspector_id" TEXT NOT NULL,
    "sample_qty" INTEGER NOT NULL,
    "pass_qty" INTEGER NOT NULL,
    "fail_qty" INTEGER NOT NULL,
    "result" TEXT NOT NULL,
    "inspection_date" DATETIME NOT NULL,
    "notes" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "inspection_records_work_order_id_fkey" FOREIGN KEY ("work_order_id") REFERENCES "work_orders" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "inspection_records_process_id_fkey" FOREIGN KEY ("process_id") REFERENCES "processes" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "inspection_records_inspector_id_fkey" FOREIGN KEY ("inspector_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "defect_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "production_log_id" TEXT,
    "inspection_id" TEXT,
    "defect_code" TEXT NOT NULL,
    "defect_name" TEXT NOT NULL,
    "qty" INTEGER NOT NULL,
    "disposition" TEXT NOT NULL,
    "root_cause" TEXT,
    "corrective_action" TEXT,
    "created_by" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "defect_logs_production_log_id_fkey" FOREIGN KEY ("production_log_id") REFERENCES "production_logs" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "defect_logs_inspection_id_fkey" FOREIGN KEY ("inspection_id") REFERENCES "inspection_records" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "spc_measurements" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "work_order_id" TEXT NOT NULL,
    "process_id" TEXT NOT NULL,
    "equipment_id" TEXT,
    "operator_id" TEXT NOT NULL,
    "characteristic" TEXT NOT NULL,
    "usl" REAL NOT NULL,
    "lsl" REAL NOT NULL,
    "nominal" REAL NOT NULL,
    "measured_value" REAL NOT NULL,
    "measured_at" DATETIME NOT NULL,
    "subgroup_no" INTEGER NOT NULL,
    CONSTRAINT "spc_measurements_process_id_fkey" FOREIGN KEY ("process_id") REFERENCES "processes" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "spc_measurements_equipment_id_fkey" FOREIGN KEY ("equipment_id") REFERENCES "equipment" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "nonconformance_reports" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ncr_no" TEXT NOT NULL,
    "inspection_id" TEXT NOT NULL,
    "disposition" TEXT NOT NULL,
    "approver_id" TEXT,
    "approved_at" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'open',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "nonconformance_reports_inspection_id_fkey" FOREIGN KEY ("inspection_id") REFERENCES "inspection_records" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "equipment_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "equipment_id" TEXT NOT NULL,
    "log_date" DATETIME NOT NULL,
    "shift" TEXT NOT NULL,
    "planned_time_min" INTEGER NOT NULL,
    "actual_time_min" INTEGER NOT NULL,
    "breakdown_min" INTEGER NOT NULL DEFAULT 0,
    "setup_min" INTEGER NOT NULL DEFAULT 0,
    "planned_qty" INTEGER NOT NULL,
    "actual_qty" INTEGER NOT NULL,
    "good_qty" INTEGER NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "equipment_logs_equipment_id_fkey" FOREIGN KEY ("equipment_id") REFERENCES "equipment" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "maintenance_records" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "equipment_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "technician_id" TEXT NOT NULL,
    "start_time" DATETIME NOT NULL,
    "end_time" DATETIME,
    "parts_used" TEXT,
    "cost" REAL,
    "next_pm_date" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "maintenance_records_equipment_id_fkey" FOREIGN KEY ("equipment_id") REFERENCES "equipment" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "maintenance_records_technician_id_fkey" FOREIGN KEY ("technician_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "lot_traceability" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "lot_no" TEXT NOT NULL,
    "material_id" TEXT,
    "material_lot" TEXT,
    "work_order_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "qty" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'wip',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "lot_traceability_material_id_fkey" FOREIGN KEY ("material_id") REFERENCES "materials" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "lot_traceability_work_order_id_fkey" FOREIGN KEY ("work_order_id") REFERENCES "work_orders" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "lot_traceability_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "inventory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "material_id" TEXT,
    "product_id" TEXT,
    "lot_no" TEXT,
    "qty" REAL NOT NULL,
    "location" TEXT,
    "status" TEXT NOT NULL DEFAULT 'available',
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "inventory_material_id_fkey" FOREIGN KEY ("material_id") REFERENCES "materials" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "inventory_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "inventory_movements" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "inventory_id" TEXT NOT NULL,
    "movement_type" TEXT NOT NULL,
    "qty" REAL NOT NULL,
    "work_order_id" TEXT,
    "reference_no" TEXT,
    "created_by" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "inventory_movements_inventory_id_fkey" FOREIGN KEY ("inventory_id") REFERENCES "inventory" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "shipments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shipment_no" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "work_order_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "lot_no" TEXT,
    "shipped_qty" INTEGER NOT NULL,
    "planned_date" DATETIME NOT NULL,
    "actual_date" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'planned',
    "created_by" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "shipments_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "shipments_work_order_id_fkey" FOREIGN KEY ("work_order_id") REFERENCES "work_orders" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "shipments_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "sequences" (
    "prefix" TEXT NOT NULL PRIMARY KEY,
    "current_val" INTEGER NOT NULL DEFAULT 0,
    "last_date" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "customers_code_key" ON "customers"("code");

-- CreateIndex
CREATE UNIQUE INDEX "products_code_key" ON "products"("code");

-- CreateIndex
CREATE UNIQUE INDEX "equipment_code_key" ON "equipment"("code");

-- CreateIndex
CREATE UNIQUE INDEX "processes_code_key" ON "processes"("code");

-- CreateIndex
CREATE UNIQUE INDEX "materials_code_key" ON "materials"("code");

-- CreateIndex
CREATE UNIQUE INDEX "work_orders_wo_no_key" ON "work_orders"("wo_no");

-- CreateIndex
CREATE UNIQUE INDEX "nonconformance_reports_ncr_no_key" ON "nonconformance_reports"("ncr_no");

-- CreateIndex
CREATE UNIQUE INDEX "lot_traceability_lot_no_key" ON "lot_traceability"("lot_no");

-- CreateIndex
CREATE UNIQUE INDEX "shipments_shipment_no_key" ON "shipments"("shipment_no");
