import { Router } from 'express';
import {
  createOrUpdateBudget,
  getBudgets,
  deleteBudget
} from '../controllers/budgetController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

router.use(protect);

router.post('/', createOrUpdateBudget);
router.get('/', getBudgets);
router.delete('/:id', deleteBudget);

export default router;
