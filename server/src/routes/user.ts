import { Router } from 'express';
import { getUserProgress } from '../controllers/userController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.get('/progress', authMiddleware, getUserProgress);

export default router;
