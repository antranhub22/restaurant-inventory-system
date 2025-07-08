import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import exportController from '../controllers/export.controller';

const router = Router();

router.use(authMiddleware);

router.post('/', exportController.createExport);
router.get('/', exportController.getExports);
router.get('/:id', exportController.getExportById);
router.put('/:id', exportController.updateExport);
router.delete('/:id', exportController.deleteExport);

export default router; 