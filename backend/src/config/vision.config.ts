import { ImageAnnotatorClient } from '@google-cloud/vision';
import dotenv from 'dotenv';

dotenv.config();

// Initialize the client with credentials
const visionClient = new ImageAnnotatorClient({
  credentials: {
    client_email: process.env.GOOGLE_CLOUD_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_CLOUD_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  },
  projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
});

export default visionClient; 