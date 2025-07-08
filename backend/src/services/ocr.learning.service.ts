import { PrismaClient, OcrCorrection as PrismaOcrCorrection, OcrLearning as PrismaOcrLearning } from '@prisma/client';
import vietnameseService from './vietnamese.service';

const prisma = new PrismaClient();

type CorrectionType = 'supplier' | 'item' | 'unit' | 'date' | 'total';

interface OcrCorrection {
  originalText: string;
  correctedText: string;
  type: CorrectionType;
  confidence: number;
}

class OcrLearningService {
  private static readonly MIN_CORRECTIONS_THRESHOLD = 3;
  private static readonly MIN_CONFIDENCE_INCREASE = 0.1;

  // Lưu correction vào database
  public async saveCorrection(correction: OcrCorrection): Promise<void> {
    const normalizedOriginal = vietnameseService.normalizeVietnameseText(correction.originalText);
    const normalizedCorrected = vietnameseService.normalizeVietnameseText(correction.correctedText);

    await prisma.ocrCorrection.create({
      data: {
        originalText: normalizedOriginal,
        correctedText: normalizedCorrected,
        type: correction.type,
        confidence: correction.confidence,
        createdAt: new Date()
      }
    });

    // Cập nhật bảng học tập
    await this.updateLearningTable(correction);
  }

  // Cập nhật bảng học tập dựa trên correction
  private async updateLearningTable(correction: OcrCorrection): Promise<void> {
    const normalizedOriginal = vietnameseService.normalizeVietnameseText(correction.originalText);
    const normalizedCorrected = vietnameseService.normalizeVietnameseText(correction.correctedText);

    // Kiểm tra xem cặp này đã tồn tại trong bảng học tập chưa
    const existingEntry = await prisma.ocrLearning.findFirst({
      where: {
        originalText: normalizedOriginal,
        type: correction.type
      }
    });

    if (existingEntry) {
      // Cập nhật entry hiện có
      await prisma.ocrLearning.update({
        where: { id: existingEntry.id },
        data: {
          correctionCount: { increment: 1 },
          confidence: Math.min(1, existingEntry.confidence + OcrLearningService.MIN_CONFIDENCE_INCREASE),
          lastUpdated: new Date()
        }
      });
    } else {
      // Tạo entry mới
      await prisma.ocrLearning.create({
        data: {
          originalText: normalizedOriginal,
          correctedText: normalizedCorrected,
          type: correction.type,
          correctionCount: 1,
          confidence: correction.confidence,
          lastUpdated: new Date()
        }
      });
    }
  }

  // Tìm correction phù hợp nhất cho một text
  public async findBestCorrection(text: string, type: CorrectionType): Promise<OcrCorrection | null> {
    const normalizedText = vietnameseService.normalizeVietnameseText(text);
    
    // Tìm các corrections có độ tương đồng cao
    const learningEntries = await prisma.ocrLearning.findMany({
      where: {
        type,
        correctionCount: {
          gte: OcrLearningService.MIN_CORRECTIONS_THRESHOLD
        }
      }
    });

    let bestMatch = null;
    let bestSimilarity = 0;

    for (const entry of learningEntries) {
      const similarity = vietnameseService.findBestMatch(
        normalizedText,
        [entry.originalText]
      ).similarity;

      if (similarity > bestSimilarity) {
        bestSimilarity = similarity;
        bestMatch = {
          originalText: text,
          correctedText: entry.correctedText,
          type: type,
          confidence: entry.confidence * similarity // Điều chỉnh độ tin cậy dựa trên độ tương đồng
        };
      }
    }

    return bestMatch;
  }

  // Lấy thống kê về corrections
  public async getStatistics(): Promise<{
    totalCorrections: number;
    averageConfidence: number;
    typeDistribution: Record<CorrectionType, number>;
  }> {
    const corrections = await prisma.ocrCorrection.findMany();
    const learningEntries = await prisma.ocrLearning.findMany();

    const typeDistribution = corrections.reduce((acc: Record<CorrectionType, number>, correction) => {
      const type = correction.type as CorrectionType;
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<CorrectionType, number>);

    const averageConfidence = learningEntries.length > 0
      ? learningEntries.reduce((sum: number, entry: PrismaOcrLearning) => sum + entry.confidence, 0) / learningEntries.length
      : 0;

    return {
      totalCorrections: corrections.length,
      averageConfidence,
      typeDistribution
    };
  }
}

export default new OcrLearningService(); 