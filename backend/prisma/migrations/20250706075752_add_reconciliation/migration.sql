-- CreateEnum
CREATE TYPE "ShiftType" AS ENUM ('morning', 'afternoon', 'evening', 'full_day');

-- CreateEnum
CREATE TYPE "ReconciliationStatus" AS ENUM ('draft', 'pending', 'approved', 'rejected', 'cancelled');

-- CreateTable
CREATE TABLE "Reconciliation" (
    "id" SERIAL NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "departmentId" INTEGER NOT NULL,
    "shiftType" "ShiftType" NOT NULL,
    "processedById" INTEGER NOT NULL,
    "notes" TEXT,
    "status" "ReconciliationStatus" NOT NULL DEFAULT 'pending',
    "approvedById" INTEGER,
    "approvedAt" TIMESTAMP(3),
    "rejectedById" INTEGER,
    "rejectedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Reconciliation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReconciliationItem" (
    "id" SERIAL NOT NULL,
    "reconciliationId" INTEGER NOT NULL,
    "itemId" INTEGER NOT NULL,
    "openingStock" DOUBLE PRECISION NOT NULL,
    "received" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "withdrawn" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "sold" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "returned" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "wasted" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "staffConsumed" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "sampled" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "systemStock" DOUBLE PRECISION NOT NULL,
    "actualStock" DOUBLE PRECISION NOT NULL,
    "discrepancy" DOUBLE PRECISION NOT NULL,
    "discrepancyRate" DOUBLE PRECISION NOT NULL,
    "discrepancyValue" DOUBLE PRECISION NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReconciliationItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Reconciliation_date_departmentId_shiftType_key" ON "Reconciliation"("date", "departmentId", "shiftType");

-- AddForeignKey
ALTER TABLE "Reconciliation" ADD CONSTRAINT "Reconciliation_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reconciliation" ADD CONSTRAINT "Reconciliation_processedById_fkey" FOREIGN KEY ("processedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reconciliation" ADD CONSTRAINT "Reconciliation_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reconciliation" ADD CONSTRAINT "Reconciliation_rejectedById_fkey" FOREIGN KEY ("rejectedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReconciliationItem" ADD CONSTRAINT "ReconciliationItem_reconciliationId_fkey" FOREIGN KEY ("reconciliationId") REFERENCES "Reconciliation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReconciliationItem" ADD CONSTRAINT "ReconciliationItem_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE RESTRICT ON UPDATE CASCADE; 