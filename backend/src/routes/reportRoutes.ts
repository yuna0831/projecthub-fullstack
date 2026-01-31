import express from 'express';
import { verifyToken } from '../middleware/auth';
import { createReport, getReports } from '../controllers/reportController';

const router = express.Router();

router.post('/', verifyToken, createReport);
router.get('/', verifyToken, getReports); // Should check for ADMIN role

export default router;
