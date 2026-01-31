import express from 'express';
import { verifyToken } from '../middleware/auth';
import { syncUser, getDashboardData, updateApplicationStatus, updateProfile, addEducation, addExperience, deleteProfileItem, getUserById, togglePrivacy } from '../controllers/userController';

const router = express.Router();

// POST /api/users/sync
// Called by Frontend after Firebase Login
router.post('/sync', verifyToken, syncUser);

// 📊 Dashboard Routes
router.get('/dashboard', verifyToken, getDashboardData);

// 📝 Application Status Update (Owner accepts/rejects)
router.put('/applications/:id/status', verifyToken, updateApplicationStatus);

// 👤 Update User Profile
router.put('/profile', verifyToken, updateProfile);
router.patch('/privacy', verifyToken, togglePrivacy); // New Route

// 🎓 Advanced Profile (Education & Experience)
router.post('/education', verifyToken, addEducation);
router.post('/experience', verifyToken, addExperience);
router.delete('/profile-item/:type/:id', verifyToken, deleteProfileItem);

// 🔔 Notifications (Moved to notificationRoutes)
// router.get('/notifications', verifyToken, getNotifications);
// router.put('/notifications/:id/read', verifyToken, markNotificationRead);

// 🔍 Public Profile (Dynamic ID - Must be last GET)
router.get('/:id', verifyToken, getUserById);

export default router;
