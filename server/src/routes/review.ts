import { Router } from 'express';
import { getTodayReview, submitReviewRating } from '../controllers/reviewController';

const router = Router();

router.get('/', getTodayReview);
router.post('/rate', submitReviewRating);

export default router;
