import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 🌟 Create Peer Review (Only if Project is COMPLETED)
export const createPeerReview = async (req: Request, res: Response) => {
    try {
        const { projectId } = req.params;
        const { revieweeId, badge, comment } = req.body;
        const firebaseUid = req.user?.uid;

        if (!firebaseUid) return res.status(401).json({ error: 'Unauthorized' });

        const reviewer = await prisma.user.findUnique({ where: { firebaseUid } });
        if (!reviewer) return res.status(404).json({ error: 'User not found' });

        // 1. Check Project Status
        const project = await prisma.project.findUnique({ where: { id: projectId } });
        if (!project) return res.status(404).json({ error: 'Project not found' });

        if (project.status !== 'COMPLETED') {
            return res.status(400).json({ error: 'Project must be marked as COMPLETED before leaving reviews.' });
        }

        // 2. Check if already reviewed
        const existingReview = await prisma.peerReview.findUnique({
            where: {
                reviewerId_revieweeId_projectId: {
                    reviewerId: reviewer.id,
                    revieweeId,
                    projectId
                }
            }
        });

        if (existingReview) {
            return res.status(400).json({ error: 'You have already reviewed this member for this project.' });
        }

        // 3. Create Review
        const review = await prisma.peerReview.create({
            data: {
                reviewerId: reviewer.id,
                revieweeId,
                projectId,
                badge, // Ensure BadgeType matches enum
                comment
            }
        });

        // 🔔 Notify Reviewee
        await prisma.notification.create({
            data: {
                userId: revieweeId,
                message: `🌟 You received a "${badge}" badge from ${reviewer.name}!`,
                type: 'SUCCESS',
                link: `/profile`
            }
        });

        res.status(201).json(review);

    } catch (error) {
        console.error("Create Review Error:", error);
        res.status(500).json({ error: 'Failed to submit review' });
    }
};

// 📜 Get Reviews for a Project (Optional, for displaying status)
export const getProjectReviews = async (req: Request, res: Response) => {
    try {
        const { projectId } = req.params;
        const reviews = await prisma.peerReview.findMany({
            where: { projectId },
            include: {
                reviewer: { select: { name: true } },
                reviewee: { select: { name: true } }
            }
        });
        res.json(reviews);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching reviews' });
    }
};

// 🏅 Get User Badges (Count)
export const getUserBadges = async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;
        const reviews = await prisma.peerReview.findMany({
            where: { revieweeId: userId }
        });

        // Aggregate badges
        const badgeCounts: Record<string, number> = {};
        reviews.forEach(r => {
            badgeCounts[r.badge] = (badgeCounts[r.badge] || 0) + 1;
        });

        res.json(badgeCounts);
    } catch (error) {
        console.error("Get Badges Error:", error);
        res.status(500).json({ error: 'Failed to fetch badges' });
    }
};
