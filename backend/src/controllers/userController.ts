import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const syncUser = async (req: Request, res: Response) => {
  try {
    const { uid, email, name, picture } = req.body;

    // req.user is already verified by middleware
    if (req.user?.uid !== uid) {
      return res.status(403).json({ error: 'Forbidden: UID mismatch' });
    }

    // Upsert: Create if new, Update if exists
    const user = await prisma.user.upsert({
      where: { firebaseUid: uid },
      update: {
        email: email,
        name: name,
        // picture: picture // Add picture field to schema later if needed
      },
      create: {
        firebaseUid: uid,
        email: email,
        name: name,
        role: 'USER',
      },
    });

    res.status(200).json({ message: 'User synced successfully', user });
  } catch (error) {
    console.error('Error syncing user:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
