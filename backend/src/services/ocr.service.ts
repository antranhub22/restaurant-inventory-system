import { createWorker } from 'tesseract.js';
import { OcrResult, ExtractedContent } from '../types/ocr';

class OcrService {
  private async extractTextFromImage(imageBuffer: Buffer): Promise<{
    text: string;
    confidence: number;
    contents: ExtractedContent[];
  }> {
    const startTime = Date.now();
    
    try {
      console.log('🔍 Bắt đầu xử lý OCR với Tesseract...');
      console.log('📊 Kích thước ảnh:', imageBuffer.length, 'bytes');

      // Khởi tạo worker với Tesseract.js
      console.log('📚 Đang khởi tạo Tesseract worker...');
      const worker = await createWorker('vie+eng');

      // Nhận dạng text
      console.log('🔍 Đang xử lý OCR...');
      const result = await worker.recognize(imageBuffer);
      
      await worker.terminate();

      // Phân tích kết quả thành các content có cấu trúc
      const contents: ExtractedContent[] = [];
      
      // Get text blocks from the result
      if (result.data.text) {
        // Split text into blocks by newlines and spaces
        const blocks = result.data.text.split(/[\n\s]+/).filter(Boolean);
        
        blocks.forEach((text, index) => {
          contents.push({
            text: text.trim(),
            type: this.detectContentType(text),
            confidence: result.data.confidence / 100,
            position: {
              top: index * 20, // Approximate positioning
              left: 0,
              width: text.length * 10, // Approximate width based on text length
              height: 20 // Fixed height
            }
          });
        });
      }

      const processingTime = Date.now() - startTime;

      console.log(`\n✨ Hoàn thành OCR:`);
      console.log(`- Text trích xuất: ${result.data.text.substring(0, 100)}...`);
      console.log(`- Độ tin cậy: ${result.data.confidence}%`);
      console.log(`- Thời gian xử lý: ${processingTime}ms`);
      
      return {
        text: result.data.text,
        confidence: result.data.confidence / 100,
        contents
      };
    } catch (error: any) {
      console.error('❌ Lỗi trong quá trình xử lý OCR:', error);
      throw new Error(`Lỗi khi xử lý OCR: ${error.message || 'Unknown error'}`);
    }
  }

  private detectContentType(text: string): string {
    // Kiểm tra nếu là số
    if (/^\d+([,.]\d+)?$/.test(text)) {
      return 'number';
    }

    // Kiểm tra nếu là tiền tệ
    if (/^\d+([,.]\d+)?\s*(đ|vnd|vnđ|₫)$/i.test(text)) {
      return 'currency';
    }

    // Kiểm tra nếu là ngày tháng
    if (/^\d{1,2}[-/]\d{1,2}[-/]\d{2,4}$/.test(text)) {
      return 'date';
    }

    // Mặc định là text
    return 'text';
  }

  public async processReceipt(imageBuffer: Buffer): Promise<OcrResult> {
    const startTime = Date.now();
    const { text, confidence, contents } = await this.extractTextFromImage(imageBuffer);
    
    return {
      rawText: text,
      confidence,
      contents,
      processingTime: Date.now() - startTime
    };
  }
}

export default new OcrService(); 