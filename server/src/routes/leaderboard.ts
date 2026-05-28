import { Router } from 'express';
import { getLevelLeaderboard, getDailyLeaderboard, getMyRank } from '../controllers/leaderboardController';
import { optionalAuth } from '../middleware/auth';

const router = Router();

router.get('/level', getLevelLeaderboard);
router.get('/daily', getDailyLeaderboard);
router.get('/me', optionalAuth, getMyRank);

export default router;
