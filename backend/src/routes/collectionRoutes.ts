import express from 'express';
import {
  getCollections,
  getCollectionById,
  createCollection,
  updateCollection,
  deleteCollection,
  addDigitalItemToCollection,
  addPhysicalItemToCollection,
  removeDigitalItemFromCollection,
  removePhysicalItemFromCollection,
} from '../controllers/collectionController';
import { authenticateJWT } from '../middleware/auth';

const router = express.Router();

// All routes require authentication
router.use(authenticateJWT);

// Collection CRUD routes
router.get('/', getCollections);
router.get('/:id', getCollectionById);
router.post('/', createCollection);
router.put('/:id', updateCollection);
router.delete('/:id', deleteCollection);

// Collection membership routes
router.post('/:id/digital-items', addDigitalItemToCollection);
router.post('/:id/physical-items', addPhysicalItemToCollection);
router.delete('/:id/digital-items/:digitalItemId', removeDigitalItemFromCollection);
router.delete('/:id/physical-items/:physicalItemId', removePhysicalItemFromCollection);

export default router;
