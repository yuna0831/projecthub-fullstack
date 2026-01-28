
import { Router } from 'express';
import { verifyToken } from '../middleware/auth';
import {
    getChecklist,
    addChecklistItem,
    toggleChecklistItem,
    deleteChecklistItem
} from '../controllers/checklistController';

const router = Router();

// Base route: /api/projects/:projectId/checklist
// However, the current structure in index.ts uses /api/projects for projectRoutes.
// I should probably attach this to Project Routes OR make a new top-level generic one?
// Let's use nested URLs in projectRoutes for cleaner API design if possible, 
// OR simpler: /api/checklist?projectId=... 
// But the controller above uses req.params.projectId
// Let's stick to /api/projects/:projectId/checklist in projectRoutes?
// Actually, creating a separate route file often means a new top-level prefix.
// Let's try to add it to generic routes or handle params carefully.
// I will define it as: router.get('/:projectId', ...) and mount it at /api/checklist

router.get('/:projectId', verifyToken, getChecklist);
router.post('/:projectId', verifyToken, addChecklistItem);
router.put('/item/:id', verifyToken, toggleChecklistItem);
router.delete('/item/:id', verifyToken, deleteChecklistItem);

export default router;
