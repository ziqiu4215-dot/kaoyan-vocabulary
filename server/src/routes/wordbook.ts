import { Router } from 'express';
import { getWordbooks, getWordbookProgress, searchWords } from '../controllers/wordbookController';

const router = Router();

router.get('/', getWordbooks);
router.get('/search', searchWords);
router.get('/:id/progress', getWordbookProgress);

export default router;
