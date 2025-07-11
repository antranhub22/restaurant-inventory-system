import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

class ItemsController {
  // Get all items
  async getAllItems(req: Request, res: Response): Promise<void> {
    try {
      const items = await prisma.item.findMany({
        include: {
          category: true,
          primarySupplier: true,
          inventory: true
        },
        orderBy: {
          name: 'asc'
        }
      });

      res.json(items);
    } catch (error) {
      console.error('Get all items error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Get item by ID
  async getItemById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const item = await prisma.item.findUnique({
        where: { id: parseInt(id) },
        include: {
          category: true,
          primarySupplier: true,
          secondarySupplier: true,
          inventory: true
        }
      });

      if (!item) {
        res.status(404).json({ error: 'Item not found' });
        return;
      }

      res.json(item);
    } catch (error) {
      console.error('Get item by ID error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Create new item
  async createItem(req: Request, res: Response): Promise<void> {
    try {
      const {
        name,
        categoryId,
        unit,
        unitCost,
        minStock,
        maxStock,
        expiryDays,
        aliases,
        barcode,
        description,
        primarySupplierId,
        secondarySupplierId
      } = req.body;

      // Validate required fields
      if (!name || !categoryId || !unit) {
        res.status(400).json({ 
          error: 'Missing required fields: name, categoryId, unit' 
        });
        return;
      }

      // Check if category exists
      const category = await prisma.category.findUnique({
        where: { id: parseInt(categoryId) }
      });

      if (!category) {
        res.status(400).json({ error: 'Category not found' });
        return;
      }

      const item = await prisma.item.create({
        data: {
          name,
          categoryId: parseInt(categoryId),
          unit,
          unitCost: unitCost ? parseFloat(unitCost) : null,
          minStock: minStock ? parseFloat(minStock) : 0,
          maxStock: maxStock ? parseFloat(maxStock) : null,
          expiryDays: expiryDays ? parseInt(expiryDays) : null,
          aliases: aliases || [],
          barcode: barcode || null,
          description: description || null,
          primarySupplierId: primarySupplierId ? parseInt(primarySupplierId) : null,
          secondarySupplierId: secondarySupplierId ? parseInt(secondarySupplierId) : null
        },
        include: {
          category: true,
          primarySupplier: true,
          inventory: true
        }
      });

      res.status(201).json(item);
    } catch (error) {
      console.error('Create item error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Update item
  async updateItem(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const {
        name,
        categoryId,
        unit,
        unitCost,
        minStock,
        maxStock,
        expiryDays,
        aliases,
        barcode,
        description,
        primarySupplierId,
        secondarySupplierId,
        isActive
      } = req.body;

      // Check if item exists
      const existingItem = await prisma.item.findUnique({
        where: { id: parseInt(id) }
      });

      if (!existingItem) {
        res.status(404).json({ error: 'Item not found' });
        return;
      }

      // If categoryId is provided, check if category exists
      if (categoryId) {
        const category = await prisma.category.findUnique({
          where: { id: parseInt(categoryId) }
        });

        if (!category) {
          res.status(400).json({ error: 'Category not found' });
          return;
        }
      }

      const item = await prisma.item.update({
        where: { id: parseInt(id) },
        data: {
          ...(name && { name }),
          ...(categoryId && { categoryId: parseInt(categoryId) }),
          ...(unit && { unit }),
          ...(unitCost !== undefined && { unitCost: unitCost ? parseFloat(unitCost) : null }),
          ...(minStock !== undefined && { minStock: minStock ? parseFloat(minStock) : 0 }),
          ...(maxStock !== undefined && { maxStock: maxStock ? parseFloat(maxStock) : null }),
          ...(expiryDays !== undefined && { expiryDays: expiryDays ? parseInt(expiryDays) : null }),
          ...(aliases !== undefined && { aliases }),
          ...(barcode !== undefined && { barcode }),
          ...(description !== undefined && { description }),
          ...(primarySupplierId !== undefined && { primarySupplierId: primarySupplierId ? parseInt(primarySupplierId) : null }),
          ...(secondarySupplierId !== undefined && { secondarySupplierId: secondarySupplierId ? parseInt(secondarySupplierId) : null }),
          ...(isActive !== undefined && { isActive })
        },
        include: {
          category: true,
          primarySupplier: true,
          inventory: true
        }
      });

      res.json(item);
    } catch (error) {
      console.error('Update item error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Delete item (soft delete)
  async deleteItem(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      // Check if item exists
      const existingItem = await prisma.item.findUnique({
        where: { id: parseInt(id) }
      });

      if (!existingItem) {
        res.status(404).json({ error: 'Item not found' });
        return;
      }

      // Soft delete by setting isActive to false
      const item = await prisma.item.update({
        where: { id: parseInt(id) },
        data: { isActive: false }
      });

      res.json({ message: 'Item deleted successfully', item });
    } catch (error) {
      console.error('Delete item error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Get categories (helper endpoint)
  async getCategories(req: Request, res: Response): Promise<void> {
    try {
      const categories = await prisma.category.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' }
      });

      res.json(categories);
    } catch (error) {
      console.error('Get categories error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Get suppliers (helper endpoint)
  async getSuppliers(req: Request, res: Response): Promise<void> {
    try {
      const suppliers = await prisma.supplier.findMany({
        where: { isActive: true },
        orderBy: { name: 'asc' }
      });

      res.json(suppliers);
    } catch (error) {
      console.error('Get suppliers error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

export default new ItemsController(); 