import { Router } from 'express';
import {
  createGoal,
  getGoals,
  updateGoal,
  deleteGoal,
  addFundsToGoal
} from '../controllers/goalController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

router.use(protect);

router.post('/', createGoal);
router.get('/', getGoals);
router.put('/:id', updateGoal);
router.delete('/:id', deleteGoal);
router.post('/:id/add-funds', addFundsToGoal);

export default router;
