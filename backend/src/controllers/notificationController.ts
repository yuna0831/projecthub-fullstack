import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Get Notifications
export const getNotifications = async (req: Request, res: Response) => {
    try {
        const firebaseUid = req.user?.uid;
        if (!firebaseUid) return res.status(401).json({ error: 'Unauthorized' });

        const user = await prisma.user.findUnique({ where: { firebaseUid } });
        if (!user) return res.status(404).json({ error: 'User not found' });

        const notifications = await prisma.notification.findMany({
            where: { userId: user.id },
            orderBy: { createdAt: 'desc' },
            take: 20 // Limit to recent 20
        });

        res.json(notifications);
    } catch (error) {
        console.error("Get Notifications Error:", error);
        res.status(500).json({ error: 'Failed to fetch notifications' });
    }
};

// Mark as Read
export const markNotificationRead = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const firebaseUid = req.user?.uid;
        if (!firebaseUid) return res.status(401).json({ error: 'Unauthorized' });

        const user = await prisma.user.findUnique({ where: { firebaseUid } });
        if (!user) return res.status(404).json({ error: 'User not found' });

        // Verify ownership
        const notification = await prisma.notification.findUnique({ where: { id } });
        if (!notification) return res.status(404).json({ error: 'Notification not found' });

        if (notification.userId !== user.id) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        const updated = await prisma.notification.update({
            where: { id },
            data: { read: true }
        });

        res.json(updated);
    } catch (error) {
        console.error("Mark Read Error:", error);
        res.status(500).json({ error: 'Failed to mark notification as read' });
    }
};
