
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 🏅 Give a Review (Badge)
export const createReview = async (req: Request, res: Response) => {
    try {
        const { projectId } = req.params;
        const { revieweeId, badge, comment } = req.body; // badge: 'CODE_WIZARD' | 'DEADLINE_FAIRY' | 'COMMUNICATION_KING'
        const firebaseUid = req.user?.uid;

        if (!firebaseUid) return res.status(401).json({ error: 'Unauthorized' });

        const reviewer = await prisma.user.findUnique({ where: { firebaseUid } });
        if (!reviewer) return res.status(404).json({ error: 'User not found' });

        // Validation: 
        // 1. Both must be members of the project
        // 2. Project must be COMPLETED (optional, but requested in prompt "when project becomes COMPLETED")
        // Let's enforce project status check or at least membership check.

        const project = await prisma.project.findUnique({
            where: { id: projectId },
            include: { applications: true }
        });

        if (!project) return res.status(404).json({ error: 'Project not found' });

        if (project.status !== 'COMPLETED') {
            return res.status(400).json({ error: 'Reviews can only be given for completed projects.' });
        }

        // Check membership (Reviewer)
        const isOwner = project.ownerId === reviewer.id;
        const isMember = project.applications.some(app => app.userId === reviewer.id && app.status === 'ACCEPTED');
        if (!isOwner && !isMember) return res.status(403).json({ error: 'You are not a member of this project.' });

        // Check Duplicate
        const existing = await prisma.peerReview.findUnique({
            where: {
                reviewerId_revieweeId_projectId: {
                    reviewerId: reviewer.id,
                    revieweeId,
                    projectId
                }
            }
        });

        if (existing) return res.status(400).json({ error: 'You have already reviewed this member.' });

        // Create Review
        const review = await prisma.peerReview.create({
            data: {
                projectId,
                reviewerId: reviewer.id,
                revieweeId,
                badge,
                comment
            }
        });

        res.status(201).json(review);

    } catch (error) {
        console.error("Create Review Error:", error);
        res.status(500).json({ error: 'Failed to submit review' });
    }
};

// 🏆 Get User Badges
export const getUserBadges = async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;

        // Aggregate counts per badge type
        const badges = await prisma.peerReview.groupBy({
            by: ['badge'],
            where: { revieweeId: userId },
            _count: {
                badge: true
            }
        });

        // Format: { CODE_WIZARD: 3, ... }
        const result = badges.reduce((acc: any, curr) => {
            acc[curr.badge] = curr._count.badge;
            return acc;
        }, {});

        res.json(result);
    } catch (error) {
        console.error("Get Badges Error:", error);
        res.status(500).json({ error: 'Failed to fetch badges' });
    }
};
