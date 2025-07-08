import request from 'supertest';
import { Express } from 'express';
import path from 'path';
import fs from 'fs';
import app from '../app';
import { PrismaClient } from '@prisma/client';
import { createMockToken } from './utils/auth';

const prisma = new PrismaClient();

describe('OCR Form API', () => {
  let testImagePath: string;
  let testImageBuffer: Buffer;
  let authToken: string;

  beforeAll(async () => {
    // Setup test image
    testImagePath = path.join(__dirname, 'fixtures', 'test-receipt.jpg');
    testImageBuffer = await fs.promises.readFile(testImagePath);

    // Create test user và token
    const user = await prisma.user.create({
      data: {
        username: 'test-user',
        email: 'test@example.com',
        passwordHash: 'test-hash',
        fullName: 'Test User',
        role: 'staff'
      }
    });
    authToken = createMockToken(user.id);
  });

  afterAll(async () => {
    // Cleanup
    await prisma.user.deleteMany({
      where: {
        username: 'test-user'
      }
    });
    await prisma.$disconnect();
  });

  describe('POST /api/ocr-forms/process', () => {
    it('should process image and return form data', async () => {
      const response = await request(app)
        .post('/api/ocr-forms/process')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('image', testImageBuffer, 'receipt.jpg')
        .field('formType', 'IMPORT');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('items');
      expect(response.body.data).toHaveProperty('confidence');
    });

    it('should return error for invalid form type', async () => {
      const response = await request(app)
        .post('/api/ocr-forms/process')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('image', testImageBuffer, 'receipt.jpg')
        .field('formType', 'INVALID');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should handle rate limiting', async () => {
      // Make 11 requests (1 over limit)
      const requests = Array(11).fill(null).map(() =>
        request(app)
          .post('/api/ocr-forms/process')
          .set('Authorization', `Bearer ${authToken}`)
          .attach('image', testImageBuffer, 'receipt.jpg')
          .field('formType', 'IMPORT')
      );

      const responses = await Promise.all(requests);
      const lastResponse = responses[responses.length - 1];

      expect(lastResponse.status).toBe(429); // Too Many Requests
    });
  });

  describe('POST /api/ocr-forms/confirm', () => {
    it('should confirm form content', async () => {
      // First create a form
      const processResponse = await request(app)
        .post('/api/ocr-forms/process')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('image', testImageBuffer, 'receipt.jpg')
        .field('formType', 'IMPORT');

      const formId = processResponse.body.data.id;

      // Then confirm it
      const response = await request(app)
        .post('/api/ocr-forms/confirm')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          formId,
          corrections: [
            {
              fieldId: 'item_1_name',
              oldValue: 'Test Item',
              newValue: 'Corrected Item'
            }
          ]
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should validate corrections format', async () => {
      const response = await request(app)
        .post('/api/ocr-forms/confirm')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          formId: 'invalid-id',
          corrections: 'invalid'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/ocr-forms/pending', () => {
    it('should return paginated pending forms', async () => {
      const response = await request(app)
        .get('/api/ocr-forms/pending')
        .set('Authorization', `Bearer ${authToken}`)
        .query({
          page: 1,
          limit: 10
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('forms');
      expect(response.body.data).toHaveProperty('pagination');
    });

    it('should validate pagination parameters', async () => {
      const response = await request(app)
        .get('/api/ocr-forms/pending')
        .set('Authorization', `Bearer ${authToken}`)
        .query({
          page: -1,
          limit: 1000
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });
}); 