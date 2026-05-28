import { Router } from 'express';
import { getWordbooks, getWordbookProgress, searchWords } from '../controllers/wordbookListController';
import { getWordbook as getUserWordbook, addToWordbook, removeFromWordbook } from '../controllers/wordbookController';

const router = Router();

// Wordbook list / progress / search (public word lists)
router.get('/', getWordbooks);
router.get('/search', searchWords);
router.get('/:id/progress', getWordbookProgress);

// User's personal wordbook
router.get('/user/list', getUserWordbook);
router.post('/user/add', addToWordbook);
router.delete('/user/remove/:wordId', removeFromWordbook);

export default router;
