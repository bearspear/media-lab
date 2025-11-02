import { Router } from 'express';
import { uploadCoverImage, uploadDigitalFile, deleteFile } from '../controllers/uploadController';
import { uploadCover, uploadFile } from '../middleware/upload';
import { authenticateJWT } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticateJWT);

// Upload routes
router.post('/cover', uploadCover.single('cover'), uploadCoverImage);
router.post('/file', uploadFile.single('file'), uploadDigitalFile);
router.delete('/:filename', deleteFile);

export default router;
