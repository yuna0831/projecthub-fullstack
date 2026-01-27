import express from 'express';
import { verifyToken } from '../middleware/auth';
import { createProject, getProjects, getProjectById, applyToProject, getProjectApplications, updateProject, checkApplicationStatus } from '../controllers/projectController';

const router = express.Router();

// GET /api/projects (Public)
router.get('/', getProjects);

// GET /api/projects/:id (Public)
router.get('/:id', getProjectById);

// POST /api/projects (Protected)
router.post('/', verifyToken, createProject);

// PUT /api/projects/:id (Protected)
router.put('/:id', verifyToken, updateProject);

// 🦡 Apply to Project
// 🦡 Apply to Project
router.post('/:id/apply', verifyToken, applyToProject);
router.get('/:id/application-status', verifyToken, checkApplicationStatus);

// 🦡 Get Applications (Owner Only)
router.get('/:id/applications', verifyToken, getProjectApplications);

export default router;
