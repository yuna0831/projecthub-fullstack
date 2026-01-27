import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const createProject = async (req: Request, res: Response) => {
    try {
        const {
            title, description, content, role, techStacks, // 'role' maps to roles array
            meetingType, location, duration, deadline, contactUrl,
            courseCode, semester, isCourseProject, // 🦡 BadgerMatch Fields
            category, // 🦡 New Category
            hackathonName, hackathonDate // 🏆 Hackathon Fields
        } = req.body;
        const firebaseUid = req.user?.uid;

        if (!firebaseUid) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const result = await prisma.$transaction(async (tx) => {
            const user = await tx.user.findUnique({
                where: { firebaseUid },
            });

            if (!user) {
                throw new Error('User not found in database. Please login again.');
            }

            // Create Project
            const newProject = await tx.project.create({
                data: {
                    title, description, content, ownerId: user.id,
                    meetingType, location, duration, deadline: deadline ? new Date(deadline) : null, contactUrl,
                    category: category || "IT/Development",

                    // 🦡 BadgerMatch Data
                    courseCode, semester, isCourseProject: Boolean(isCourseProject),

                    // 🏆 Hackathon Fields
                    hackathonName,
                    hackathonDate: hackathonDate ? new Date(hackathonDate) : null,

                    // Handle TechStacks
                    techStacks: {
                        connectOrCreate: (techStacks || []).map((stackName: string) => ({
                            where: { name: stackName },
                            create: { name: stackName },
                        })),
                    },
                    // Handle Project Roles (1:N)
                    roles: {
                        create: (role || []).map((r: any) => ({
                            name: r.name,
                            count: Number(r.count),
                            skills: r.skills || []
                        }))
                    }
                },
                include: {
                    techStacks: true,
                    roles: true
                },
            });

            return newProject;
        });

        res.status(201).json({ message: 'Project created successfully', project: result });
    } catch (error: any) {
        console.error('Error creating project:', error);
        res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
};

// 🦡 Update Project
export const updateProject = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const {
            title, description, content, role, techStacks,
            meetingType, location, duration, deadline, contactUrl,
            courseCode, semester, isCourseProject, category,
            hackathonName, hackathonDate
        } = req.body;
        const firebaseUid = req.user?.uid;

        if (!firebaseUid) return res.status(401).json({ error: 'Unauthorized' });

        const user = await prisma.user.findUnique({ where: { firebaseUid } });
        if (!user) return res.status(404).json({ error: 'User not found' });

        const project = await prisma.project.findUnique({ where: { id } });
        if (!project) return res.status(404).json({ error: 'Project not found' });

        if (project.ownerId !== user.id) {
            return res.status(403).json({ error: 'You are not the owner of this project' });
        }

        const projectDeadline = deadline ? new Date(deadline) : null;

        const updated = await prisma.project.update({
            where: { id },
            data: {
                title, description, content,
                meetingType, location, duration, deadline: projectDeadline, contactUrl,
                courseCode, semester, isCourseProject: Boolean(isCourseProject),
                category,
                hackathonName,
                hackathonDate: hackathonDate ? new Date(hackathonDate) : null,

                // Update Tech Stacks
                techStacks: {
                    set: [], // Clear existing relations
                    connectOrCreate: (techStacks || []).map((stackName: string) => ({
                        where: { name: stackName },
                        create: { name: stackName },
                    })),
                },
                // Update Roles: Delete all and re-create for simplicity
                roles: {
                    deleteMany: {},
                    create: (role || []).map((r: any) => ({
                        name: r.name,
                        count: Number(r.count),
                        skills: r.skills || []
                    }))
                }
            },
            include: { techStacks: true, roles: true }
        });

        res.json(updated);
    } catch (error: any) {
        console.error('Error updating project:', error);
        res.status(500).json({ error: 'Failed to update project' });
    }
};

// 🦡 Get Projects (Public) - Includes Lazy Expiration Check
export const getProjects = async (req: Request, res: Response) => {
    try {
        // 🕰️ Lazy Expiration: Close accumulated expired projects
        await prisma.project.updateMany({
            where: {
                status: 'OPEN',
                deadline: { lt: new Date() } // Deadline has passed
            },
            data: { status: 'CLOSED' }
        });

        const projects = await prisma.project.findMany({
            include: {
                techStacks: true,
                owner: {
                    select: { name: true, email: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(projects);
    } catch (error) {
        console.error('Error fetching projects:', error);
        res.status(500).json({ error: 'Failed to fetch projects' });
    }
};

// 🦡 Get Single Project
export const getProjectById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const project = await prisma.project.findUnique({
            where: { id },
            include: {
                owner: { select: { id: true, name: true, email: true } },
                techStacks: true,
                roles: true,
            }
        });

        if (!project) return res.status(404).json({ error: 'Project not found' });

        res.json(project);
    } catch (error) {
        console.error('Error fetching project:', error);
        res.status(500).json({ error: 'Failed to fetch project' });
    }
};


// 🦡 Apply to a project
export const applyToProject = async (req: Request, res: Response) => {
    try {
        const { id } = req.params; // Project ID
        const { message, resumeUrl, role } = req.body; // Optional message/resume/role
        const firebaseUid = req.user?.uid;

        if (!firebaseUid) return res.status(401).json({ error: 'Unauthorized' });

        const user = await prisma.user.findUnique({ where: { firebaseUid } });
        if (!user) return res.status(404).json({ error: 'User not found' });

        // Check if project exists
        const project = await prisma.project.findUnique({ where: { id } });
        if (!project) return res.status(404).json({ error: 'Project not found' });

        // Check if already applied
        const existingApp = await prisma.application.findUnique({
            where: {
                projectId_userId: {
                    projectId: id,
                    userId: user.id
                }
            }
        });

        if (existingApp) {
            return res.status(400).json({ error: 'Already applied to this project' });
        }

        // Create Application
        const application = await prisma.application.create({
            data: {
                projectId: id,
                userId: user.id,
                message,
                resumeUrl
            }
        });

        // 🔔 Notify Project Owner
        await prisma.notification.create({
            data: {
                userId: project.ownerId,
                message: `📢 New Applicant: ${user.name} applied to "${project.title}"`,
                type: 'INFO',
                link: `/project/${project.id}`
            }
        });

        res.status(201).json({ message: 'Application submitted successfully', application });
    } catch (error) {
        console.error("Apply Error:", error);
        res.status(500).json({ error: 'Failed to apply' });
    }
};

// 🦡 Get Applicants (Owner Only)
export const getProjectApplications = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const firebaseUid = req.user?.uid;

        if (!firebaseUid) return res.status(401).json({ error: 'Unauthorized' });

        const user = await prisma.user.findUnique({ where: { firebaseUid } });
        if (!user) return res.status(404).json({ error: 'User not found' });

        // Verify Ownership
        const project = await prisma.project.findUnique({ where: { id } });
        if (!project) return res.status(404).json({ error: 'Project not found' });

        if (project.ownerId !== user.id) {
            return res.status(403).json({ error: 'Only the project owner can view applicants' });
        }

        const applications = await prisma.application.findMany({
            where: { projectId: id },
            include: {
                user: {
                    select: { id: true, name: true, email: true, major: true, year: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json(applications);
    } catch (error) {
        console.error("Fetch Applicants Error:", error);
        res.status(500).json({ error: 'Failed to fetch applicants' });
    }
};

// 🦡 Check Application Status
export const checkApplicationStatus = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const firebaseUid = req.user?.uid;

        if (!firebaseUid) return res.status(401).json({ error: 'Unauthorized' });

        const user = await prisma.user.findUnique({ where: { firebaseUid } });
        if (!user) return res.status(404).json({ error: 'User not found' });

        const application = await prisma.application.findUnique({
            where: {
                projectId_userId: {
                    projectId: id,
                    userId: user.id
                }
            }
        });

        res.json({ applied: !!application });
    } catch (error) {
        console.error("Check Status Error:", error);
        res.status(500).json({ error: 'Failed to check status' });
    }
};
