import { Router } from 'express';
import { getNextWord, submitLearningRecord, getLearningStats } from '../controllers/learnController';

const router = Router();

router.get('/next-word', getNextWord);
router.post('/record', submitLearningRecord);
router.get('/stats/:wordbookId', getLearningStats);

export default router;
