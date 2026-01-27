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
    // Also fetch relations
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
      include: {
        experiences: true,
        educations: true
      }
    });

    res.status(200).json({ message: 'User synced successfully', user });
  } catch (error) {
    console.error('Error syncing user:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// 📊 Get Dashboard Data (Owned Projects & My Applications)
export const getDashboardData = async (req: Request, res: Response) => {
  try {
    const firebaseUid = req.user?.uid;
    if (!firebaseUid) return res.status(401).json({ error: 'Unauthorized' });

    const user = await prisma.user.findUnique({ where: { firebaseUid } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    // 1. Projects I Manage (Owner)
    const ownedProjects = await prisma.project.findMany({
      where: { ownerId: user.id },
      include: {
        applications: {
          include: {
            user: {
              select: { id: true, name: true, email: true, major: true, year: true }
            }
          },
          orderBy: { createdAt: 'desc' }
        },
        _count: { select: { applications: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    // 2. Projects I Applied To
    const myApplications = await prisma.application.findMany({
      where: { userId: user.id },
      include: {
        project: {
          select: { id: true, title: true, status: true, ownerId: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ ownedProjects, myApplications });
  } catch (error) {
    console.error("Dashboard Data Error:", error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
};

// 📝 Update Application Status (Accept/Reject)
export const updateApplicationStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params; // Application ID
    const { status } = req.body; // 'ACCEPTED' | 'REJECTED'
    const firebaseUid = req.user?.uid;

    if (!firebaseUid) return res.status(401).json({ error: 'Unauthorized' });

    const user = await prisma.user.findUnique({ where: { firebaseUid } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Fetch Application + Project info to check ownership
    const application = await prisma.application.findUnique({
      where: { id },
      include: { project: true }
    });

    if (!application) return res.status(404).json({ error: 'Application not found' });

    // Verify Owner
    if (application.project.ownerId !== user.id) {
      return res.status(403).json({ error: 'Permission denied. You do not own this project.' });
    }

    // Update Status
    const updated = await prisma.application.update({
      where: { id },
      data: { status }
    });

    // 🔔 Notify Applicant
    const message = status === 'ACCEPTED'
      ? `🎉 Congratulations! You were accepted to "${application.project.title}".`
      : `Update on your application for "${application.project.title}".`;

    await prisma.notification.create({
      data: {
        userId: application.userId,
        message,
        type: status === 'ACCEPTED' ? 'SUCCESS' : 'INFO',
        link: `/dashboard`
      }
    });

    res.json({ message: `Application ${status.toLowerCase()}`, application: updated });

  } catch (error) {
    console.error("Update Status Error:", error);
    res.status(500).json({ error: 'Failed to update application status' });
  }
};

// 👤 Update User Profile
export const updateProfile = async (req: Request, res: Response) => {
  try {
    const firebaseUid = req.user?.uid;
    const { bio, githubUrl, linkedinUrl, portfolioUrl, techStacks, major, year, name, profileImage, coverImage } = req.body;

    if (!firebaseUid) return res.status(401).json({ error: 'Unauthorized' });

    // Validate if techStacks is array
    const validTechStacks = Array.isArray(techStacks) ? techStacks : [];

    const updatedUser = await prisma.user.update({
      where: { firebaseUid },
      data: {
        bio,
        githubUrl,
        linkedinUrl,
        portfolioUrl,
        techStacks: validTechStacks,
        major,
        year,
        name,
        profileImage,
        coverImage
      }
    });

    res.json({ message: 'Profile updated successfully', user: updatedUser });
  } catch (error) {
    console.error("Update Profile Error:", error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
};

// 🎓 Add Education
export const addEducation = async (req: Request, res: Response) => {
  try {
    const firebaseUid = req.user?.uid;
    const { school, degree, major, graduationYear } = req.body;
    if (!firebaseUid) return res.status(401).json({ error: 'Unauthorized' });

    const user = await prisma.user.findUnique({ where: { firebaseUid } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const edu = await prisma.education.create({
      data: {
        userId: user.id,
        school, degree, major, graduationYear
      }
    });
    res.json(edu);
  } catch (error) {
    console.error("Add Edu Error:", error);
    res.status(500).json({ error: 'Failed' });
  }
};

// 💼 Add Experience
export const addExperience = async (req: Request, res: Response) => {
  try {
    const firebaseUid = req.user?.uid;
    const { title, company, startDate, endDate, description } = req.body;
    if (!firebaseUid) return res.status(401).json({ error: 'Unauthorized' });

    const user = await prisma.user.findUnique({ where: { firebaseUid } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const exp = await prisma.experience.create({
      data: {
        userId: user.id,
        title, company, startDate, endDate, description
      }
    });

    res.json(exp);
  } catch (error) {
    console.error("Add Exp Error:", error);
    res.status(500).json({ error: 'Failed' });
  }
};

// 🗑️ Delete Items (Generic or Separate)
export const deleteProfileItem = async (req: Request, res: Response) => {
  try {
    const { type, id } = req.params; // type: 'edu' or 'exp'
    const firebaseUid = req.user?.uid;
    if (!firebaseUid) return res.status(401).json({ error: 'Unauthorized' });

    const user = await prisma.user.findUnique({ where: { firebaseUid } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (type === 'edu') {
      await prisma.education.deleteMany({ where: { id, userId: user.id } });
    } else if (type === 'exp') {
      await prisma.experience.deleteMany({ where: { id, userId: user.id } });
    } else {
      return res.status(400).json({ error: 'Invalid type' });
    }

    res.json({ message: 'Deleted' });
  } catch (error) {
    console.error("Delete Error:", error);
    res.status(500).json({ error: 'Failed' });
  }
};

// 🔔 Get Notifications
export const getNotifications = async (req: Request, res: Response) => {
  try {
    const firebaseUid = req.user?.uid;
    if (!firebaseUid) return res.status(401).json({ error: 'Unauthorized' });

    const user = await prisma.user.findUnique({ where: { firebaseUid } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const notifications = await prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 20 // Limit to last 20
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
