import { Router } from 'express';
import { verifyToken } from '../middleware/auth';
import { getUserBadges, createPeerReview } from '../controllers/reviewController';

const router = Router();

// GET /api/reviews/user/:userId/badges
router.get('/user/:userId/badges', verifyToken, getUserBadges);

// POST /api/reviews/:projectId - Create a peer review
router.post('/:projectId', verifyToken, createPeerReview);

export default router;
