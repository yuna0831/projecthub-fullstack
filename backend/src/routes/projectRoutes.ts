import express from 'express';
import { verifyToken } from '../middleware/auth';
import { createProject, getProjects, getProjectById, updateProject, applyToProject, getProjectApplications, checkApplicationStatus, completeProject } from '../controllers/projectController';
import { createPeerReview, getProjectReviews } from '../controllers/reviewController';

const router = express.Router();

// 🟢 Public Routes
router.get('/', getProjects);
router.get('/:id', getProjectById);

// 🔒 Protected Routes (Require Auth)
router.post('/', verifyToken, createProject);
router.put('/:id', verifyToken, updateProject);

// 📝 Applications
router.post('/:id/apply', verifyToken, applyToProject); // User applies
router.get('/:id/applications', verifyToken, getProjectApplications); // Owner views
router.get('/:id/status', verifyToken, checkApplicationStatus); // User checks status

// 🏁 Completion & Reviews
router.put('/:id/complete', verifyToken, completeProject); // Mark as Completed
router.post('/:projectId/reviews', verifyToken, createPeerReview); // Peer Review
router.get('/:projectId/reviews', verifyToken, getProjectReviews);

export default router;
