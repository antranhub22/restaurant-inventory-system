import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

class ExportController {
  async createExport(req: Request, res: Response) {
    try {
      const export_ = await prisma.export.create({
        data: req.body
      });
      res.json(export_);
    } catch (error) {
      res.status(500).json({ error: 'Could not create export' });
    }
  }

  async getExports(req: Request, res: Response) {
    try {
      const exports = await prisma.export.findMany();
      res.json(exports);
    } catch (error) {
      res.status(500).json({ error: 'Could not get exports' });
    }
  }

  async getExportById(req: Request, res: Response) {
    try {
      const export_ = await prisma.export.findUnique({
        where: { id: parseInt(req.params.id) }
      });
      if (export_) {
        res.json(export_);
      } else {
        res.status(404).json({ error: 'Export not found' });
      }
    } catch (error) {
      res.status(500).json({ error: 'Could not get export' });
    }
  }

  async updateExport(req: Request, res: Response) {
    try {
      const export_ = await prisma.export.update({
        where: { id: parseInt(req.params.id) },
        data: req.body
      });
      res.json(export_);
    } catch (error) {
      res.status(500).json({ error: 'Could not update export' });
    }
  }

  async deleteExport(req: Request, res: Response) {
    try {
      await prisma.export.delete({
        where: { id: parseInt(req.params.id) }
      });
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: 'Could not delete export' });
    }
  }
}

export default new ExportController(); 