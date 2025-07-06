import { Router } from 'express';
import { listItemsController, createItemController, updateItemController, deleteItemController } from '../controllers/item.controller';
import { authMiddleware, authorizeRoles } from '../middleware/auth.middleware';

const router = Router();

router.get('/', authMiddleware, authorizeRoles('owner', 'manager', 'supervisor', 'staff'), listItemsController);
router.post('/', authMiddleware, authorizeRoles('owner', 'manager', 'supervisor'), createItemController);
router.put('/:id', authMiddleware, authorizeRoles('owner', 'manager', 'supervisor'), updateItemController);
router.delete('/:id', authMiddleware, authorizeRoles('owner', 'manager'), deleteItemController);

export default router; 