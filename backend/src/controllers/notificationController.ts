import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 🔔 Get Notifications
export const getNotifications = async (req: Request, res: Response) => {
    try {
        const firebaseUid = req.user?.uid;
        if (!firebaseUid) return res.status(401).json({ error: 'Unauthorized' });

        const user = await prisma.user.findUnique({ where: { firebaseUid } });
        if (!user) return res.status(404).json({ error: 'User not found' });

        // 🕰️ Lazy Cleanup: Delete notifications older than 14 days
        const twoWeeksAgo = new Date();
        twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

        await prisma.notification.deleteMany({
            where: {
                userId: user.id,
                createdAt: { lt: twoWeeksAgo }
            }
        });

        const notifications = await prisma.notification.findMany({
            where: { userId: user.id },
            orderBy: { createdAt: 'desc' },
            take: 20 // Limit to recent 20
        });

        res.json(notifications);
    } catch (error) {
        console.error("Get Notifications Error:", error);
        res.status(500).json({ error: 'Failed' });
    }
};

// 🔔 Mark Notification Read
export const markNotificationRead = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const firebaseUid = req.user?.uid;
        if (!firebaseUid) return res.status(401).json({ error: 'Unauthorized' });

        const user = await prisma.user.findUnique({ where: { firebaseUid } });
        if (!user) return res.status(404).json({ error: 'User not found' });

        await prisma.notification.updateMany({
            where: { id, userId: user.id }, // Ensure ownership
            data: { read: true }
        });

        res.json({ success: true });
    } catch (error) {
        console.error("Mark Read Error:", error);
        res.status(500).json({ error: 'Failed' });
    }
};
