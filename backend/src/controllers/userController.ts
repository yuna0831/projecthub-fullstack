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

    // 🛡️ Double Check: Domain Restriction
    if (!email.toLowerCase().endsWith('@wisc.edu')) {
      const existingUser = await prisma.user.findUnique({ where: { firebaseUid: uid } });
      if (!existingUser) {
        return res.status(403).json({ error: "Access Denied: Only @wisc.edu emails are allowed for new accounts." });
      }
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

    // 🏅 Badge Checks (Sync-time)
    const badges = new Set(user.badges);
    let updated = false;

    // 1. Verified @wisc.edu
    if (email.endsWith('@wisc.edu') && !badges.has('VERIFIED_STUDENT')) {
      badges.add('VERIFIED_STUDENT');
      updated = true;
    }

    // 2. Active This Semester (Simple Logic: If syncing, they are active)
    if (!badges.has('ACTIVE_USER')) {
      badges.add('ACTIVE_USER');
      updated = true;
    }

    if (updated) {
      await prisma.user.update({
        where: { id: user.id },
        data: { badges: Array.from(badges), lastActiveAt: new Date() }
      });
    } else {
      // Just update activity
      await prisma.user.update({
        where: { id: user.id },
        data: { lastActiveAt: new Date() }
      });
    }

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
      : `🚫 Your application for "${application.project.title}" was not successful.`;

    await prisma.notification.create({
      data: {
        userId: application.userId,
        message,
        type: status === 'ACCEPTED' ? 'SUCCESS' : 'INFO',
        link: `/dashboard`
      }
    });

    // 🏅 Badge: Team Member (If Accepted)
    if (status === 'ACCEPTED') {
      const applicant = await prisma.user.findUnique({ where: { id: application.userId } });
      if (applicant && !applicant.badges.includes('TEAM_MEMBER')) {
        await prisma.user.update({
          where: { id: applicant.id },
          data: { badges: { push: 'TEAM_MEMBER' } }
        });
      }
    }

    // 🔒 Rigid Completion Logic: Check if all roles are filled
    if (status === 'ACCEPTED') {
      const projectWithRoles = await prisma.project.findUnique({
        where: { id: application.projectId },
        include: {
          roles: true,
          applications: {
            where: { status: 'ACCEPTED' }
          }
        }
      });

      if (projectWithRoles) {
        let allFilled = true;

        // Check each role
        for (const role of projectWithRoles.roles) {
          const acceptedCount = projectWithRoles.applications.filter(app => app.roleName === role.name).length;
          if (acceptedCount < role.count) {
            allFilled = false;
            break;
          }
        }

        if (allFilled) {
          // Close Project
          await prisma.project.update({
            where: { id: application.projectId },
            data: { status: 'CLOSED' } // Assuming 'CLOSED' is a valid enum value from Schema
          });

          // Notify Owner
          await prisma.notification.create({
            data: {
              userId: projectWithRoles.ownerId,
              message: `🏁 Project Closed: All positions for "${projectWithRoles.title}" have been filled!`,
              type: 'SUCCESS',
              link: `/project/${projectWithRoles.id}`
            }
          });
          console.log(`Project ${projectWithRoles.id} auto-closed.`);
        }
      }
    }

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
    const {
      bio, githubUrl, linkedinUrl, portfolioUrl, techStacks, workStyles,
      futureRole, major, year, name, profileImage, coverImage,
      contactEmail, discordId // New fields
    } = req.body;

    if (!firebaseUid) return res.status(401).json({ error: 'Unauthorized' });

    // Validate if arrays
    const validTechStacks = Array.isArray(techStacks) ? techStacks : [];
    const validWorkStyles = Array.isArray(workStyles) ? workStyles : [];

    const updatedUser = await prisma.user.update({
      where: { firebaseUid },
      data: {
        bio,
        githubUrl,
        linkedinUrl,
        portfolioUrl,
        techStacks: validTechStacks,
        workStyles: validWorkStyles,
        futureRole,
        major,
        year,
        name,
        profileImage,
        coverImage,
        contactEmail,
        discordId
      }
    });

    res.json({ message: 'Profile updated successfully', user: updatedUser });
  } catch (error) {
    console.error("Update Profile Error:", error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
};

// 🔒 Toggle Privacy
export const togglePrivacy = async (req: Request, res: Response) => {
  try {
    const firebaseUid = req.user?.uid;
    if (!firebaseUid) return res.status(401).json({ error: 'Unauthorized' });

    const user = await prisma.user.findUnique({ where: { firebaseUid } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { isContactVisible: !user.isContactVisible }
    });

    res.json({ message: 'Privacy setting updated', isContactVisible: updated.isContactVisible });
  } catch (error) {
    console.error("Toggle Privacy Error:", error);
    res.status(500).json({ error: 'Failed to toggle privacy' });
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

// 🔍 Get User Profile by ID (Public Read-Only)
export const getUserById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const requesterUid = req.user?.uid; // Optional: requester might be viewing

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        experiences: true,
        educations: true,
      }
    });

    if (!user) return res.status(404).json({ error: 'User not found' });

    // Privacy Logic
    const isOwner = requesterUid && (await prisma.user.findUnique({ where: { firebaseUid: requesterUid } }))?.id === user.id;

    if (!isOwner && !user.isContactVisible) {
      // Mask specific fields
      (user as any).email = null;
      (user as any).contactEmail = null;
      (user as any).discordId = null;
      // Keep GitHub/LinkedIn public
    }

    res.json(user);
  } catch (error) {
    console.error("Get User Error:", error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
};
