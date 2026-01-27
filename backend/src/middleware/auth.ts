import { Request, Response, NextFunction } from 'express';
import admin from '../config/firebase';

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
        const email = decodedToken.email || "";
        const isWiscEmail = email.endsWith("@wisc.edu");

        // Note: We enforce @wisc.edu, but we CANNOT enforce emailVerified strictly 
        // if users are just verifying. But the requirements said "Login ok, features blocked".
        // The middleware blocks API access. So features ARE blocked.
        const isVerified = decodedToken.email_verified;

        if (!isWiscEmail) {
            return res.status(403).json({ error: "Access Denied: Only @wisc.edu emails are allowed." });
        }

        if (!isVerified) {
            return res.status(403).json({ error: "Access Denied: Please verify your email address first." });
        }

        req.user = decodedToken;
        next();
    } catch (error) {
        console.error('Verify Token Error:', error);
        return res.status(403).json({ error: 'Unauthorized: Invalid token' });
    }
};
