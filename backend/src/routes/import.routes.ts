import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import importController from '../controllers/import.controller';

const router: Router = Router();

router.use(authMiddleware);

router.post('/', importController.createImport);
router.get('/', importController.getImports);
router.get('/pending', importController.getPendingImports);
router.get('/:id', importController.getImportById);
router.put('/:id', importController.updateImport);
router.delete('/:id', importController.deleteImport);

// Approval routes
router.post('/:id/approve', importController.approveImport);
router.post('/:id/reject', importController.rejectImport);

export default router; 