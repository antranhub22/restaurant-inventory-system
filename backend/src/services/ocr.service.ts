import { createWorker } from 'tesseract.js';

export interface OcrResult {
  rawText: string;           // Toàn bộ text trích xuất được
  confidence: number;        // Độ tin cậy trung bình
  wordCount: number;         // Số từ đã trích xuất
  processingTime: number;    // Thời gian xử lý (ms)
}

class OcrService {
  private async extractTextFromImage(imageBuffer: Buffer): Promise<{
    text: string;
    confidence: number;
  }> {
    const startTime = Date.now();
    
    try {
      console.log('🔍 Bắt đầu xử lý OCR với Tesseract...');
      console.log('📊 Kích thước ảnh:', imageBuffer.length, 'bytes');

      // Khởi tạo worker với Tesseract.js
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
      
      await worker.terminate();

      const processingTime = Date.now() - startTime;

      console.log(`\n✨ Hoàn thành OCR:`);
      console.log(`- Text trích xuất: ${data.text.substring(0, 100)}...`);
      console.log(`- Độ tin cậy: ${data.confidence}%`);
      console.log(`- Thời gian xử lý: ${processingTime}ms`);
      
      return {
        text: data.text,
        confidence: data.confidence / 100
      };
    } catch (error: any) {
      console.error('❌ Lỗi trong quá trình xử lý OCR:', error);
      throw new Error(`Lỗi khi xử lý OCR: ${error.message || 'Unknown error'}`);
    }
  }

  public async processReceipt(imageBuffer: Buffer): Promise<OcrResult> {
    const startTime = Date.now();
    const { text, confidence } = await this.extractTextFromImage(imageBuffer);
    
    // Đếm số từ
    const wordCount = text.trim().split(/\s+/).filter(word => word.length > 0).length;
    
    return {
      rawText: text,
      confidence,
      wordCount,
      processingTime: Date.now() - startTime
    };
  }
}

export default new OcrService(); 