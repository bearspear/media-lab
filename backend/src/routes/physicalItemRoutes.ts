import { Router } from 'express';
import {
  getPhysicalItems,
  getPhysicalItemById,
  createPhysicalItem,
  updatePhysicalItem,
  deletePhysicalItem,
} from '../controllers/physicalItemController';
import { authenticateJWT } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticateJWT);

// CRUD routes
router.get('/', getPhysicalItems);
router.get('/:id', getPhysicalItemById);
router.post('/', createPhysicalItem);
router.put('/:id', updatePhysicalItem);
router.delete('/:id', deletePhysicalItem);

export default router;
