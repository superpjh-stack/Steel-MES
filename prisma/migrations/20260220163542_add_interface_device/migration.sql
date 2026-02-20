-- CreateTable
CREATE TABLE "interface_devices" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "dev_type" TEXT NOT NULL,
    "protocol" TEXT NOT NULL,
    "host" TEXT,
    "port" INTEGER,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);
