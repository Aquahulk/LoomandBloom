-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ServiceBooking" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "serviceId" TEXT NOT NULL,
    "userId" TEXT,
    "date" TEXT NOT NULL,
    "startMinutes" INTEGER NOT NULL,
    "durationMinutes" INTEGER NOT NULL DEFAULT 120,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "customerName" TEXT NOT NULL,
    "customerPhone" TEXT NOT NULL,
    "customerEmail" TEXT,
    "addressLine1" TEXT,
    "addressLine2" TEXT,
    "city" TEXT,
    "state" TEXT,
    "postalCode" TEXT,
    "paymentId" TEXT,
    "amountPaid" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ServiceBooking_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ServiceBooking_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_ServiceBooking" ("addressLine1", "addressLine2", "amountPaid", "city", "createdAt", "customerEmail", "customerName", "customerPhone", "date", "durationMinutes", "id", "notes", "paymentId", "postalCode", "serviceId", "startMinutes", "state", "status", "updatedAt", "userId") SELECT "addressLine1", "addressLine2", coalesce("amountPaid", 0) AS "amountPaid", "city", "createdAt", "customerEmail", "customerName", "customerPhone", "date", "durationMinutes", "id", "notes", "paymentId", "postalCode", "serviceId", "startMinutes", "state", "status", "updatedAt", "userId" FROM "ServiceBooking";
DROP TABLE "ServiceBooking";
ALTER TABLE "new_ServiceBooking" RENAME TO "ServiceBooking";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
