import { Request, Response, NextFunction } from 'express';
import admin from '../config/firebase';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Extend Express Request type to include user
declare global {
    namespace Express {
        interface Request {
            user?: admin.auth.DecodedIdToken;
        }
    }
}

// Middleware to verify Firebase ID Token
export const verifyToken = async (req: Request, res: Response, next: NextFunction) => {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }

    try {
        const decodedToken = await admin.auth().verifyIdToken(token);

        // 🛡️ Security Check: Wisc-Only & Verified Email
        const email = (decodedToken.email || "").toLowerCase();
        const firebaseUid = decodedToken.uid;

        const isWiscEmail = email.endsWith("@wisc.edu");

        if (!isWiscEmail) {
            // Check if user already exists in our DB (Legacy User)
            const existingUser = await prisma.user.findUnique({
                where: { firebaseUid }
            });

            if (!existingUser) {
                return res.status(403).json({
                    error: "Access Denied: Only @wisc.edu emails are allowed for new accounts.",
                    code: "DOMAIN_RESTRICTED"
                });
            }
        }

        req.user = decodedToken;
        next();
    } catch (error) {
        console.error('Verify Token Error:', error);
        return res.status(403).json({ error: 'Unauthorized: Invalid token' });
    }
};
