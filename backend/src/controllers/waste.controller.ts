import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

class WasteController {
  async createWaste(req: Request, res: Response) {
    try {
      const waste = await prisma.waste.create({
        data: req.body
      });
      res.json(waste);
    } catch (error) {
      res.status(500).json({ error: 'Could not create waste' });
    }
  }

  async getWastes(req: Request, res: Response) {
    try {
      const wastes = await prisma.waste.findMany();
      res.json(wastes);
    } catch (error) {
      res.status(500).json({ error: 'Could not get wastes' });
    }
  }

  async getWasteById(req: Request, res: Response) {
    try {
      const waste = await prisma.waste.findUnique({
        where: { id: parseInt(req.params.id) }
      });
      if (waste) {
        res.json(waste);
      } else {
        res.status(404).json({ error: 'Waste not found' });
      }
    } catch (error) {
      res.status(500).json({ error: 'Could not get waste' });
    }
  }

  async updateWaste(req: Request, res: Response) {
    try {
      const waste = await prisma.waste.update({
        where: { id: parseInt(req.params.id) },
        data: req.body
      });
      res.json(waste);
    } catch (error) {
      res.status(500).json({ error: 'Could not update waste' });
    }
  }

  async deleteWaste(req: Request, res: Response) {
    try {
      await prisma.waste.delete({
        where: { id: parseInt(req.params.id) }
      });
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: 'Could not delete waste' });
    }
  }
}

export default new WasteController(); 