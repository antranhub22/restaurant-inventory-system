import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// Process receipt image
router.post('/process-receipt', async (req, res) => {
  try {
    const { imageData, imageType } = req.body;
    
    // TODO: Implement OCR processing with Google Vision API
    // For now, return mock data
    const mockResult = {
      items: [
        {
          name: 'Cà phê sữa đá',
          quantity: 2,
          unitPrice: 25000,
          totalPrice: 50000
        },
        {
          name: 'Bánh mì thịt',
          quantity: 1,
          unitPrice: 15000,
          totalPrice: 15000
        }
      ],
      total: 65000,
      confidence: 0.85
    };

    res.json(mockResult);
  } catch (error) {
    console.error('OCR processing error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router; 