import { Router } from 'express';
import { getAIInsights } from '../controllers/aiController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

router.use(protect);

router.get('/insights', getAIInsights);

export default router;
