import { Request, Response } from 'express';
import { PrismaClient, ReportReason } from '@prisma/client';

const prisma = new PrismaClient();

// 🚩 Create a Report
export const createReport = async (req: Request, res: Response) => {
    try {
        const { targetType, targetId, reason, description } = req.body;
        const firebaseUid = req.user?.uid;

        if (!firebaseUid) return res.status(401).json({ error: 'Unauthorized' });

        const user = await prisma.user.findUnique({ where: { firebaseUid } });
        if (!user) return res.status(404).json({ error: 'User not found' });

        const report = await prisma.report.create({
            data: {
                targetType, // "PROJECT" or "USER"
                targetId,
                reason: reason as ReportReason,
                description,
                reporterId: user.id
            }
        });

        // 🔔 Notify Admin? (Future)

        res.status(201).json({ message: 'Report submitted successfully', report });
    } catch (error) {
        console.error("Create Report Error:", error);
        res.status(500).json({ error: 'Failed to create report' });
    }
};

// 🛡️ Get Reports (Admin Only - Placeholder)
export const getReports = async (req: Request, res: Response) => {
    // Implementation for Admin Dashboard
    res.json({ message: "Admin feature not implemented yet" });
};
