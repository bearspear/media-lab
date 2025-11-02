import express from 'express';
import {
  getTags,
  getTagById,
  createTag,
  updateTag,
  deleteTag,
  addTagToDigitalItem,
  addTagToPhysicalItem,
  removeTagFromDigitalItem,
  removeTagFromPhysicalItem,
} from '../controllers/tagController';
import { authenticateJWT } from '../middleware/auth';

const router = express.Router();

// All routes require authentication
router.use(authenticateJWT);

// Tag CRUD routes
router.get('/', getTags);
router.get('/:id', getTagById);
router.post('/', createTag);
router.put('/:id', updateTag);
router.delete('/:id', deleteTag);

// Tag-Item association routes
router.post('/:id/digital-items', addTagToDigitalItem);
router.post('/:id/physical-items', addTagToPhysicalItem);
router.delete('/:id/digital-items/:digitalItemId', removeTagFromDigitalItem);
router.delete('/:id/physical-items/:physicalItemId', removeTagFromPhysicalItem);

export default router;
