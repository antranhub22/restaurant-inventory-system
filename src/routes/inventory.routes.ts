import { Router } from 'express';
import { listInventoryController, receiveInventoryController, withdrawInventoryController, adjustInventoryController, inventoryHistoryController } from '../controllers/inventory.controller';
import { authMiddleware, authorizeRoles } from '../middleware/auth.middleware';

const router = Router();

router.get('/', authMiddleware, authorizeRoles('owner', 'manager', 'supervisor', 'staff'), listInventoryController);
router.post('/receive', authMiddleware, authorizeRoles('owner', 'manager', 'supervisor'), receiveInventoryController);
router.post('/withdraw', authMiddleware, authorizeRoles('owner', 'manager', 'supervisor'), withdrawInventoryController);
router.post('/adjust', authMiddleware, authorizeRoles('owner', 'manager'), adjustInventoryController);
router.get('/:itemId/history', authMiddleware, authorizeRoles('owner', 'manager', 'supervisor', 'staff'), inventoryHistoryController);

export default router; 