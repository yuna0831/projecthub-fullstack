
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 📋 Get Checklist Items
export const getChecklist = async (req: Request, res: Response) => {
    try {
        const { projectId } = req.params;
        const firebaseUid = req.user?.uid;
        if (!firebaseUid) return res.status(401).json({ error: 'Unauthorized' });

        // Verify User Access (Owner or Accepted Applicant)
        const user = await prisma.user.findUnique({ where: { firebaseUid } });
        if (!user) return res.status(404).json({ error: 'User not found' });

        const project = await prisma.project.findUnique({
            where: { id: projectId },
            include: { applications: true }
        });

        if (!project) return res.status(404).json({ error: 'Project not found' });

        const isOwner = project.ownerId === user.id;
        const isMember = project.applications.some(app => app.userId === user.id && app.status === 'ACCEPTED');

        if (!isOwner && !isMember) {
            return res.status(403).json({ error: 'Access denied: You are not a member of this project.' });
        }

        const items = await prisma.checklistItem.findMany({
            where: { projectId },
            orderBy: { content: 'asc' } // Simple ordering
        });

        res.json(items);
    } catch (error) {
        console.error("Get Checklist Error:", error);
        res.status(500).json({ error: 'Failed to fetch checklist' });
    }
};

// ➕ Add Item
export const addChecklistItem = async (req: Request, res: Response) => {
    try {
        const { projectId } = req.params;
        const { content } = req.body;
        const firebaseUid = req.user?.uid;
        if (!firebaseUid) return res.status(401).json({ error: 'Unauthorized' });

        const user = await prisma.user.findUnique({ where: { firebaseUid } });
        if (!user) return res.status(404).json({ error: 'User not found' });

        // Access Check (Simplified for speed, same as above)
        // Ideally extract this to middleware
        const project = await prisma.project.findUnique({
            where: { id: projectId },
            include: { applications: true }
        });
        if (!project) return res.status(404).json({ error: 'Project not found' });
        const isOwner = project.ownerId === user.id;
        const isMember = project.applications.some(app => app.userId === user.id && app.status === 'ACCEPTED');

        if (!isOwner && !isMember) return res.status(403).json({ error: 'Access denied' });

        const item = await prisma.checklistItem.create({
            data: {
                content,
                projectId
            }
        });

        res.json(item);
    } catch (error) {
        console.error("Add Item Error:", error);
        res.status(500).json({ error: 'Failed to add item' });
    }
};

// ✅ Toggle Item
export const toggleChecklistItem = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const firebaseUid = req.user?.uid;
        if (!firebaseUid) return res.status(401).json({ error: 'Unauthorized' });

        const item = await prisma.checklistItem.findUnique({ where: { id } });
        if (!item) return res.status(404).json({ error: 'Item not found' });

        const updated = await prisma.checklistItem.update({
            where: { id },
            data: { isChecked: !item.isChecked }
        });

        res.json(updated);
    } catch (error) {
        console.error("Toggle Item Error:", error);
        res.status(500).json({ error: 'Failed to toggle item' });
    }
};

// 🗑️ Delete Item
export const deleteChecklistItem = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const firebaseUid = req.user?.uid;
        if (!firebaseUid) return res.status(401).json({ error: 'Unauthorized' });

        await prisma.checklistItem.delete({ where: { id } });

        res.json({ message: 'Deleted' });
    } catch (error) {
        console.error("Delete Item Error:", error);
        res.status(500).json({ error: 'Failed to delete item' });
    }
};
