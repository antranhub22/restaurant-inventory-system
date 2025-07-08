import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

class ImportController {
  async createImport(req: Request, res: Response) {
    try {
      const import_ = await prisma.import.create({
        data: req.body
      });
      res.json(import_);
    } catch (error) {
      res.status(500).json({ error: 'Could not create import' });
    }
  }

  async getImports(req: Request, res: Response) {
    try {
      const imports = await prisma.import.findMany();
      res.json(imports);
    } catch (error) {
      res.status(500).json({ error: 'Could not get imports' });
    }
  }

  async getImportById(req: Request, res: Response) {
    try {
      const import_ = await prisma.import.findUnique({
        where: { id: parseInt(req.params.id) }
      });
      if (import_) {
        res.json(import_);
      } else {
        res.status(404).json({ error: 'Import not found' });
      }
    } catch (error) {
      res.status(500).json({ error: 'Could not get import' });
    }
  }

  async updateImport(req: Request, res: Response) {
    try {
      const import_ = await prisma.import.update({
        where: { id: parseInt(req.params.id) },
        data: req.body
      });
      res.json(import_);
    } catch (error) {
      res.status(500).json({ error: 'Could not update import' });
    }
  }

  async deleteImport(req: Request, res: Response) {
    try {
      await prisma.import.delete({
        where: { id: parseInt(req.params.id) }
      });
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: 'Could not delete import' });
    }
  }
}

export default new ImportController(); 