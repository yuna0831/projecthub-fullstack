import { Router } from 'express';
import { verifyToken } from '../middleware/auth';
import { getUserBadges } from '../controllers/reviewController';

const router = Router();

// GET /api/reviews/user/:userId/badges
router.get('/user/:userId/badges', verifyToken, getUserBadges);

export default router;
