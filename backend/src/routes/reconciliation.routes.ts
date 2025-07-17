import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import reconciliationController from '../controllers/reconciliation.controller';

const router: Router = Router();

router.use(authMiddleware);

// Basic CRUD operations
router.post('/', reconciliationController.createReconciliation);
router.get('/', reconciliationController.getReconciliations);
router.get('/pending', reconciliationController.getPendingReconciliations);
router.get('/:id', reconciliationController.getReconciliationById);
router.put('/:id', reconciliationController.updateReconciliation);
router.delete('/:id', reconciliationController.deleteReconciliation);

// Reports and analytics
router.get('/report', reconciliationController.getReconciliationReport);
router.get('/variances', reconciliationController.getVariances);

// Approval routes
router.post('/:id/approve', reconciliationController.approveReconciliation);
router.post('/:id/reject', reconciliationController.rejectReconciliation);

export default router; 