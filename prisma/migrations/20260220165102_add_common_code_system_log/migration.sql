-- CreateTable
CREATE TABLE "common_codes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "group_code" TEXT NOT NULL,
    "group_name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "code_name" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "system_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT,
    "user_name" TEXT,
    "action" TEXT NOT NULL,
    "resource" TEXT,
    "detail" TEXT,
    "ip_address" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "system_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "common_codes_group_code_code_key" ON "common_codes"("group_code", "code");
