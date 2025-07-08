import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

class ReturnController {
  async createReturn(req: Request, res: Response) {
    try {
      const return_ = await prisma.return.create({
        data: req.body
      });
      res.json(return_);
    } catch (error) {
      res.status(500).json({ error: 'Could not create return' });
    }
  }

  async getReturns(req: Request, res: Response) {
    try {
      const returns = await prisma.return.findMany();
      res.json(returns);
    } catch (error) {
      res.status(500).json({ error: 'Could not get returns' });
    }
  }

  async getReturnById(req: Request, res: Response) {
    try {
      const return_ = await prisma.return.findUnique({
        where: { id: parseInt(req.params.id) }
      });
      if (return_) {
        res.json(return_);
      } else {
        res.status(404).json({ error: 'Return not found' });
      }
    } catch (error) {
      res.status(500).json({ error: 'Could not get return' });
    }
  }

  async updateReturn(req: Request, res: Response) {
    try {
      const return_ = await prisma.return.update({
        where: { id: parseInt(req.params.id) },
        data: req.body
      });
      res.json(return_);
    } catch (error) {
      res.status(500).json({ error: 'Could not update return' });
    }
  }

  async deleteReturn(req: Request, res: Response) {
    try {
      await prisma.return.delete({
        where: { id: parseInt(req.params.id) }
      });
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: 'Could not delete return' });
    }
  }
}

export default new ReturnController(); 