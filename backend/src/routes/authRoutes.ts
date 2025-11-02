import { Router } from 'express';
import { register, login, getCurrentUser } from '../controllers/authController';
import { authenticateJWT } from '../middleware/auth';

const router = Router();

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected routes
router.get('/me', authenticateJWT, getCurrentUser);

export default router;
