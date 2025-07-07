import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// Get all inventory items
router.get('/', async (req, res) => {
  try {
    const inventory = await prisma.inventory.findMany({
      include: {
        item: {
          include: {
            category: true
          }
        }
      }
    });
    res.json(inventory);
  } catch (error) {
    console.error('Get inventory error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get inventory by item ID
router.get('/:itemId', async (req, res) => {
  try {
    const { itemId } = req.params;
    const inventory = await prisma.inventory.findUnique({
      where: { itemId: parseInt(itemId) },
      include: {
        item: {
          include: {
            category: true
          }
        }
      }
    });
    
    if (!inventory) {
      return res.status(404).json({ error: 'Inventory not found' });
    }
    
    res.json(inventory);
  } catch (error) {
    console.error('Get inventory by ID error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router; 