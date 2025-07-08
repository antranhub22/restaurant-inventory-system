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
  };
} 