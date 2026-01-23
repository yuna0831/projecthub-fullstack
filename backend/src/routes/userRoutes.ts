import express from 'express';
import { verifyToken } from '../middleware/auth';
import { syncUser } from '../controllers/userController';

const router = express.Router();

// POST /api/users/sync
// Called by Frontend after Firebase Login
router.post('/sync', verifyToken, syncUser);

export default router;
