import express, { Request, Response } from 'express';
import { PrismaClient, Inventory, Item, Category } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

interface InventoryWithRelations extends Inventory {
  item: Item & {
    category: Category;
  };
}

// Get all inventory items
router.get('/', async (_req: Request, res: Response<InventoryWithRelations[] | { error: string }>): Promise<void> => {
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
router.get('/:itemId', async (req: Request<{ itemId: string }>, res: Response<InventoryWithRelations | { error: string }>): Promise<void> => {
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
      res.status(404).json({ error: 'Inventory not found' });
      return;
    }
    
    res.json(inventory);
  } catch (error) {
    console.error('Get inventory by ID error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router; 