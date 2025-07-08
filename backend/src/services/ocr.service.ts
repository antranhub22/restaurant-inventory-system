import { createWorker } from 'tesseract.js';
import { PrismaClient } from '@prisma/client';
import vietnameseService from './vietnamese.service';
import ocrLearningService from './ocr.learning.service';

const prisma = new PrismaClient();

interface TesseractWord {
  text: string;
  confidence: number;
  bbox: {
    x0: number;
    y0: number;
    x1: number;
    y1: number;
  };
}

interface TesseractLine {
  text: string;
  words: TesseractWord[];
  bbox: {
    x0: number;
    y0: number;
    x1: number;
    y1: number;
  };
}

interface TesseractParagraph {
  text: string;
  lines: TesseractLine[];
  bbox: {
    x0: number;
    y0: number;
    x1: number;
    y1: number;
  };
}

interface TesseractResult {
  text: string;
  confidence: number;
  paragraphs: TesseractParagraph[];
}

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
      console.log('🔍 Bắt đầu xử lý OCR với Tesseract...');
      console.log('📊 Kích thước ảnh:', imageBuffer.length, 'bytes');

      const worker = await createWorker('vie');
      
      const result = await worker.recognize(imageBuffer);
      console.log('Raw result:', JSON.stringify(result.data, null, 2));
      
      const textBlocks: TextBlock[] = [];
      
      // Xử lý từng dòng text
      const lines = result.data.text.split('\n');
      const avgConfidence = result.data.confidence || 0;
      
      lines.forEach((line, index) => {
        if (line.trim()) {
          textBlocks.push({
            text: line.trim(),
            confidence: avgConfidence / 100,
            boundingBox: {
              left: 0,
              top: index * 20, // Giả lập vị trí dựa vào thứ tự dòng
              right: 1000,
              bottom: (index + 1) * 20
            }
          });
        }
      });

      await worker.terminate();
      
      console.log(`\n✨ Tổng số blocks đạt yêu cầu: ${textBlocks.length}`);
      return textBlocks.filter(block => block.confidence >= OcrService.MIN_CONFIDENCE_SCORE);
    } catch (error) {
      console.error('❌ Lỗi trong quá trình xử lý OCR:', error);
      throw new Error('Lỗi khi xử lý OCR');
    }
  }

  private async findSupplier(textBlocks: TextBlock[]): Promise<{ text: string; confidence: number }> {
    console.log('\n🏪 Tìm kiếm thông tin nhà cung cấp...');
    
    const potentialSuppliers = textBlocks
      .filter(block => block.boundingBox.top < 200)
      .sort((a, b) => {
        const aWidth = a.boundingBox.right - a.boundingBox.left;
        const bWidth = b.boundingBox.right - b.boundingBox.left;
        return bWidth - aWidth;
      });

    console.log('- Số ứng viên tiềm năng:', potentialSuppliers.length);
    potentialSuppliers.forEach((supplier, index) => {
      console.log(`  ${index + 1}. "${supplier.text}" (độ tin cậy: ${(supplier.confidence * 100).toFixed(1)}%)`);
    });

    if (potentialSuppliers.length > 0) {
      const supplierText = vietnameseService.normalizeVietnameseText(potentialSuppliers[0].text);
      console.log('- Text đã chuẩn hóa:', supplierText);
      
      const correction = await ocrLearningService.findBestCorrection(supplierText, 'supplier');
      
      if (correction) {
        console.log('✅ Đã tìm thấy correction:', correction.correctedText);
        return {
          text: correction.correctedText,
          confidence: correction.confidence
        };
      }

      console.log('- Sử dụng text gốc');
      return {
        text: supplierText,
        confidence: potentialSuppliers[0].confidence
      };
    }

    console.log('❌ Không tìm thấy thông tin nhà cung cấp');
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
    console.log('\n🚀 Bắt đầu xử lý hóa đơn...');
    
    const textBlocks = await this.extractTextFromImage(imageBuffer);
    
    console.log('\n📊 Xử lý từng phần của hóa đơn...');
    const [supplier, date, total, items] = await Promise.all([
      this.findSupplier(textBlocks),
      this.findDate(textBlocks),
      this.findTotal(textBlocks),
      this.findItems(textBlocks)
    ]);

    console.log('\n📋 Kết quả xử lý:');
    console.log('- Nhà cung cấp:', supplier.text);
    console.log('- Ngày:', date.text);
    console.log('- Tổng tiền:', total.value);
    console.log('- Số mặt hàng:', items.length);

    const confidences = [
      supplier.confidence,
      date.confidence,
      total.confidence,
      ...items.map(item => item.confidence)
    ];
    const avgConfidence = confidences.reduce((sum, conf) => sum + conf, 0) / confidences.length;

    const needsReview = avgConfidence < OcrService.REVIEW_THRESHOLD || 
      confidences.some(conf => conf < OcrService.MIN_CONFIDENCE_SCORE);

    console.log('\n📊 Thống kê:');
    console.log('- Độ tin cậy trung bình:', (avgConfidence * 100).toFixed(1) + '%');
    console.log('- Cần review:', needsReview ? 'Có' : 'Không');

    const result = {
      supplier: supplier.text,
      date: date.text,
      total: total.value,
      items,
      confidence: avgConfidence,
      needsReview
    };

    console.log('\n✅ Hoàn thành xử lý hóa đơn');
    return result;
  }

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