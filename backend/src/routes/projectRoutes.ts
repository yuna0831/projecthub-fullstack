import express from 'express';
import { verifyToken } from '../middleware/auth';
import { createProject, getProjects, getProjectById, updateProject, applyToProject, getProjectApplications, checkApplicationStatus, completeProject, withdrawApplication, updateProjectStatus, confirmCompletion, deleteProject, toggleBookmark, getBookmarks } from '../controllers/projectController';
import { createPeerReview, getProjectReviews } from '../controllers/reviewController';

const router = express.Router();

// 🟢 Public Routes
router.get('/', getProjects);
router.get('/bookmarks', verifyToken, getBookmarks); // 🆕 Must be before /:id
router.get('/:id', getProjectById);

// 🔒 Protected Routes (Require Auth)
router.post('/', verifyToken, createProject);
router.put('/:id', verifyToken, updateProject);
router.delete('/:id', verifyToken, deleteProject); // 🆕 Delete Project
router.post('/:id/bookmark', verifyToken, toggleBookmark); // 🆕 Toggle Bookmark

// 📝 Applications
router.post('/:id/apply', verifyToken, applyToProject); // User applies
router.delete('/:id/application', verifyToken, withdrawApplication); // User withdraws
router.get('/:id/applications', verifyToken, getProjectApplications); // Owner views
router.get('/:id/status', verifyToken, checkApplicationStatus); // User checks status

// 🏁 Completion & Reviews
router.patch('/:id/status', verifyToken, updateProjectStatus); // Owner updates status (Draft -> Open -> Closed)
router.post('/:id/complete', verifyToken, completeProject); // Owner requests completion (or completes if no members)
router.post('/:id/complete/confirm', verifyToken, confirmCompletion); // Members confirm completion

router.post('/:projectId/reviews', verifyToken, createPeerReview); // Peer Review
router.get('/:projectId/reviews', verifyToken, getProjectReviews);

export default router;
