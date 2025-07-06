import { Router } from 'express';
import { listUsersController, createUserController, updateUserController, deleteUserController } from '../controllers/user.controller';
import { authMiddleware, authorizeRoles } from '../middleware/auth.middleware';

const router = Router();

router.get('/', authMiddleware, authorizeRoles('owner', 'manager'), listUsersController);
router.post('/', authMiddleware, authorizeRoles('owner', 'manager'), createUserController);
router.put('/:id', authMiddleware, authorizeRoles('owner', 'manager'), updateUserController);
router.delete('/:id', authMiddleware, authorizeRoles('owner', 'manager'), deleteUserController);

export default router; 