import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import wasteController from '../controllers/waste.controller';

const router = Router();

router.use(authMiddleware);

router.post('/', wasteController.createWaste);
router.get('/', wasteController.getWastes);
router.get('/:id', wasteController.getWasteById);
router.put('/:id', wasteController.updateWaste);
router.delete('/:id', wasteController.deleteWaste);

export default router; 