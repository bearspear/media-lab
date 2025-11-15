import { Router } from 'express';
import {
  getProgress,
  saveProgress,
  getRecentProgress,
  getAllProgress,
  deleteProgress,
} from '../controllers/readingProgressController';
import { authenticateJWT } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticateJWT);

// Reading progress routes
router.get('/recent', getRecentProgress);         // Get recent reading activity
router.get('/all', getAllProgress);               // Get all progress
router.get('/:itemId', getProgress);              // Get progress for specific item
router.post('/', saveProgress);                   // Save/update progress
router.delete('/:itemId', deleteProgress);        // Delete progress

export default router;
