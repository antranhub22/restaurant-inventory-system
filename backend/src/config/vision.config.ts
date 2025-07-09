import { ImageAnnotatorClient } from '@google-cloud/vision';
import dotenv from 'dotenv';

dotenv.config();

class MockVisionClient {
  async documentTextDetection({ image, imageContext }: any) {
    console.log('🔍 Mock OCR Service');
    console.log('Image size:', image.content.length, 'bytes');
    console.log('Language hints:', imageContext?.languageHints || []);

    // Check if we should force fail to test fallback mechanism
    if (process.env.FORCE_VISION_FAIL === 'true') {
      console.log('🚫 Forcing Vision API failure to test fallback...');
      throw new Error('Mock Vision API failure for testing fallback');
    }

    // Return realistic mock data that matches actual Vision API structure
    return [{
      fullTextAnnotation: {
        text: 'CỬA HÀNG THỰC PHẨM ABC\nHÓA ĐƠN NHẬP HÀNG\n\nNgày: 09/07/2025\nNhà cung cấp: CÔNG TY TNHH THỰC PHẨM SẠCH\nSố hóa đơn: HD2025070901\n\nGạo tám xoan: 2 bao × 25,000đ = 50,000đ\nDầu ăn Neptune: 1 thùng × 25,000đ = 25,000đ\nNước mắm Nam Ngư: 1 thùng × 15,000đ = 15,000đ\n\nTổng cộng: 90,000đ\nGhi chú: Hàng tươi, chất lượng tốt\n\nCảm ơn quý khách!',
        pages: [{
          blocks: [
            // Header block
            {
              boundingBox: {
                vertices: [
                  { x: 50, y: 10 },
                  { x: 350, y: 10 },
                  { x: 350, y: 60 },
                  { x: 50, y: 60 }
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
              confidence: 0.95
            },
            // Date block
            {
              boundingBox: {
                vertices: [
                  { x: 50, y: 80 },
                  { x: 200, y: 80 },
                  { x: 200, y: 100 },
                  { x: 50, y: 100 }
                ]
              },
              paragraphs: [{
                words: [{
                  symbols: [
                    { text: '0' }, { text: '9' }, { text: '/' },
                    { text: '0' }, { text: '7' }, { text: '/' },
                    { text: '2' }, { text: '0' }, { text: '2' }, { text: '5' }
                  ]
                }]
              }],
              confidence: 0.92
            },
            // Supplier block
            {
              boundingBox: {
                vertices: [
                  { x: 50, y: 120 },
                  { x: 300, y: 120 },
                  { x: 300, y: 140 },
                  { x: 50, y: 140 }
                ]
              },
              paragraphs: [{
                words: [{
                  symbols: [
                    { text: 'C' }, { text: 'Ô' }, { text: 'N' }, { text: 'G' }, { text: ' ' },
                    { text: 'T' }, { text: 'Y' }
                  ]
                }]
              }],
              confidence: 0.88
            },
            // Invoice number block
            {
              boundingBox: {
                vertices: [
                  { x: 50, y: 160 },
                  { x: 250, y: 160 },
                  { x: 250, y: 180 },
                  { x: 50, y: 180 }
                ]
              },
              paragraphs: [{
                words: [{
                  symbols: [
                    { text: 'H' }, { text: 'D' }, { text: '2' }, { text: '0' },
                    { text: '2' }, { text: '5' }, { text: '0' }, { text: '7' },
                    { text: '0' }, { text: '9' }, { text: '0' }, { text: '1' }
                  ]
                }]
              }],
              confidence: 0.94
            },
            // Item 1 block
            {
              boundingBox: {
                vertices: [
                  { x: 50, y: 200 },
                  { x: 300, y: 200 },
                  { x: 300, y: 220 },
                  { x: 50, y: 220 }
                ]
              },
              paragraphs: [{
                words: [{
                  symbols: [
                    { text: 'G' }, { text: 'ạ' }, { text: 'o' }, { text: ' ' },
                    { text: 't' }, { text: 'á' }, { text: 'm' }
                  ]
                }]
              }],
              confidence: 0.90
            },
            // Total block
            {
              boundingBox: {
                vertices: [
                  { x: 50, y: 300 },
                  { x: 200, y: 300 },
                  { x: 200, y: 320 },
                  { x: 50, y: 320 }
                ]
              },
              paragraphs: [{
                words: [{
                  symbols: [
                    { text: '9' }, { text: '0' }, { text: '.' }, { text: '0' },
                    { text: '0' }, { text: '0' }, { text: 'đ' }
                  ]
                }]
              }],
              confidence: 0.96
            },
            // Notes block
            {
              boundingBox: {
                vertices: [
                  { x: 50, y: 340 },
                  { x: 250, y: 340 },
                  { x: 250, y: 360 },
                  { x: 50, y: 360 }
                ]
              },
              paragraphs: [{
                words: [{
                  symbols: [
                    { text: 'H' }, { text: 'à' }, { text: 'n' }, { text: 'g' }, { text: ' ' },
                    { text: 't' }, { text: 'ư' }, { text: 'ơ' }, { text: 'i' }
                  ]
                }]
              }],
              confidence: 0.87
            }
          ]
        }]
      }
    }];
  }

  async textDetection({ image, imageContext }: any) {
    console.log('🔍 Mock Text Detection Service');
    
    if (process.env.FORCE_VISION_FAIL === 'true') {
      throw new Error('Mock Vision API failure for testing fallback');
    }
    
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
  
  if (process.env.FORCE_VISION_FAIL === 'true') {
    console.log('🧪 Vision API will fail to test fallback mechanism');
  }
  
  visionClient = new MockVisionClient();
}

export default visionClient; 