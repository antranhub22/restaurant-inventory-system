import { createWorker } from 'tesseract.js';
import { PrismaClient } from '@prisma/client';
import vietnameseService from './vietnamese.service';

const prisma = new PrismaClient();

interface TextElement {
  text: string;
  confidence: number;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

interface DocumentStructure {
  elements: TextElement[];
  width: number;
  height: number;
}

export interface OcrResult {
  rawText: string;           // Toàn bộ text trích xuất được
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

class OcrService {
  private static readonly MIN_CONFIDENCE_SCORE = 0.5;
  private static readonly REVIEW_THRESHOLD = 0.9;

  private async extractTextFromImage(imageBuffer: Buffer): Promise<DocumentStructure> {
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

      // Nhận dạng text với thông tin vị trí
      console.log('🔍 Đang xử lý OCR...');
      const { data } = await worker.recognize(imageBuffer, {
        pageseg_mode: '1',
        preserve_interword_spaces: '1'
      });
      
      if (!data || !data.words) {
        console.error('❌ Không nhận được kết quả từ Tesseract');
        await worker.terminate();
        return { elements: [], width: 0, height: 0 };
      }

      // Trích xuất thông tin vị trí của từng từ
      const elements: TextElement[] = data.words.map(word => ({
        text: word.text,
        confidence: word.confidence / 100,
        position: {
          x: word.bbox.x0,
          y: word.bbox.y0,
          width: word.bbox.x1 - word.bbox.x0,
          height: word.bbox.y1 - word.bbox.y0
        }
      }));

      await worker.terminate();

      // Sắp xếp các element theo vị trí từ trên xuống, trái sang phải
      elements.sort((a, b) => {
        const yDiff = a.position.y - b.position.y;
        if (Math.abs(yDiff) < 10) { // Cùng một dòng
          return a.position.x - b.position.x;
        }
        return yDiff;
      });

      // Tính kích thước tổng thể của document
      const width = Math.max(...elements.map(e => e.position.x + e.position.width));
      const height = Math.max(...elements.map(e => e.position.y + e.position.height));

      console.log(`\n✨ Đã trích xuất được ${elements.length} phần tử văn bản`);
      
      return { elements, width, height };
    } catch (error: any) {
      console.error('❌ Lỗi trong quá trình xử lý OCR:', error);
      console.error('Chi tiết lỗi:', error.message || error);
      console.error('Stack trace:', error.stack);
      throw new Error(`Lỗi khi xử lý OCR: ${error.message || 'Unknown error'}`);
    }
  }

  private groupElementsByLine(elements: TextElement[]): TextElement[][] {
    const lines: TextElement[][] = [];
    let currentLine: TextElement[] = [];
    let lastY = -1;

    for (const element of elements) {
      if (lastY === -1 || Math.abs(element.position.y - lastY) < 10) {
        // Cùng dòng
        currentLine.push(element);
      } else {
        // Dòng mới
        if (currentLine.length > 0) {
          lines.push([...currentLine]);
        }
        currentLine = [element];
      }
      lastY = element.position.y;
    }

    if (currentLine.length > 0) {
      lines.push(currentLine);
    }

    return lines;
  }

  private async analyzeDocument(doc: DocumentStructure): Promise<OcrResult> {
    // Nhóm các element thành dòng
    const lines = this.groupElementsByLine(doc.elements);
    
    // Tính toán các vùng của document dựa vào khoảng cách
    const headerRegion = doc.height * 0.3;  // 30% đầu trang
    const footerRegion = doc.height * 0.8;  // 20% cuối trang

    // Phân loại các dòng theo vùng
    const headerLines = lines.filter(line => 
      line[0].position.y < headerRegion
    );
    const bodyLines = lines.filter(line => 
      line[0].position.y >= headerRegion && line[0].position.y < footerRegion
    );
    const footerLines = lines.filter(line => 
      line[0].position.y >= footerRegion
    );

    // Trích xuất thông tin từ header
    const supplier = this.extractSupplier(headerLines);
    const date = this.extractDate(headerLines);

    // Trích xuất thông tin từ body
    const items = this.extractItems(bodyLines);

    // Trích xuất thông tin từ footer
    const total = this.extractTotal(footerLines);

    // Tính độ tin cậy trung bình
    const confidences = doc.elements.map(e => e.confidence);
    const avgConfidence = confidences.reduce((sum, conf) => sum + conf, 0) / confidences.length;

    // Tạo raw text
    const rawText = lines.map(line => 
      line.map(element => element.text).join(' ')
    ).join('\n');

    return {
      rawText,
      supplier,
      date,
      total,
      items,
      confidence: avgConfidence,
      needsReview: avgConfidence < this.REVIEW_THRESHOLD
    };
  }

  private extractSupplier(headerLines: TextElement[][]): string {
    // Tìm dòng có chứa tên nhà cung cấp
    const supplierLine = headerLines.find(line => {
      const text = line.map(e => e.text).join(' ').toLowerCase();
      return text.includes('nhà hàng') || 
             text.includes('quán') || 
             text.includes('cửa hàng') ||
             text.includes('da thu tien');
    });

    return supplierLine ? 
      supplierLine.map(e => e.text).join(' ') : 
      (headerLines[0] ? headerLines[0].map(e => e.text).join(' ') : 'Không xác định');
  }

  private extractDate(headerLines: TextElement[][]): string {
    // Tìm dòng có định dạng ngày tháng
    for (const line of headerLines) {
      const text = line.map(e => e.text).join(' ');
      const match = text.match(/\d{1,2}\/\d{1,2}\/\d{4}/);
      if (match) return match[0];
    }
    return new Date().toLocaleDateString('vi-VN');
  }

  private extractItems(bodyLines: TextElement[][]): Array<{
    name: string;
    quantity: number;
    unit_price: number;
    total: number;
    confidence: number;
  }> {
    const items: Array<{
      name: string;
      quantity: number;
      unit_price: number;
      total: number;
      confidence: number;
    }> = [];

    for (const line of bodyLines) {
      const text = line.map(e => e.text).join(' ');
      const numbers = text.match(/\d+/g);
      
      if (numbers && numbers.length >= 2) {
        // Tách phần text không phải số để làm tên
        const name = text.replace(/\d+/g, '').trim();
        
        // Lấy các số cuối cùng làm giá và số lượng
        const lastNumbers = numbers.slice(-2);
        const quantity = parseInt(lastNumbers[0]);
        const price = parseInt(lastNumbers[1]);

        if (name && !isNaN(quantity) && !isNaN(price)) {
          items.push({
            name,
            quantity,
            unit_price: price,
            total: quantity * price,
            confidence: line.reduce((sum, e) => sum + e.confidence, 0) / line.length
          });
        }
      }
    }

    return items;
  }

  private extractTotal(footerLines: TextElement[][]): number {
    // Tìm dòng có chứa tổng tiền
    for (const line of footerLines.reverse()) { // Duyệt từ dưới lên
      const text = line.map(e => e.text).join(' ').toLowerCase();
      if (text.includes('tổng') || text.includes('total') || text.includes('sum')) {
        const numbers = text.match(/\d+/g);
        if (numbers) {
          return parseInt(numbers[numbers.length - 1]);
        }
      }
    }
    return 0;
  }

  public async processReceipt(imageBuffer: Buffer): Promise<OcrResult> {
    const document = await this.extractTextFromImage(imageBuffer);
    return this.analyzeDocument(document);
  }
}

export default new OcrService(); 