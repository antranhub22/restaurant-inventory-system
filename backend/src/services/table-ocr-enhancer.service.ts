import sharp from 'sharp';
import logger from './logger.service';

interface TableDetectionResult {
  enhancedImage: Buffer;
  metadata: {
    tableDetected: boolean;
    lineCount: number;
    columnCount: number;
    confidence: number;
  };
}

interface PreprocessingOptions {
  enhanceTable: boolean;
  increaseDPI: boolean;
  removeNoise: boolean;
  straightenLines: boolean;
}

class TableOCREnhancerService {
  
  /**
   * Enhance ảnh đặc biệt cho table recognition
   */
  public async enhanceForTable(
    imageBuffer: Buffer, 
    options: PreprocessingOptions = {
      enhanceTable: true,
      increaseDPI: true,
      removeNoise: true,
      straightenLines: true
    }
  ): Promise<TableDetectionResult> {
    try {
      logger.info('🔧 Bắt đầu enhance ảnh cho table detection...');
      const startTime = Date.now();
      
      let processed = sharp(imageBuffer);
      
      // 1. Tăng DPI và độ phân giải
      if (options.increaseDPI) {
        processed = processed
          .resize(null, null, {
            kernel: sharp.kernel.lanczos3,
            withoutEnlargement: false
          })
          .png({ quality: 100, compressionLevel: 0 });
      }
      
      // 2. Chuyển đổi thành grayscale và tăng contrast cho table lines
      if (options.enhanceTable) {
                 processed = processed
           .grayscale()
           .modulate({
             brightness: 1.2,     // Tăng độ sáng
             saturation: 0        // Loại bỏ màu
           })
           .normalize()           // Tăng contrast
           .sharpen(2.0, 1.5, 3.0); // sigma, flat, jagged
      }
      
      // 3. Noise reduction cho text rõ ràng hơn
      if (options.removeNoise) {
        processed = processed
          .median(2)             // Remove small noise
          .blur(0.3);            // Slight blur để smooth text
      }
      
      // 4. Normalize về black/white cho OCR tốt nhất
      processed = processed
        .threshold(128)          // Binary threshold
        .flatten({ background: { r: 255, g: 255, b: 255 } });
      
      const enhancedBuffer = await processed.png().toBuffer();
      const processingTime = Date.now() - startTime;
      
      // 5. Phân tích table structure (mock detection)
      const tableMetadata = await this.analyzeTableStructure(enhancedBuffer);
      
      logger.info(`✅ Table enhancement hoàn thành trong ${processingTime}ms`);
      logger.info(`📊 Table detection: ${tableMetadata.tableDetected ? 'Có' : 'Không'} - ${tableMetadata.lineCount} lines, ${tableMetadata.columnCount} columns`);
      
      return {
        enhancedImage: enhancedBuffer,
        metadata: tableMetadata
      };
      
    } catch (error) {
      logger.error('❌ Lỗi table enhancement:', error);
      // Fallback trả về ảnh gốc
      return {
        enhancedImage: imageBuffer,
        metadata: {
          tableDetected: false,
          lineCount: 0,
          columnCount: 0,
          confidence: 0
        }
      };
    }
  }
  
  /**
   * Phân tích cấu trúc table (simplified detection)
   */
  private async analyzeTableStructure(imageBuffer: Buffer): Promise<{
    tableDetected: boolean;
    lineCount: number;
    columnCount: number;
    confidence: number;
  }> {
    try {
      const metadata = await sharp(imageBuffer).metadata();
      
      // Mock table detection dựa trên kích thước và aspect ratio
      const width = metadata.width || 0;
      const height = metadata.height || 0;
      const aspectRatio = width / height;
      
      // Heuristics cho phiếu nhập kho (thường dạng portrait với table)
      const tableDetected = aspectRatio > 0.6 && aspectRatio < 1.5 && height > 600;
      const estimatedLines = Math.min(Math.floor(height / 40), 20); // Ước tính số dòng
      const estimatedColumns = Math.min(Math.floor(width / 80), 8);  // Ước tính số cột
      
      return {
        tableDetected,
        lineCount: estimatedLines,
        columnCount: estimatedColumns,
        confidence: tableDetected ? 0.8 : 0.3
      };
      
    } catch (error) {
      logger.error('❌ Lỗi table analysis:', error);
      return {
        tableDetected: false,
        lineCount: 0,
        columnCount: 0,
        confidence: 0
      };
    }
  }
  
  /**
   * Tối ưu Tesseract parameters dựa trên table structure
   */
  public getTableOptimizedTesseractConfig(tableMetadata: any): Record<string, string> {
    const baseConfig = {
      tessedit_char_whitelist: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyzÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚÝàáâãèéêìíòóôõùúýĂăĐđĨĩŨũƠơƯưẠ-ỹ .,():/-×=',
      numeric_punctuation: '.,',
      preserve_interword_spaces: '1',
      textord_heavy_nr: '1'
    };
    
    if (tableMetadata.tableDetected && tableMetadata.lineCount > 5) {
      // Cấu hình cho table nhiều dòng
      return {
        ...baseConfig,
        tessedit_pageseg_mode: '6', // Uniform block - tốt cho table
        tessedit_ocr_engine_mode: '1',
        tessedit_enable_dict_correction: '1',
        tessedit_enable_bigram_correction: '1',
        load_freq_dawg: '1',
        load_punc_dawg: '1',
        textord_really_old_xheight: '1',
        classify_enable_learning: '1'
      };
    } else {
      // Cấu hình cho text đơn giản
      return {
        ...baseConfig,
        tessedit_pageseg_mode: '3', // Fully automatic - linh hoạt hơn
        tessedit_ocr_engine_mode: '1'
      };
    }
  }
  
  /**
   * Post-process OCR result để cải thiện table parsing
   */
  public enhanceTableOCRResult(rawText: string, tableMetadata: any): {
    enhancedText: string;
    structuredData: Array<{
      lineNumber: number;
      columns: string[];
      confidence: number;
    }>;
    improvements: string[];
  } {
    const improvements: string[] = [];
    const lines = rawText.split('\n').map(line => line.trim()).filter(Boolean);
    const structuredData: Array<{ lineNumber: number; columns: string[]; confidence: number }> = [];
    
    // 1. Cải thiện format cho Vietnamese text
    let enhancedText = rawText
      .replace(/([a-zA-Z])([0-9])/g, '$1 $2')  // Tách chữ số
      .replace(/([0-9])([a-zA-Z])/g, '$1 $2')  // Tách số chữ  
      .replace(/([đ₫])([a-zA-Z])/g, '$1 $2')   // Tách currency
      .replace(/\s+/g, ' ');                    // Normalize spaces
    
    // 2. Parse table structure nếu detect được table
    if (tableMetadata.tableDetected) {
      lines.forEach((line, index) => {
        // Tách columns dựa trên spaces hoặc tab
        const columns = line.split(/\s{2,}|\t+/).filter(col => col.trim());
        
        if (columns.length >= 2) {
          structuredData.push({
            lineNumber: index + 1,
            columns: columns.map(col => col.trim()),
            confidence: columns.length >= 4 ? 0.8 : 0.6
          });
          improvements.push(`Line ${index + 1}: Detected ${columns.length} columns`);
        }
      });
    }
    
    // 3. Vietnamese text corrections
    const vietnameseCorrections = [
      ['Nam bo', 'Nam bò'],
      ['Ca chua', 'Cà chua'], 
      ['Ngo ngot', 'Ngô ngọt'],
      ['Rau muong', 'Rau muống'],
      ['Cai ngot', 'Cải ngọt'],
      ['Hanh la', 'Hành lá'],
      ['Gia do', 'Giá đỗ'],
      ['La lot', 'Lá lót'],
      ['Ca rot', 'Cà rốt']
    ];
    
    vietnameseCorrections.forEach(([wrong, correct]) => {
      if (enhancedText.includes(wrong)) {
        enhancedText = enhancedText.replace(new RegExp(wrong, 'gi'), correct);
        improvements.push(`Corrected: ${wrong} → ${correct}`);
      }
    });
    
    return {
      enhancedText,
      structuredData,
      improvements
    };
  }
}

export default new TableOCREnhancerService(); 