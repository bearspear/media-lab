import { Router } from 'express';
import {
  getDigitalItems,
  getDigitalItemById,
  createDigitalItem,
  updateDigitalItem,
  deleteDigitalItem,
} from '../controllers/digitalItemController';
import { authenticateJWT } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticateJWT);

// CRUD routes
router.get('/', getDigitalItems);
router.get('/:id', getDigitalItemById);
router.post('/', createDigitalItem);
router.put('/:id', updateDigitalItem);
router.delete('/:id', deleteDigitalItem);

export default router;
