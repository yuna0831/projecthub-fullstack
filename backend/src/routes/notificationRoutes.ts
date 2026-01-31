import express from 'express';
import { verifyToken } from '../middleware/auth';
import { getNotifications, markNotificationRead } from '../controllers/notificationController';

const router = express.Router();

router.get('/', verifyToken, getNotifications);
router.patch('/:id/read', verifyToken, markNotificationRead);

export default router;
