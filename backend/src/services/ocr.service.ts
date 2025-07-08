import { createWorker } from 'tesseract.js';
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
      console.log('🔍 Bắt đầu xử lý OCR với Tesseract...');
      console.log('📊 Kích thước ảnh:', imageBuffer.length, 'bytes');

      // Khởi tạo worker với Tesseract.js v6
      console.log('📚 Đang khởi tạo Tesseract worker...');
      const worker = await createWorker('vie+eng', 1, {
        logger: (m: any) => {
          if (m.status) {
            console.log(`Tesseract: ${m.status}${m.progress ? ` (${Math.round(m.progress * 100)}%)` : ''}`);
          }
        }
      });

      // Nhận dạng text
      console.log('🔍 Đang xử lý OCR...');
      const { data } = await worker.recognize(imageBuffer);
      
      if (!data || !data.text) {
        console.error('❌ Không nhận được kết quả từ Tesseract');
        await worker.terminate();
        return [];
      }

      console.log('📝 Text nhận dạng được:', data.text.substring(0, 200) + '...');
      
      const textBlocks: TextBlock[] = [];
      
      // Xử lý từng dòng text
      const lines = data.text.split('\n');
      const avgConfidence = data.confidence || 85; // Default confidence nếu không có
      
      lines.forEach((line: string, index: number) => {
        const trimmedLine = line.trim();
        if (trimmedLine) {
          // Tính confidence cho từng dòng dựa vào độ dài và các ký tự đặc biệt
          const lineConfidence = this.calculateLineConfidence(trimmedLine, avgConfidence);
          
          textBlocks.push({
            text: trimmedLine,
            confidence: lineConfidence,
            boundingBox: {
              left: 0,
              top: index * 20,
              right: 1000,
              bottom: (index + 1) * 20
            }
          });
        }
      });

      await worker.terminate();
      
      // Giảm threshold để test
      const filteredBlocks = textBlocks.filter(block => 
        block.confidence >= 0.5 // Giảm từ 0.8 xuống 0.5 để test
      );
      
      console.log(`\n✨ Kết quả OCR: ${filteredBlocks.length} dòng text`);
      filteredBlocks.slice(0, 5).forEach(block => {
        console.log(`- "${block.text}" (${(block.confidence * 100).toFixed(1)}%)`);
      });
      
      return filteredBlocks;
    } catch (error: any) {
      console.error('❌ Lỗi trong quá trình xử lý OCR:', error);
      console.error('Chi tiết lỗi:', error.message || error);
      console.error('Stack trace:', error.stack);
      
      // Fallback với mock data để test
      if (process.env.NODE_ENV === 'development') {
        console.log('⚠️ Sử dụng mock data để test...');
        return [
          {
            text: 'CỬA HÀNG THỰC PHẨM ABC',
            confidence: 0.9,
            boundingBox: { left: 0, top: 0, right: 300, bottom: 50 }
          },
          {
            text: '15/07/2025',
            confidence: 0.95,
            boundingBox: { left: 0, top: 60, right: 150, bottom: 80 }
          },
          {
            text: 'Gà ta 2 x 280000',
            confidence: 0.85,
            boundingBox: { left: 0, top: 100, right: 200, bottom: 120 }
          },
          {
            text: 'Tổng tiền: 560000',
            confidence: 0.9,
            boundingBox: { left: 0, top: 200, right: 200, bottom: 220 }
          }
        ];
      }
      
      throw new Error(`Lỗi khi xử lý OCR: ${error.message || 'Unknown error'}`);
    }
  }

  private calculateLineConfidence(text: string, baseConfidence: number): number {
    // Các pattern để kiểm tra tính hợp lệ của dòng
    const patterns = {
      date: /\d{1,2}\/\d{1,2}\/\d{4}/,
      money: /\d+(\.\d{3})*(\s*(VND|đ|₫|vnd))?/i,
      quantity: /x\s*\d+|\d+\s*x/i,
      supplier: /(cty|công\s*ty|cửa\s*hàng|ch|siêu\s*thị|st)/i
    };

    let patternMatches = 0;
    for (const pattern of Object.values(patterns)) {
      if (pattern.test(text)) {
        patternMatches++;
      }
    }

    // Tăng confidence nếu dòng chứa các pattern mong muốn
    const patternBonus = patternMatches * 0.1;
    
    // Giảm confidence nếu dòng quá ngắn hoặc chứa nhiều ký tự đặc biệt
    const lengthPenalty = text.length < 5 ? 0.2 : 0;
    const specialCharPenalty = (text.match(/[^a-zA-Z0-9\s\u00C0-\u1EF9]/g) || []).length * 0.05;

    let confidence = baseConfidence / 100 + patternBonus - lengthPenalty - specialCharPenalty;
    
    // Giới hạn confidence trong khoảng [0, 1]
    return Math.max(0, Math.min(1, confidence));
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