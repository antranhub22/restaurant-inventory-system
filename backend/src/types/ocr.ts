export interface ExtractedContent {
  text: string;
  type: string;
  confidence: number;
  position: {
    top: number;
    left: number;
    width: number;
    height: number;
  };
}

export interface OcrResult {
  contents: ExtractedContent[];
  rawText: string;
  confidence: number;
  processingTime: number;
  metadata?: {
    imageSize?: {
      width: number;
      height: number;
    };
    format?: string;
    dpi?: number;
    imageOptimization?: {
      originalSize: number;
      optimizedSize: number;
      width: number;
      height: number;
      format: string;
      compressionRatio: number;
    };
    imageQuality?: {
      quality: 'excellent' | 'good' | 'poor' | 'very_poor';
      recommendedEnhancement: 'none' | 'basic' | 'aggressive' | 'maximum';
      issues: string[];
      score: number;
    };
    aiCorrections?: Array<{
      original: string;
      corrected: string;
      confidence?: number;
      reason?: string;
    }>;
    enhancementLevel?: 'none' | 'basic' | 'aggressive' | 'maximum';
    qualityIssues?: string[];
    qualityRecommendations?: string[];
  };
} 