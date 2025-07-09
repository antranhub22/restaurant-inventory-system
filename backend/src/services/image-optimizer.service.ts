import sharp from 'sharp';
import logger from './logger.service';

interface ImageOptimizationResult {
  optimizedBuffer: Buffer;
  metadata: {
    originalSize: number;
    optimizedSize: number;
    width: number;
    height: number;
    format: string;
    compressionRatio: number;
  };
}

class ImageOptimizerService {
  private readonly MAX_WIDTH = 2048;
  private readonly MAX_HEIGHT = 2048;
  private readonly QUALITY = 90;
  private readonly MIN_DPI = 300;

  /**
   * Tối ưu hóa ảnh cho OCR processing
   */
  public async optimizeForOCR(imageBuffer: Buffer): Promise<ImageOptimizationResult> {
    const startTime = Date.now();
    
    try {
      logger.info('🖼️ Bắt đầu tối ưu hóa ảnh cho OCR...');
      
      // Lấy metadata của ảnh gốc
      const originalMetadata = await sharp(imageBuffer).metadata();
      const originalSize = imageBuffer.length;
      
      logger.info(`📊 Metadata ảnh gốc:`, {
        width: originalMetadata.width,
        height: originalMetadata.height,
        format: originalMetadata.format,
        size: `${(originalSize / 1024).toFixed(1)}KB`
      });

      // Tối ưu hóa ảnh cho OCR
      const optimizedBuffer = await this.performOptimization(imageBuffer, originalMetadata);
      const optimizedSize = optimizedBuffer.length;
      
      const processingTime = Date.now() - startTime;
      const compressionRatio = ((originalSize - optimizedSize) / originalSize * 100);
      
      logger.info(`✅ Tối ưu hóa hoàn thành trong ${processingTime}ms`);
      logger.info(`📊 Kết quả tối ưu:`, {
        originalSize: `${(originalSize / 1024).toFixed(1)}KB`,
        optimizedSize: `${(optimizedSize / 1024).toFixed(1)}KB`,
        compressionRatio: `${compressionRatio.toFixed(1)}%`
      });

      return {
        optimizedBuffer,
        metadata: {
          originalSize,
          optimizedSize,
          width: originalMetadata.width || 0,
          height: originalMetadata.height || 0,
          format: originalMetadata.format || 'unknown',
          compressionRatio
        }
      };
    } catch (error: any) {
      logger.error('❌ Lỗi tối ưu hóa ảnh:', error);
      // Trả về ảnh gốc nếu tối ưu hóa thất bại
      return {
        optimizedBuffer: imageBuffer,
        metadata: {
          originalSize: imageBuffer.length,
          optimizedSize: imageBuffer.length,
          width: 0,
          height: 0,
          format: 'unknown',
          compressionRatio: 0
        }
      };
    }
  }

  /**
   * Thực hiện tối ưu hóa ảnh
   */
  private async performOptimization(imageBuffer: Buffer, metadata: sharp.Metadata): Promise<Buffer> {
    let pipeline = sharp(imageBuffer);

    // 1. Chuyển đổi sang RGB nếu cần - loại bỏ vì Sharp tự động xử lý color space
    // Không cần explicit RGB conversion

    // 2. Tăng độ tương phản và độ sắc nét cho OCR
    pipeline = pipeline
      .modulate({
        brightness: 1.1,    // Tăng độ sáng nhẹ
        saturation: 0.8     // Giảm độ bão hòa để tập trung vào text
      })
      .sharpen(1.5, 1.0, 2.0); // sigma, flat, jagged

    // 3. Resize nếu ảnh quá lớn
    if (metadata.width && metadata.height) {
      const { width, height } = this.calculateOptimalSize(metadata.width, metadata.height);
      if (width !== metadata.width || height !== metadata.height) {
        pipeline = pipeline.resize(width, height, {
          kernel: sharp.kernel.lanczos3, // Thuật toán resize chất lượng cao
          fit: 'inside',                  // Giữ tỷ lệ khung hình
          withoutEnlargement: true        // Không phóng to
        });
      }
    }

    // 4. Tối ưu hóa cho OCR
    pipeline = pipeline
      .png({ 
        compressionLevel: 6,  // Nén vừa phải
        adaptiveFiltering: true
      })
      .removeAlpha()  // Loại bỏ alpha channel
      .flatten({ background: { r: 255, g: 255, b: 255 } }); // Nền trắng

    return await pipeline.toBuffer();
  }

  /**
   * Tính toán kích thước tối ưu
   */
  private calculateOptimalSize(width: number, height: number): { width: number; height: number } {
    // Giữ tỷ lệ khung hình
    const aspectRatio = width / height;
    
    if (width > this.MAX_WIDTH || height > this.MAX_HEIGHT) {
      if (aspectRatio > 1) {
        // Ảnh ngang
        return {
          width: this.MAX_WIDTH,
          height: Math.round(this.MAX_WIDTH / aspectRatio)
        };
      } else {
        // Ảnh dọc
        return {
          width: Math.round(this.MAX_HEIGHT * aspectRatio),
          height: this.MAX_HEIGHT
        };
      }
    }
    
    return { width, height };
  }

  /**
   * Kiểm tra chất lượng ảnh cho OCR
   */
  public async validateImageQuality(imageBuffer: Buffer): Promise<{
    isSuitable: boolean;
    issues: string[];
    recommendations: string[];
  }> {
    const issues: string[] = [];
    const recommendations: string[] = [];

    try {
      const metadata = await sharp(imageBuffer).metadata();
      
      // Kiểm tra kích thước
      if (metadata.width && metadata.width < 800) {
        issues.push('Ảnh có độ phân giải thấp');
        recommendations.push('Chụp ảnh với độ phân giải cao hơn (tối thiểu 800px)');
      }

      if (metadata.height && metadata.height < 600) {
        issues.push('Ảnh có chiều cao thấp');
        recommendations.push('Chụp ảnh với chiều cao tối thiểu 600px');
      }

      // Kiểm tra format
      if (metadata.format && !['jpeg', 'jpg', 'png', 'webp'].includes(metadata.format)) {
        issues.push('Định dạng ảnh không được hỗ trợ');
        recommendations.push('Sử dụng định dạng JPEG, PNG hoặc WebP');
      }

      // Kiểm tra kích thước file
      const fileSizeKB = imageBuffer.length / 1024;
      if (fileSizeKB > 10240) { // 10MB
        issues.push('File ảnh quá lớn');
        recommendations.push('Nén ảnh trước khi upload');
      }

      if (fileSizeKB < 10) { // 10KB
        issues.push('File ảnh quá nhỏ, có thể bị nén quá mức');
        recommendations.push('Sử dụng ảnh chất lượng cao hơn');
      }

      return {
        isSuitable: issues.length === 0,
        issues,
        recommendations
      };
    } catch (error) {
      return {
        isSuitable: false,
        issues: ['Không thể đọc metadata ảnh'],
        recommendations: ['Kiểm tra lại file ảnh']
      };
    }
  }

  /**
   * Tạo thumbnail cho preview
   */
  public async createThumbnail(imageBuffer: Buffer, maxWidth: number = 300): Promise<Buffer> {
    try {
      const metadata = await sharp(imageBuffer).metadata();
      
      if (!metadata.width || !metadata.height) {
        throw new Error('Không thể đọc kích thước ảnh');
      }

      const aspectRatio = metadata.width / metadata.height;
      const thumbnailHeight = Math.round(maxWidth / aspectRatio);

      return await sharp(imageBuffer)
        .resize(maxWidth, thumbnailHeight, {
          kernel: sharp.kernel.lanczos3,
          fit: 'inside',
          withoutEnlargement: true
        })
        .jpeg({ quality: 80 })
        .toBuffer();
    } catch (error: any) {
      logger.error('❌ Lỗi tạo thumbnail:', error);
      throw error;
    }
  }
}

export default new ImageOptimizerService();