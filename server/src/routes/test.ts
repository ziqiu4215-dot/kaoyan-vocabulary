import { Router } from 'express';
import { getTestQuestions, submitTestAnswers } from '../controllers/testController';

const router = Router();

router.get('/questions', getTestQuestions);
router.post('/submit', submitTestAnswers);

export default router;
