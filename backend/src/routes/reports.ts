import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// Get dashboard metrics
router.get('/dashboard', async (req, res) => {
  try {
    const [
      totalItems,
      totalTransactions,
      lowStockItems,
      recentTransactions
    ] = await Promise.all([
      prisma.item.count(),
      prisma.transaction.count(),
      prisma.inventory.count({
        where: {
          currentStock: {
            lte: 10
          }
        }
      }),
      prisma.transaction.findMany({
        take: 5,
        orderBy: {
          createdAt: 'desc'
        },
        include: {
          item: true
        }
      })
    ]);

    res.json({
      totalItems,
      totalTransactions,
      lowStockItems,
      recentTransactions
    });
  } catch (error) {
    console.error('Get dashboard metrics error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router; 