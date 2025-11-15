import { Router } from 'express';
import {
  getFilesForItem,
  addFileToItem,
  updateFile,
  deleteFile,
  setPrimaryFile,
} from '../controllers/digitalFileController';
import { authenticateJWT } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticateJWT);

// Get all files for a digital item
router.get('/items/:itemId/files', getFilesForItem);

// Add a new file to a digital item
router.post('/items/:itemId/files', addFileToItem);

// Update a file
router.put('/files/:fileId', updateFile);

// Delete a file
router.delete('/files/:fileId', deleteFile);

// Set a file as primary
router.patch('/files/:fileId/primary', setPrimaryFile);

export default router;
