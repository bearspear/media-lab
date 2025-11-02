import { Router } from 'express';
import {
  exportJSON,
  exportCSV,
  importJSON,
  importLibibCSV
} from '../controllers/exportImportController';
import { authenticateJWT } from '../middleware/auth';
import { uploadCsv } from '../middleware/upload';

const router = Router();

// All routes require authentication
router.use(authenticateJWT);

// Export routes
router.get('/export/json', exportJSON);
router.get('/export/csv', exportCSV);

// Import routes
router.post('/import/json', importJSON);
router.post('/import/libib-csv', uploadCsv.single('file'), importLibibCSV);

export default router;
