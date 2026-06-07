import { Router } from 'express';
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  clearNotifications,
  getVapidKey,
  subscribePush,
  unsubscribePush
} from '../controllers/notificationController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

router.use(protect);

router.get('/', getNotifications);
router.get('/vapid-key', getVapidKey);
router.post('/subscribe', subscribePush);
router.post('/unsubscribe', unsubscribePush);
router.put('/:id/read', markAsRead);
router.post('/read-all', markAllAsRead);
router.delete('/clear', clearNotifications);

export default router;
