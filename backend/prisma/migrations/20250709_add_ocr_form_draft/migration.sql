-- CreateTable
CREATE TABLE "OCRFormDraft" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "fields" JSONB NOT NULL,
    "items" JSONB NOT NULL,
    "originalImage" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OCRFormDraft_pkey" PRIMARY KEY ("id")
);