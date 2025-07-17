import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import itemsController from '../controllers/items.controller';

const router: Router = Router();

// Apply authentication middleware to all routes
router.use(authMiddleware);

// Helper routes (no auth needed for categories/suppliers lookup)
router.get('/categories', itemsController.getCategories);
router.get('/suppliers', itemsController.getSuppliers);

// CRUD routes for items
router.get('/', itemsController.getAllItems);
router.get('/:id', itemsController.getItemById);
router.post('/', itemsController.createItem);
router.put('/:id', itemsController.updateItem);
router.delete('/:id', itemsController.deleteItem);

export default router; 