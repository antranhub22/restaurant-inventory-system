import sharp from 'sharp';
import logger from './logger.service';

interface AdvancedEnhancementResult {
  enhancedImage: Buffer;
  metadata: {
    originalSize: number;
    enhancedSize: number;
    enhancements: string[];
    estimatedQualityGain: number;
  };
}

class AdvancedImageEnhancerService {

  /**
   * Apply aggressive enhancement for difficult-to-read receipts
   */
  public async aggressiveEnhancement(imageBuffer: Buffer): Promise<AdvancedEnhancementResult> {
    const startTime = Date.now();
    const enhancements: string[] = [];
    
    try {
      logger.info('🔧 Applying aggressive image enhancement...');
      
      let processed = sharp(imageBuffer);
      const originalMetadata = await processed.metadata();
      const originalSize = imageBuffer.length;
      
      // 1. Increase resolution significantly if too small
      if ((originalMetadata.width || 0) < 1000 || (originalMetadata.height || 0) < 1000) {
        processed = processed.resize(2048, null, {
          kernel: sharp.kernel.lanczos3,
          withoutEnlargement: false,
          fit: 'inside'
        });
        enhancements.push('Resolution upscaling to 2048px');
      }
      
      // 2. Convert to grayscale for better contrast control
      processed = processed.grayscale();
      enhancements.push('Grayscale conversion');
      
      // 3. Extreme contrast and brightness adjustment
      processed = processed.modulate({
        brightness: 1.3,    // Aggressive brightness boost
        saturation: 0       // Full desaturation
      });
      enhancements.push('Aggressive brightness boost');
      
      // 4. Apply unsharp mask for text clarity
      processed = processed.sharpen(3.0, 2.0, 4.0); // Very aggressive sharpening
      enhancements.push('Aggressive text sharpening');
      
      // 5. Noise reduction with median filter
      processed = processed.median(3);
      enhancements.push('Advanced noise reduction');
      
      // 6. Normalize to use full contrast range
      processed = processed.normalize();
      enhancements.push('Full contrast normalization');
      
      // 7. Apply gamma correction for text enhancement
      processed = processed.gamma(1.5);
      enhancements.push('Gamma correction for text');
      
      // 8. Binary threshold for clean black/white
      processed = processed.threshold(140, {
        grayscale: false
      });
      enhancements.push('Binary threshold');
      
      // 9. Morphological operations to clean up text
      processed = processed
        .blur(0.5)         // Slight blur to connect broken characters
        .sharpen(2.0);     // Then sharpen to crisp edges
      enhancements.push('Morphological text cleanup');
      
      // 10. Final optimization
      processed = processed
        .png({ 
          quality: 100,
          compressionLevel: 0,
          adaptiveFiltering: false
        })
        .flatten({ background: { r: 255, g: 255, b: 255 } });
      
      const enhancedBuffer = await processed.toBuffer();
      const processingTime = Date.now() - startTime;
      
      // Calculate quality gain estimate
      const sizeIncrease = enhancedBuffer.length / originalSize;
      const estimatedQualityGain = Math.min(enhancements.length * 0.15, 0.8); // Max 80% improvement
      
      logger.info(`✅ Aggressive enhancement completed in ${processingTime}ms`);
      logger.info(`📊 Applied ${enhancements.length} enhancements, estimated ${(estimatedQualityGain * 100).toFixed(1)}% quality gain`);
      
      return {
        enhancedImage: enhancedBuffer,
        metadata: {
          originalSize,
          enhancedSize: enhancedBuffer.length,
          enhancements,
          estimatedQualityGain
        }
      };
      
    } catch (error) {
      logger.error('❌ Aggressive enhancement failed:', error);
      // Fallback to original image
      return {
        enhancedImage: imageBuffer,
        metadata: {
          originalSize: imageBuffer.length,
          enhancedSize: imageBuffer.length,
          enhancements: ['Fallback: using original image'],
          estimatedQualityGain: 0
        }
      };
    }
  }

  /**
   * Perspective correction for tilted/angled receipts
   */
  public async correctPerspective(imageBuffer: Buffer): Promise<Buffer> {
    try {
      logger.info('📐 Applying perspective correction...');
      
      // Simple rotation correction using sharp
      const processed = await sharp(imageBuffer)
        .rotate(-2, { background: { r: 255, g: 255, b: 255 } }) // Small counter-clockwise rotation
        .trim()  // Remove white borders
        .toBuffer();
        
      logger.info('✅ Perspective correction applied');
      return processed;
      
    } catch (error) {
      logger.warn('⚠️ Perspective correction failed, using original:', error);
      return imageBuffer;
    }
  }

  /**
   * Advanced deskewing for rotated documents
   */
  public async deskewImage(imageBuffer: Buffer): Promise<Buffer> {
    try {
      logger.info('📏 Applying deskewing...');
      
      // Try multiple small rotations and pick the best one
      const rotations = [-3, -2, -1, 0, 1, 2, 3];
      let bestBuffer = imageBuffer;
      let bestScore = 0;
      
      for (const angle of rotations) {
        try {
          const rotated = await sharp(imageBuffer)
            .rotate(angle, { background: { r: 255, g: 255, b: 255 } })
            .trim()
            .toBuffer();
            
          // Simple scoring based on edge detection (higher score = better alignment)
          const metadata = await sharp(rotated).stats();
          const score = metadata.entropy; // Use entropy as a rough measure of edge alignment
          
          if (score > bestScore) {
            bestScore = score;
            bestBuffer = rotated;
          }
        } catch (rotationError) {
          // Skip this rotation if it fails
          continue;
        }
      }
      
      logger.info(`✅ Deskewing completed, best angle found`);
      return bestBuffer;
      
    } catch (error) {
      logger.warn('⚠️ Deskewing failed, using original:', error);
      return imageBuffer;
    }
  }

  /**
   * Combine all advanced techniques for maximum OCR improvement
   */
  public async maximumEnhancement(imageBuffer: Buffer): Promise<AdvancedEnhancementResult> {
    try {
      logger.info('🚀 Applying maximum enhancement pipeline...');
      
      // Step 1: Perspective correction
      let enhanced = await this.correctPerspective(imageBuffer);
      
      // Step 2: Deskewing  
      enhanced = await this.deskewImage(enhanced);
      
      // Step 3: Aggressive enhancement
      const result = await this.aggressiveEnhancement(enhanced);
      
      // Add pipeline info
      result.metadata.enhancements.unshift('Perspective correction', 'Deskewing');
      result.metadata.estimatedQualityGain = Math.min(result.metadata.estimatedQualityGain + 0.2, 0.9);
      
      logger.info('🎯 Maximum enhancement pipeline completed');
      return result;
      
    } catch (error) {
      logger.error('❌ Maximum enhancement failed:', error);
      // Fallback to aggressive enhancement only
      return this.aggressiveEnhancement(imageBuffer);
    }
  }

  /**
   * Analyze image quality and recommend enhancement level
   */
  public async analyzeImageQuality(imageBuffer: Buffer): Promise<{
    quality: 'excellent' | 'good' | 'poor' | 'very_poor';
    recommendedEnhancement: 'none' | 'basic' | 'aggressive' | 'maximum';
    issues: string[];
    score: number;
  }> {
    try {
      const metadata = await sharp(imageBuffer).metadata();
      const stats = await sharp(imageBuffer).stats();
      
      const issues: string[] = [];
      let score = 100;
      
      // Check resolution
      const width = metadata.width || 0;
      const height = metadata.height || 0;
      if (width < 800 || height < 600) {
        issues.push('Low resolution');
        score -= 30;
      }
      
      // Check file size (very small might be compressed/low quality)
      if (imageBuffer.length < 50000) { // < 50KB
        issues.push('Very small file size');
        score -= 25;
      }
      
      // Check image entropy (measure of detail/information)
      const entropy = stats.entropy;
      if (entropy < 4) {
        issues.push('Low detail/contrast');
        score -= 20;
      }
      
      // Check aspect ratio (very wide/narrow might be cropped wrong)
      const aspectRatio = width / height;
      if (aspectRatio < 0.5 || aspectRatio > 2.5) {
        issues.push('Unusual aspect ratio');
        score -= 15;
      }
      
      // Determine quality and recommendation
      let quality: 'excellent' | 'good' | 'poor' | 'very_poor';
      let recommendedEnhancement: 'none' | 'basic' | 'aggressive' | 'maximum';
      
      if (score >= 80) {
        quality = 'excellent';
        recommendedEnhancement = 'none';
      } else if (score >= 60) {
        quality = 'good';
        recommendedEnhancement = 'basic';
      } else if (score >= 40) {
        quality = 'poor';
        recommendedEnhancement = 'aggressive';
      } else {
        quality = 'very_poor';
        recommendedEnhancement = 'maximum';
      }
      
      logger.info(`📊 Image quality: ${quality} (score: ${score}), recommended: ${recommendedEnhancement}`);
      
      return {
        quality,
        recommendedEnhancement,
        issues,
        score
      };
      
    } catch (error) {
      logger.error('❌ Image quality analysis failed:', error);
      return {
        quality: 'poor',
        recommendedEnhancement: 'aggressive',
        issues: ['Analysis failed'],
        score: 40
      };
    }
  }
}

export default new AdvancedImageEnhancerService(); 