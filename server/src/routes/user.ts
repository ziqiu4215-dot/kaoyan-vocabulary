import { Router } from 'express';
import { getUserProgress, getUserProfile, updateUserProfile, changePassword } from '../controllers/userController';
import { authMiddleware } from '../middleware/auth';
import { updateProfileRules, changePasswordRules } from '../utils/validation';

const router = Router();

router.get('/progress', authMiddleware, getUserProgress);
router.get('/profile', authMiddleware, getUserProfile);
router.put('/profile', authMiddleware, updateProfileRules, updateUserProfile);
router.put('/password', authMiddleware, changePasswordRules, changePassword);

export default router;
