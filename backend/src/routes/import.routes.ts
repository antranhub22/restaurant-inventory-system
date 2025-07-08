import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import importController from '../controllers/import.controller';

const router = Router();

router.use(authMiddleware);

router.post('/', importController.createImport);
router.get('/', importController.getImports);
router.get('/:id', importController.getImportById);
router.put('/:id', importController.updateImport);
router.delete('/:id', importController.deleteImport);

export default router; 