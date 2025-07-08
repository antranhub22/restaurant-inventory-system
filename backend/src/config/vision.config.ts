import { ImageAnnotatorClient } from '@google-cloud/vision';
import dotenv from 'dotenv';

dotenv.config();

class MockVisionClient {
  async documentTextDetection({ image, imageContext }: any) {
    console.log('🔍 Mock OCR Service');
    console.log('Image size:', image.content.length, 'bytes');
    console.log('Language hints:', imageContext.languageHints);

    // Return mock data
    return [{
      fullTextAnnotation: {
        pages: [{
          blocks: [{
            boundingBox: {
              vertices: [
                { x: 0, y: 0 },
                { x: 100, y: 0 },
                { x: 100, y: 50 },
                { x: 0, y: 50 }
              ]
            },
            paragraphs: [{
              words: [{
                symbols: [{ text: 'Test' }]
              }]
            }],
            confidence: 0.95
          }]
        }]
      }
    }];
  }
}

// Initialize the client
let visionClient: ImageAnnotatorClient | MockVisionClient;

if (process.env.NODE_ENV === 'production') {
  // Production: Use real Google Cloud Vision client
  if (!process.env.GOOGLE_CLOUD_PROJECT_ID || 
      !process.env.GOOGLE_CLOUD_CLIENT_EMAIL || 
      !process.env.GOOGLE_CLOUD_PRIVATE_KEY) {
    throw new Error('Missing Google Cloud Vision credentials');
  }

  visionClient = new ImageAnnotatorClient({
    credentials: {
      client_email: process.env.GOOGLE_CLOUD_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_CLOUD_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
  });
} else {
  // Development: Use mock client
  console.log('⚠️ Using mock Vision client for development');
  visionClient = new MockVisionClient();
}

export default visionClient; 