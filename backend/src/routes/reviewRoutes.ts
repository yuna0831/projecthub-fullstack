
import { Router } from 'express';
import { verifyToken } from '../middleware/auth';
import { createReview, getUserBadges } from '../controllers/reviewController';

const router = Router();

// POST /api/reviews/:projectId
router.post('/:projectId', verifyToken, createReview);

// GET /api/reviews/user/:userId/badges
router.get('/user/:userId/badges', getUserBadges);

export default router;
