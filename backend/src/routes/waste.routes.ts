import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import wasteController from '../controllers/waste.controller';

const router: Router = Router();

router.use(authMiddleware);

router.post('/', wasteController.createWaste);
router.get('/', wasteController.getWastes);
router.get('/pending', wasteController.getPendingWastes);
router.get('/:id', wasteController.getWasteById);
router.put('/:id', wasteController.updateWaste);
router.delete('/:id', wasteController.deleteWaste);

// Approval routes
router.post('/:id/approve', wasteController.approveWaste);
router.post('/:id/reject', wasteController.rejectWaste);

export default router; 