import { ImageAnnotatorClient } from '@google-cloud/vision';
import dotenv from 'dotenv';

dotenv.config();

class MockVisionClient {
  async documentTextDetection({ image, imageContext }: any) {
    console.log('🔍 Mock OCR Service');
    console.log('Image size:', image.content.length, 'bytes');
    console.log('Language hints:', imageContext?.languageHints || []);

    // Return mock data that matches actual Vision API structure
    return [{
      fullTextAnnotation: {
        text: 'MOCK OCR RESULT\nCỬA HÀNG THỰC PHẨM ABC\nHÓA ĐƠN BÁN HÀNG\n\nGạo tám xoan: 50,000đ\nDầu ăn: 25,000đ\nNước mắm: 15,000đ\n\nTổng cộng: 90,000đ\nTiền khách đưa: 100,000đ\nTiền thừa: 10,000đ\n\nCảm ơn quý khách!',
        pages: [{
          blocks: [{
            boundingBox: {
              vertices: [
                { x: 10, y: 10 },
                { x: 400, y: 10 },
                { x: 400, y: 300 },
                { x: 10, y: 300 }
              ]
            },
            paragraphs: [{
              words: [{
                symbols: [
                  { text: 'C' }, { text: 'Ử' }, { text: 'A' }, { text: ' ' },
                  { text: 'H' }, { text: 'À' }, { text: 'N' }, { text: 'G' }
                ]
              }]
            }],
            confidence: 0.92
          }]
        }]
      }
    }];
  }

  async textDetection({ image, imageContext }: any) {
    console.log('🔍 Mock Text Detection Service');
    return [{
      textAnnotations: [{
        description: 'MOCK OCR RESULT',
        boundingPoly: {
          vertices: [
            { x: 0, y: 0 },
            { x: 100, y: 0 },
            { x: 100, y: 50 },
            { x: 0, y: 50 }
          ]
        }
      }]
    }];
  }
}

// Check if Google Cloud Vision credentials are available
function hasGoogleCloudCredentials(): boolean {
  return !!(
    process.env.GOOGLE_CLOUD_PROJECT_ID && 
    process.env.GOOGLE_CLOUD_CLIENT_EMAIL && 
    process.env.GOOGLE_CLOUD_PRIVATE_KEY
  );
}

// Initialize the client
let visionClient: ImageAnnotatorClient | MockVisionClient;

if (process.env.NODE_ENV === 'production' && hasGoogleCloudCredentials()) {
  // Production with credentials: Use real Google Cloud Vision client
  console.log('✅ Using Google Cloud Vision API with credentials');
  visionClient = new ImageAnnotatorClient({
    credentials: {
      client_email: process.env.GOOGLE_CLOUD_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_CLOUD_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
    // Tối ưu hóa cấu hình cho OCR
    apiEndpoint: 'vision.googleapis.com',
    retry: {
      retries: 3,
      factor: 2,
      minTimeout: 1000,
      maxTimeout: 10000,
    },
    // Tăng timeout cho OCR processing
    timeout: 60000, // 60 seconds
  });
} else {
  // Development or Production without credentials: Use mock client
  const reason = process.env.NODE_ENV === 'production' 
    ? 'Missing Google Cloud credentials' 
    : 'Development mode';
  console.log(`⚠️ Using mock Vision client (${reason})`);
  visionClient = new MockVisionClient();
}

export default visionClient; 