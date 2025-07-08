import { protos } from '@google-cloud/vision';
import visionClient from '../config/vision.config';
import { PrismaClient } from '@prisma/client';
import vietnameseService from './vietnamese.service';
import ocrLearningService from './ocr.learning.service';

const prisma = new PrismaClient();

export interface OcrResult {
  supplier: string;
  date: string;
  total: number;
  items: Array<{
    name: string;
    quantity: number;
    unit_price: number;
    total: number;
    confidence: number;
  }>;
  confidence: number;
  needsReview: boolean;
}

interface TextBlock {
  text: string;
  confidence: number;
  boundingBox: {
    left: number;
    top: number;
    right: number;
    bottom: number;
  };
}

class OcrService {
  private static readonly MIN_CONFIDENCE_SCORE = parseFloat(process.env.OCR_MIN_CONFIDENCE_SCORE || '0.8');
  private static readonly MIN_ITEM_MATCH_SCORE = 0.85;
  private static readonly REVIEW_THRESHOLD = 0.9;

  private async extractTextFromImage(imageBuffer: Buffer): Promise<TextBlock[]> {
    try {
      const [result] = await visionClient.documentTextDetection({
        image: { content: imageBuffer },
        imageContext: {
          languageHints: ['vi'] // Thiết lập ngôn ngữ là tiếng Việt
        }
      });
      
      const fullTextAnnotation = result.fullTextAnnotation;
      
      if (!fullTextAnnotation || !fullTextAnnotation.pages) {
        throw new Error('Không thể nhận dạng văn bản trong ảnh');
      }

      const textBlocks: TextBlock[] = [];
      
      fullTextAnnotation.pages.forEach(page => {
        page.blocks?.forEach(block => {
          if (block.boundingBox?.vertices) {
            const [topLeft, topRight, bottomRight, bottomLeft] = block.boundingBox.vertices;
            
            const text = block.paragraphs?.map(p => 
              p.words?.map(w => 
                w.symbols?.map(s => s.text).join('')
              ).join(' ')
            ).join('\n') || '';

            const confidence = block.confidence || 0;

            if (confidence >= OcrService.MIN_CONFIDENCE_SCORE) {
              textBlocks.push({
                text,
                confidence,
                boundingBox: {
                  left: Math.min(topLeft.x || 0, bottomLeft.x || 0),
                  top: Math.min(topLeft.y || 0, topRight.y || 0),
                  right: Math.max(topRight.x || 0, bottomRight.x || 0),
                  bottom: Math.max(bottomLeft.y || 0, bottomRight.y || 0)
                }
              });
            }
          }
        });
      });

      return textBlocks;
    } catch (error) {
      console.error('Error in extractTextFromImage:', error);
      throw new Error('Lỗi khi xử lý OCR');
    }
  }

  private async findSupplier(textBlocks: TextBlock[]): Promise<{ text: string; confidence: number }> {
    // Thường supplier sẽ ở đầu hóa đơn và có font size lớn (boundingBox rộng)
    const potentialSuppliers = textBlocks
      .filter(block => block.boundingBox.top < 200) // Chỉ xét phần đầu hóa đơn
      .sort((a, b) => {
        const aWidth = a.boundingBox.right - a.boundingBox.left;
        const bWidth = b.boundingBox.right - b.boundingBox.left;
        return bWidth - aWidth; // Sort by width descending
      });

    if (potentialSuppliers.length > 0) {
      const supplierText = vietnameseService.normalizeVietnameseText(potentialSuppliers[0].text);
      
      // Kiểm tra xem có correction nào phù hợp không
      const correction = await ocrLearningService.findBestCorrection(supplierText, 'supplier');
      
      if (correction) {
        return {
          text: correction.correctedText,
          confidence: correction.confidence
        };
      }

      return {
        text: supplierText,
        confidence: potentialSuppliers[0].confidence
      };
    }

    return {
      text: 'Không xác định',
      confidence: 0
    };
  }

  private async findDate(textBlocks: TextBlock[]): Promise<{ text: string; confidence: number }> {
    const dateRegex = /(\d{1,2})[/-](\d{1,2})[/-](\d{4})/;
    
    for (const block of textBlocks) {
      const match = block.text.match(dateRegex);
      if (match) {
        const [_, day, month, year] = match;
        const dateStr = `${day}/${month}/${year}`;
        
        // Kiểm tra correction
        const correction = await ocrLearningService.findBestCorrection(dateStr, 'date');
        
        if (correction) {
          return {
            text: correction.correctedText,
            confidence: correction.confidence
          };
        }

        return {
          text: dateStr,
          confidence: block.confidence
        };
      }
    }

    const today = new Date().toLocaleDateString('vi-VN');
    return {
      text: today,
      confidence: 0
    };
  }

  private async findTotal(textBlocks: TextBlock[]): Promise<{ value: number; confidence: number }> {
    const totalRegex = /(?:tổng\s*(?:tiền|cộng)|thành\s*tiền)\s*:?\s*([\d,.]+)/i;
    
    for (const block of textBlocks) {
      const normalizedText = vietnameseService.normalizeVietnameseText(block.text);
      const match = normalizedText.toLowerCase().match(totalRegex);
      if (match) {
        const totalStr = match[1].replace(/[,.]/g, '');
        const total = parseInt(totalStr, 10);
        
        // Kiểm tra correction
        const correction = await ocrLearningService.findBestCorrection(totalStr, 'total');
        
        if (correction) {
          return {
            value: parseInt(correction.correctedText, 10),
            confidence: correction.confidence
          };
        }

        return {
          value: total,
          confidence: block.confidence
        };
      }
    }

    return {
      value: 0,
      confidence: 0
    };
  }

  private async findItems(textBlocks: TextBlock[]): Promise<Array<{
    name: string;
    quantity: number;
    unit_price: number;
    total: number;
    confidence: number;
  }>> {
    const items: Array<{
      name: string;
      quantity: number;
      unit_price: number;
      total: number;
      confidence: number;
    }> = [];
    
    const itemRegex = /^([\p{L}\s]+)\s*(\d+)\s*(?:x\s*)?(\d+(?:[,.]\d+)?)/u;

    // Lấy danh sách sản phẩm từ database để so khớp
    const dbItems = await prisma.item.findMany({
      select: { name: true }
    });
    const itemNames = dbItems.map(item => item.name);

    for (const block of textBlocks) {
      const match = block.text.match(itemRegex);
      if (match) {
        const [_, rawName, quantity, price] = match;
        
        // Tìm tên sản phẩm phù hợp nhất
        const bestMatch = vietnameseService.findBestMatch(rawName, itemNames);
        
        if (bestMatch.similarity >= OcrService.MIN_ITEM_MATCH_SCORE) {
          // Kiểm tra correction cho tên sản phẩm
          const nameCorrection = await ocrLearningService.findBestCorrection(bestMatch.text, 'item');
          const finalName = nameCorrection ? nameCorrection.correctedText : bestMatch.text;
          const confidence = nameCorrection ? nameCorrection.confidence : bestMatch.similarity;

          const unitPrice = parseFloat(price.replace(',', '.'));
          items.push({
            name: finalName,
            quantity: parseInt(quantity, 10),
            unit_price: unitPrice,
            total: parseInt(quantity, 10) * unitPrice,
            confidence: confidence
          });
        }
      }
    }

    return items;
  }

  public async processReceipt(imageBuffer: Buffer): Promise<OcrResult> {
    const textBlocks = await this.extractTextFromImage(imageBuffer);
    
    const [supplier, date, total, items] = await Promise.all([
      this.findSupplier(textBlocks),
      this.findDate(textBlocks),
      this.findTotal(textBlocks),
      this.findItems(textBlocks)
    ]);

    // Tính toán độ tin cậy trung bình
    const confidences = [
      supplier.confidence,
      date.confidence,
      total.confidence,
      ...items.map(item => item.confidence)
    ];
    const avgConfidence = confidences.reduce((sum, conf) => sum + conf, 0) / confidences.length;

    // Kiểm tra xem có cần review không
    const needsReview = avgConfidence < OcrService.REVIEW_THRESHOLD || 
      confidences.some(conf => conf < OcrService.MIN_CONFIDENCE_SCORE);

    return {
      supplier: supplier.text,
      date: date.text,
      total: total.value,
      items,
      confidence: avgConfidence,
      needsReview
    };
  }

  // Lưu các sửa đổi từ người dùng
  public async saveCorrections(original: OcrResult, corrected: OcrResult): Promise<void> {
    // Lưu correction cho supplier
    if (original.supplier !== corrected.supplier) {
      await ocrLearningService.saveCorrection({
        originalText: original.supplier,
        correctedText: corrected.supplier,
        type: 'supplier',
        confidence: corrected.confidence
      });
    }

    // Lưu correction cho date
    if (original.date !== corrected.date) {
      await ocrLearningService.saveCorrection({
        originalText: original.date,
        correctedText: corrected.date,
        type: 'date',
        confidence: corrected.confidence
      });
    }

    // Lưu correction cho total
    if (original.total !== corrected.total) {
      await ocrLearningService.saveCorrection({
        originalText: original.total.toString(),
        correctedText: corrected.total.toString(),
        type: 'total',
        confidence: corrected.confidence
      });
    }

    // Lưu correction cho items
    for (let i = 0; i < Math.min(original.items.length, corrected.items.length); i++) {
      const originalItem = original.items[i];
      const correctedItem = corrected.items[i];

      if (originalItem.name !== correctedItem.name) {
        await ocrLearningService.saveCorrection({
          originalText: originalItem.name,
          correctedText: correctedItem.name,
          type: 'item',
          confidence: correctedItem.confidence
        });
      }
    }
  }
}

export default new OcrService(); 