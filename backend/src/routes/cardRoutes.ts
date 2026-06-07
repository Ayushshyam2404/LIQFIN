import { Router } from 'express';
import {
  createCard,
  getCards,
  getCardById,
  updateCard,
  deleteCard
} from '../controllers/cardController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

router.use(protect);

router.post('/', createCard);
router.get('/', getCards);
router.get('/:id', getCardById);
router.put('/:id', updateCard);
router.delete('/:id', deleteCard);

export default router;
