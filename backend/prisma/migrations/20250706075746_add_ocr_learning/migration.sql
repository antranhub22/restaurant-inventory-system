-- CreateTable
CREATE TABLE "OcrCorrection" (
    "id" SERIAL NOT NULL,
    "originalText" TEXT NOT NULL,
    "correctedText" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OcrCorrection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OcrLearning" (
    "id" SERIAL NOT NULL,
    "originalText" TEXT NOT NULL,
    "correctedText" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "correctionCount" INTEGER NOT NULL DEFAULT 1,
    "confidence" DOUBLE PRECISION NOT NULL,
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OcrLearning_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OcrCorrection_type_idx" ON "OcrCorrection"("type");

-- CreateIndex
CREATE INDEX "OcrCorrection_originalText_idx" ON "OcrCorrection"("originalText");

-- CreateIndex
CREATE INDEX "OcrLearning_type_idx" ON "OcrLearning"("type");

-- CreateIndex
CREATE INDEX "OcrLearning_originalText_idx" ON "OcrLearning"("originalText");

-- CreateIndex
CREATE INDEX "OcrLearning_correctionCount_idx" ON "OcrLearning"("correctionCount"); 