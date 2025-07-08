import { createWorker } from 'tesseract.js';
import { PrismaClient } from '@prisma/client';
import vietnameseService from './vietnamese.service';
import ocrLearningService from './ocr.learning.service';

const prisma = new PrismaClient();

interface ReceiptSection {
  header: TextBlock[];    // Thông tin nhà cung cấp, ngày
  items: TextBlock[];     // Danh sách sản phẩm
  summary: TextBlock[];   // Tổng tiền, thuế, etc.
}

interface ReceiptItem {
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
  confidence: number;
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
  private static readonly MIN_CONFIDENCE_SCORE = 0.5; // Giảm threshold để test
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
      const avgConfidence = data.confidence || 85;
      
      lines.forEach((line: string, index: number) => {
        const trimmedLine = line.trim();
        if (trimmedLine) {
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
      
      const filteredBlocks = textBlocks.filter(block => 
        block.confidence >= OcrService.MIN_CONFIDENCE_SCORE
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
      
      throw new Error(`Lỗi khi xử lý OCR: ${error.message || 'Unknown error'}`);
    }
  }

  private analyzeStructure(blocks: TextBlock[]): ReceiptSection {
    // Sắp xếp blocks theo vị trí từ trên xuống
    const sortedBlocks = [...blocks].sort((a, b) => a.boundingBox.top - b.boundingBox.top);
    
    // Phân tích cấu trúc hóa đơn
    const header: TextBlock[] = [];
    const items: TextBlock[] = [];
    const summary: TextBlock[] = [];

    let currentSection = 'header';
    
    for (const block of sortedBlocks) {
      // Chuyển sang phần items nếu tìm thấy dòng sản phẩm đầu tiên
      if (currentSection === 'header' && this.isItemLine(block.text)) {
        currentSection = 'items';
      }
      // Chuyển sang phần summary nếu tìm thấy từ khóa tổng tiền
      else if (currentSection === 'items' && this.isSummaryLine(block.text)) {
        currentSection = 'summary';
      }

      // Thêm block vào section tương ứng
      switch (currentSection) {
        case 'header':
          header.push(block);
          break;
        case 'items':
          items.push(block);
          break;
        case 'summary':
          summary.push(block);
          break;
      }
    }

    return { header, items, summary };
  }

  private isItemLine(text: string): boolean {
    // Kiểm tra xem dòng có phải là sản phẩm không
    const itemPatterns = [
      /^\d+\s*x\s*\d+/,  // "2 x 50000"
      /\d+\s*(?:cái|kg|g|ml|l)\s*x\s*\d+/i,  // "2 kg x 50000"
      /^[\p{L}\s]+\s+\d+\s*x\s*\d+/u,  // "Gà ta 2 x 50000"
      /^[\p{L}\s]+\s+\d+\s*(?:cái|kg|g|ml|l)\s*x\s*\d+/iu  // "Gà ta 2 kg x 50000"
    ];

    return itemPatterns.some(pattern => pattern.test(text));
  }

  private isSummaryLine(text: string): boolean {
    // Kiểm tra xem dòng có phải là tổng tiền không
    const summaryPatterns = [
      /tổng\s*(?:tiền|cộng)/i,
      /thành\s*tiền/i,
      /total/i,
      /sum/i
    ];

    return summaryPatterns.some(pattern => pattern.test(text));
  }

  private extractItem(text: string): ReceiptItem | null {
    try {
      // Các pattern để trích xuất thông tin sản phẩm
      const patterns = [
        // "Gà ta 2 x 50000"
        /^([\p{L}\s]+)\s+(\d+)\s*x\s*(\d+)/u,
        // "2 x 50000 Gà ta"
        /^(\d+)\s*x\s*(\d+)\s+([\p{L}\s]+)/u,
        // "Gà ta 2kg x 50000"
        /^([\p{L}\s]+)\s+(\d+)\s*(?:cái|kg|g|ml|l)\s*x\s*(\d+)/iu
      ];

      for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match) {
          const [_, nameOrQuantity1, quantityOrPrice, priceOrName] = match;
          
          // Xác định đúng thứ tự các thành phần
          let name: string, quantity: number, price: number;
          
          if (/^\d+$/.test(nameOrQuantity1)) {
            // Trường hợp "2 x 50000 Gà ta"
            name = priceOrName;
            quantity = parseInt(nameOrQuantity1);
            price = parseInt(quantityOrPrice);
          } else {
            // Trường hợp "Gà ta 2 x 50000"
            name = nameOrQuantity1;
            quantity = parseInt(quantityOrPrice);
            price = parseInt(priceOrName);
          }

          return {
            name: name.trim(),
            quantity,
            unitPrice: price,
            total: quantity * price,
            confidence: this.calculateItemConfidence(text)
          };
        }
      }
    } catch (error) {
      console.error('Lỗi khi trích xuất thông tin sản phẩm:', error);
    }

    return null;
  }

  private calculateItemConfidence(text: string): number {
    // Tính độ tin cậy cho sản phẩm dựa trên format
    let confidence = 0.5; // Điểm cơ bản

    // Cộng điểm nếu có các thành phần chuẩn
    if (/^[\p{L}\s]+/.test(text)) confidence += 0.1; // Có tên sản phẩm
    if (/\d+\s*x\s*\d+/.test(text)) confidence += 0.2; // Có format số lượng x đơn giá
    if (/(?:cái|kg|g|ml|l)/.test(text)) confidence += 0.1; // Có đơn vị tính
    if (/\d{4,}/.test(text)) confidence += 0.1; // Có giá tiền (ít nhất 4 chữ số)

    return Math.min(1, confidence);
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

  public async processReceipt(imageBuffer: Buffer): Promise<OcrResult> {
    // Nhận dạng text từ ảnh
    const blocks = await this.extractTextFromImage(imageBuffer);
    
    // Phân tích cấu trúc hóa đơn
    const { header, items, summary } = this.analyzeStructure(blocks);
    
    // Trích xuất thông tin nhà cung cấp từ header
    const supplier = header.length > 0 ? header[0].text : 'Không xác định';
    
    // Trích xuất ngày tháng từ header
    const dateMatch = header.find(block => /\d{1,2}\/\d{1,2}\/\d{4}/.test(block.text));
    const date = dateMatch ? dateMatch.text.match(/\d{1,2}\/\d{1,2}\/\d{4}/)![0] : new Date().toLocaleDateString('vi-VN');
    
    // Trích xuất danh sách sản phẩm
    const extractedItems: ReceiptItem[] = [];
    for (const block of items) {
      const item = this.extractItem(block.text);
      if (item) {
        extractedItems.push(item);
      }
    }
    
    // Trích xuất tổng tiền từ summary
    let total = 0;
    const totalLine = summary.find(block => this.isSummaryLine(block.text));
    if (totalLine) {
      const numbers = totalLine.text.match(/\d+/g);
      if (numbers) {
        total = parseInt(numbers[numbers.length - 1]);
      }
    } else if (extractedItems.length > 0) {
      // Tính tổng từ các sản phẩm nếu không tìm thấy dòng tổng
      total = extractedItems.reduce((sum, item) => sum + item.total, 0);
    }
    
    // Tính độ tin cậy trung bình
    const confidences = [
      header[0]?.confidence || 0,
      ...extractedItems.map(item => item.confidence),
      summary[0]?.confidence || 0
    ];
    const avgConfidence = confidences.reduce((sum, conf) => sum + conf, 0) / confidences.length;
    
    // Kiểm tra xem có cần review không
    const needsReview = avgConfidence < OcrService.REVIEW_THRESHOLD || 
      extractedItems.length === 0 || 
      !total;

    return {
      supplier,
      date,
      total,
      items: extractedItems.map(item => ({
        name: item.name,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        total: item.total,
        confidence: item.confidence
      })),
      confidence: avgConfidence,
      needsReview
    };
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