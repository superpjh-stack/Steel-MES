-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "department" TEXT,
    "shift" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_login_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customers" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contact" TEXT,
    "otd_target" DOUBLE PRECISION NOT NULL DEFAULT 98,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'EA',
    "customer_id" TEXT NOT NULL,
    "drawing_no" TEXT,
    "std_cycle_sec" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "equipment" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "location" TEXT,
    "manufacturer" TEXT,
    "install_date" TIMESTAMP(3),
    "pm_cycle_days" INTEGER,
    "last_pm_date" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'running',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "equipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "processes" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "seq" INTEGER NOT NULL,
    "product_id" TEXT,
    "equipment_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "processes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "materials" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'KG',
    "spec" TEXT,
    "supplier" TEXT,
    "safety_stock" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "materials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "work_orders" (
    "id" TEXT NOT NULL,
    "wo_no" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "planned_qty" INTEGER NOT NULL,
    "produced_qty" INTEGER NOT NULL DEFAULT 0,
    "defect_qty" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "planned_start" TIMESTAMP(3) NOT NULL,
    "planned_end" TIMESTAMP(3) NOT NULL,
    "actual_start" TIMESTAMP(3),
    "actual_end" TIMESTAMP(3),
    "due_date" TIMESTAMP(3) NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 5,
    "notes" TEXT,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "work_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "production_logs" (
    "id" TEXT NOT NULL,
    "work_order_id" TEXT NOT NULL,
    "process_id" TEXT NOT NULL,
    "equipment_id" TEXT NOT NULL,
    "operator_id" TEXT NOT NULL,
    "lot_no" TEXT NOT NULL,
    "planned_qty" INTEGER NOT NULL,
    "good_qty" INTEGER NOT NULL,
    "defect_qty" INTEGER NOT NULL DEFAULT 0,
    "scrap_qty" INTEGER NOT NULL DEFAULT 0,
    "start_time" TIMESTAMP(3) NOT NULL,
    "end_time" TIMESTAMP(3),
    "cycle_time_sec" INTEGER,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "production_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inspection_records" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "work_order_id" TEXT NOT NULL,
    "lot_no" TEXT NOT NULL,
    "process_id" TEXT,
    "inspector_id" TEXT NOT NULL,
    "sample_qty" INTEGER NOT NULL,
    "pass_qty" INTEGER NOT NULL,
    "fail_qty" INTEGER NOT NULL,
    "result" TEXT NOT NULL,
    "inspection_date" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inspection_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "defect_logs" (
    "id" TEXT NOT NULL,
    "production_log_id" TEXT,
    "inspection_id" TEXT,
    "defect_code" TEXT NOT NULL,
    "defect_name" TEXT NOT NULL,
    "qty" INTEGER NOT NULL,
    "disposition" TEXT NOT NULL,
    "root_cause" TEXT,
    "corrective_action" TEXT,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "defect_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "spc_measurements" (
    "id" TEXT NOT NULL,
    "work_order_id" TEXT NOT NULL,
    "process_id" TEXT NOT NULL,
    "equipment_id" TEXT,
    "operator_id" TEXT NOT NULL,
    "characteristic" TEXT NOT NULL,
    "usl" DOUBLE PRECISION NOT NULL,
    "lsl" DOUBLE PRECISION NOT NULL,
    "nominal" DOUBLE PRECISION NOT NULL,
    "measured_value" DOUBLE PRECISION NOT NULL,
    "measured_at" TIMESTAMP(3) NOT NULL,
    "subgroup_no" INTEGER NOT NULL,

    CONSTRAINT "spc_measurements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nonconformance_reports" (
    "id" TEXT NOT NULL,
    "ncr_no" TEXT NOT NULL,
    "inspection_id" TEXT NOT NULL,
    "disposition" TEXT NOT NULL,
    "approver_id" TEXT,
    "approved_at" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'open',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "nonconformance_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "equipment_logs" (
    "id" TEXT NOT NULL,
    "equipment_id" TEXT NOT NULL,
    "log_date" TIMESTAMP(3) NOT NULL,
    "shift" TEXT NOT NULL,
    "planned_time_min" INTEGER NOT NULL,
    "actual_time_min" INTEGER NOT NULL,
    "breakdown_min" INTEGER NOT NULL DEFAULT 0,
    "setup_min" INTEGER NOT NULL DEFAULT 0,
    "planned_qty" INTEGER NOT NULL,
    "actual_qty" INTEGER NOT NULL,
    "good_qty" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "equipment_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "maintenance_records" (
    "id" TEXT NOT NULL,
    "equipment_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "technician_id" TEXT NOT NULL,
    "start_time" TIMESTAMP(3) NOT NULL,
    "end_time" TIMESTAMP(3),
    "parts_used" TEXT,
    "cost" DOUBLE PRECISION,
    "next_pm_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "maintenance_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lot_traceability" (
    "id" TEXT NOT NULL,
    "lot_no" TEXT NOT NULL,
    "material_id" TEXT,
    "material_lot" TEXT,
    "work_order_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "qty" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'wip',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lot_traceability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory" (
    "id" TEXT NOT NULL,
    "material_id" TEXT,
    "product_id" TEXT,
    "lot_no" TEXT,
    "qty" DOUBLE PRECISION NOT NULL,
    "location" TEXT,
    "status" TEXT NOT NULL DEFAULT 'available',
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inventory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_movements" (
    "id" TEXT NOT NULL,
    "inventory_id" TEXT NOT NULL,
    "movement_type" TEXT NOT NULL,
    "qty" DOUBLE PRECISION NOT NULL,
    "work_order_id" TEXT,
    "reference_no" TEXT,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inventory_movements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shipments" (
    "id" TEXT NOT NULL,
    "shipment_no" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "work_order_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "lot_no" TEXT,
    "shipped_qty" INTEGER NOT NULL,
    "planned_date" TIMESTAMP(3) NOT NULL,
    "actual_date" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'planned',
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shipments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales_orders" (
    "id" TEXT NOT NULL,
    "so_no" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "ordered_qty" INTEGER NOT NULL,
    "due_date" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'received',
    "notes" TEXT,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sales_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "common_codes" (
    "id" TEXT NOT NULL,
    "group_code" TEXT NOT NULL,
    "group_name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "code_name" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "common_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "user_name" TEXT,
    "action" TEXT NOT NULL,
    "resource" TEXT,
    "detail" TEXT,
    "ip_address" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "system_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "interface_devices" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "dev_type" TEXT NOT NULL,
    "protocol" TEXT NOT NULL,
    "host" TEXT,
    "port" INTEGER,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "interface_devices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_requirements" (
    "id" TEXT NOT NULL,
    "sales_order_id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "item" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "unit" TEXT,
    "notes" TEXT,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customer_requirements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contract_documents" (
    "id" TEXT NOT NULL,
    "sales_order_id" TEXT NOT NULL,
    "docType" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "file_url" TEXT NOT NULL,
    "file_size" INTEGER,
    "notes" TEXT,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contract_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sequences" (
    "prefix" TEXT NOT NULL,
    "current_val" INTEGER NOT NULL DEFAULT 0,
    "last_date" TEXT NOT NULL,

    CONSTRAINT "sequences_pkey" PRIMARY KEY ("prefix")
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

-- CreateIndex
CREATE UNIQUE INDEX "sales_orders_so_no_key" ON "sales_orders"("so_no");

-- CreateIndex
CREATE UNIQUE INDEX "common_codes_group_code_code_key" ON "common_codes"("group_code", "code");

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "processes" ADD CONSTRAINT "processes_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "processes" ADD CONSTRAINT "processes_equipment_id_fkey" FOREIGN KEY ("equipment_id") REFERENCES "equipment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production_logs" ADD CONSTRAINT "production_logs_work_order_id_fkey" FOREIGN KEY ("work_order_id") REFERENCES "work_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production_logs" ADD CONSTRAINT "production_logs_process_id_fkey" FOREIGN KEY ("process_id") REFERENCES "processes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production_logs" ADD CONSTRAINT "production_logs_equipment_id_fkey" FOREIGN KEY ("equipment_id") REFERENCES "equipment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production_logs" ADD CONSTRAINT "production_logs_operator_id_fkey" FOREIGN KEY ("operator_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspection_records" ADD CONSTRAINT "inspection_records_work_order_id_fkey" FOREIGN KEY ("work_order_id") REFERENCES "work_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspection_records" ADD CONSTRAINT "inspection_records_process_id_fkey" FOREIGN KEY ("process_id") REFERENCES "processes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspection_records" ADD CONSTRAINT "inspection_records_inspector_id_fkey" FOREIGN KEY ("inspector_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "defect_logs" ADD CONSTRAINT "defect_logs_production_log_id_fkey" FOREIGN KEY ("production_log_id") REFERENCES "production_logs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "defect_logs" ADD CONSTRAINT "defect_logs_inspection_id_fkey" FOREIGN KEY ("inspection_id") REFERENCES "inspection_records"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "spc_measurements" ADD CONSTRAINT "spc_measurements_process_id_fkey" FOREIGN KEY ("process_id") REFERENCES "processes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "spc_measurements" ADD CONSTRAINT "spc_measurements_equipment_id_fkey" FOREIGN KEY ("equipment_id") REFERENCES "equipment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nonconformance_reports" ADD CONSTRAINT "nonconformance_reports_inspection_id_fkey" FOREIGN KEY ("inspection_id") REFERENCES "inspection_records"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipment_logs" ADD CONSTRAINT "equipment_logs_equipment_id_fkey" FOREIGN KEY ("equipment_id") REFERENCES "equipment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_records" ADD CONSTRAINT "maintenance_records_equipment_id_fkey" FOREIGN KEY ("equipment_id") REFERENCES "equipment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_records" ADD CONSTRAINT "maintenance_records_technician_id_fkey" FOREIGN KEY ("technician_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lot_traceability" ADD CONSTRAINT "lot_traceability_material_id_fkey" FOREIGN KEY ("material_id") REFERENCES "materials"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lot_traceability" ADD CONSTRAINT "lot_traceability_work_order_id_fkey" FOREIGN KEY ("work_order_id") REFERENCES "work_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lot_traceability" ADD CONSTRAINT "lot_traceability_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory" ADD CONSTRAINT "inventory_material_id_fkey" FOREIGN KEY ("material_id") REFERENCES "materials"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory" ADD CONSTRAINT "inventory_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_inventory_id_fkey" FOREIGN KEY ("inventory_id") REFERENCES "inventory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shipments" ADD CONSTRAINT "shipments_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shipments" ADD CONSTRAINT "shipments_work_order_id_fkey" FOREIGN KEY ("work_order_id") REFERENCES "work_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shipments" ADD CONSTRAINT "shipments_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_orders" ADD CONSTRAINT "sales_orders_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_orders" ADD CONSTRAINT "sales_orders_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_orders" ADD CONSTRAINT "sales_orders_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "system_logs" ADD CONSTRAINT "system_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_requirements" ADD CONSTRAINT "customer_requirements_sales_order_id_fkey" FOREIGN KEY ("sales_order_id") REFERENCES "sales_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contract_documents" ADD CONSTRAINT "contract_documents_sales_order_id_fkey" FOREIGN KEY ("sales_order_id") REFERENCES "sales_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

