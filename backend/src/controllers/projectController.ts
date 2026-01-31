import { Request, Response } from 'express';
import { PrismaClient, ProjectStatus, LogAction } from '@prisma/client';

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

// 🦡 Get Projects (Public) - Includes Lazy Expiration Check & Pagination
export const getProjects = async (req: Request, res: Response) => {
    try {
        // 🗑️ Lazy Deletion & Expiration (Keep existing logic)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        await prisma.project.deleteMany({
            where: { status: 'CLOSED', updatedAt: { lt: sevenDaysAgo } }
        });
        await prisma.project.updateMany({
            where: { status: 'OPEN', deadline: { lt: new Date() } },
            data: { status: 'CLOSED' }
        });

        // 🔍 Filter & Pagination Logic
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 9;
        const skip = (page - 1) * limit;

        const {
            search, status, tab,
            subject, courseNumber, // Academic
            category // Personal
        } = req.query as any;

        const whereClause: any = {};

        // 1. Status Filter
        // Default to 'OPEN' if not specified, unless they explicitly want 'CLOSED'
        // If query is sent at all by frontend, we respect it.
        // Frontend default state is 'OPEN'.
        if (status) whereClause.status = status;
        else whereClause.status = 'OPEN';

        // 2. Search (Title or Owner Name)
        if (search) {
            whereClause.OR = [
                { title: { contains: search, mode: 'insensitive' } },
                { owner: { name: { contains: search, mode: 'insensitive' } } }
            ];
        }

        // 3. Tabs (Academic / Hackathon / Personal)
        if (tab === 'academic') {
            whereClause.isCourseProject = true;
            if (subject) whereClause.courseCode = { startsWith: subject };
            if (courseNumber) whereClause.courseCode = { contains: courseNumber };
        } else if (tab === 'hackathon') {
            whereClause.hackathonName = { not: null };
        } else if (tab === 'personal') {
            whereClause.isCourseProject = false;
            whereClause.hackathonName = null;
            if (category) whereClause.category = category;
        }

        // Execute Queries
        const [totalCount, projects] = await prisma.$transaction([
            prisma.project.count({ where: whereClause }),
            prisma.project.findMany({
                where: whereClause,
                include: {
                    techStacks: true,
                    owner: { select: { name: true, email: true } }
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit
            })
        ]);

        res.json({
            projects,
            pagination: {
                totalCount,
                totalPages: Math.ceil(totalCount / limit),
                currentPage: page,
                limit
            }
        });

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
                owner: { select: { id: true, name: true, email: true, profileImage: true } },
                techStacks: true,
                roles: true,
            }
        });

        if (!project) return res.status(404).json({ error: 'Project not found' });

        // Check if completion requested
        const completionRequest = await prisma.projectLog.findFirst({
            where: { projectId: id, action: 'COMPLETION_REQUEST' },
            orderBy: { createdAt: 'desc' }
        });

        res.json({ ...project, completionRequested: !!completionRequest });
    } catch (error) {
        console.error('Error fetching project:', error);
        res.status(500).json({ error: 'Failed to fetch project' });
    }
};


// 🦡 Apply to a project
export const applyToProject = async (req: Request, res: Response) => {
    try {
        const { id } = req.params; // Project ID
        const { message, resumeUrl, roleName } = req.body; // Optional message/resume/roleName
        const firebaseUid = req.user?.uid;

        if (!firebaseUid) return res.status(401).json({ error: 'Unauthorized' });

        const user = await prisma.user.findUnique({ where: { firebaseUid } });
        if (!user) return res.status(404).json({ error: 'User not found' });

        // Check if project exists
        const project = await prisma.project.findUnique({ where: { id } });
        if (!project) return res.status(404).json({ error: 'Project not found' });

        if (project.status !== 'OPEN') {
            return res.status(400).json({ error: 'Project is not accepting applications' });
        }

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
                resumeUrl,
                roleName // Save the selected role name
            }
        });

        // 🔔 Notify Project Owner
        console.log(`Creating notification for Owner: ${project.ownerId}`);
        await prisma.notification.create({
            data: {
                userId: project.ownerId,
                message: `📢 New Applicant: ${user.name} applied to "${project.title}"`,
                type: 'INFO',
                link: `/project/${project.id}`
            }
        });

        // 🔔 Notify Applicant (Confirmation)
        console.log(`Creating notification for Applicant: ${user.id}`);
        await prisma.notification.create({
            data: {
                userId: user.id,
                message: `✅ You successfully applied to "${project.title}"`,
                type: 'SUCCESS',
                link: `/dashboard`
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

        res.json({
            applied: !!application,
            status: application?.status // PENDING, ACCEPTED, REJECTED
        });
    } catch (error) {
        console.error("Check Status Error:", error);
        res.status(500).json({ error: 'Failed to check status' });
    }
};

// 🆕 Withdraw Application
export const withdrawApplication = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const firebaseUid = req.user?.uid;
        if (!firebaseUid) return res.status(401).json({ error: 'Unauthorized' });

        const user = await prisma.user.findUnique({ where: { firebaseUid } });
        if (!user) return res.status(404).json({ error: 'User not found' });

        const application = await prisma.application.findUnique({
            where: { projectId_userId: { projectId: id, userId: user.id } }
        });

        if (!application) return res.status(404).json({ error: 'Application not found' });
        if (application.status === 'ACCEPTED') return res.status(400).json({ error: 'Cannot withdraw accepted application. Contact owner.' });

        await prisma.application.delete({
            where: { projectId_userId: { projectId: id, userId: user.id } }
        });

        res.json({ message: 'Application withdrawn successfully' });
    } catch (error) {
        console.error("Withdraw Error:", error);
        res.status(500).json({ error: 'Failed to withdraw' });
    }
};

// 🆕 Update Project Status (StateMachine)
export const updateProjectStatus = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { status } = req.body; // DRAFT, OPEN, FILLED, CLOSED
        const firebaseUid = req.user?.uid;
        if (!firebaseUid) return res.status(401).json({ error: 'Unauthorized' });

        const user = await prisma.user.findUnique({ where: { firebaseUid } });
        if (!user) return res.status(404).json({ error: 'User not found' });

        const project = await prisma.project.findUnique({ where: { id } });
        if (!project) return res.status(404).json({ error: 'Project not found' });
        if (project.ownerId !== user.id) return res.status(403).json({ error: 'Only owner can update status' });

        // Simple State Machine Validation
        const allowedTransitions: Record<string, string[]> = {
            'DRAFT': ['OPEN'],
            'OPEN': ['FILLED', 'CLOSED'],
            'FILLED': ['OPEN', 'CLOSED'],
            'CLOSED': ['OPEN', 'FILLED'], // Can reopen
            'COMPLETED': [] // Terminal state (sort of)
        };

        if (!allowedTransitions[project.status].includes(status)) {
            return res.status(400).json({ error: `Cannot transition from ${project.status} to ${status}` });
        }

        const updated = await prisma.project.update({
            where: { id },
            data: { status }
        });

        // 📝 Log it
        await prisma.projectLog.create({
            data: {
                projectId: id,
                userId: user.id,
                action: 'STATUS_CHANGE',
                metadata: { oldStatus: project.status, newStatus: status }
            }
        });

        res.json(updated);
    } catch (error) {
        console.error("Update Status Error:", error);
        res.status(500).json({ error: 'Failed to update status' });
    }
};

// 🏁 Request Completion (Owner) Or Complete Directly if no members
export const completeProject = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const firebaseUid = req.user?.uid;
        if (!firebaseUid) return res.status(401).json({ error: 'Unauthorized' });

        const user = await prisma.user.findUnique({ where: { firebaseUid } });
        if (!user) return res.status(404).json({ error: 'User not found' });

        const project = await prisma.project.findUnique({ where: { id }, include: { applications: true } });
        if (!project) return res.status(404).json({ error: 'Project not found' });
        if (project.ownerId !== user.id) return res.status(403).json({ error: 'Only owner can request completion' });

        if (project.status === 'COMPLETED') return res.status(400).json({ error: 'Project already completed' });

        const members = project.applications.filter(app => app.status === 'ACCEPTED');

        // Case 1: No members -> Complete Immediately
        if (members.length === 0) {
            const updated = await prisma.project.update({
                where: { id },
                data: { status: 'COMPLETED', completedAt: new Date() }
            });
            await prisma.projectLog.create({
                data: { projectId: id, userId: user.id, action: 'STATUS_CHANGE', metadata: { newStatus: 'COMPLETED', method: 'DIRECT' } }
            });
            return res.json({ message: 'Project completed', project: updated });
        }

        // Case 2: Members exist -> Request Confirmation
        // Check if already requested?
        const existingRequest = await prisma.projectLog.findFirst({
            where: { projectId: id, action: 'COMPLETION_REQUEST' },
            orderBy: { createdAt: 'desc' }
        });

        if (existingRequest) {
            // Maybe allow re-request to notify again?
        }

        await prisma.projectLog.create({
            data: { projectId: id, userId: user.id, action: 'COMPLETION_REQUEST' }
        });

        // Notify Members
        for (const member of members) {
            await prisma.notification.create({
                data: {
                    userId: member.userId,
                    message: `🏁 Owner requested to complete "${project.title}". Please confirm.`,
                    type: 'WARNING',
                    link: `/project/${id}`
                }
            });
        }

        res.json({ message: 'Completion requested. Members must confirm.' });
    } catch (error) {
        console.error("Complete Project Error:", error);
        res.status(500).json({ error: 'Failed to request completion' });
    }
};

// ✅ Confirm Completion (Member)
export const confirmCompletion = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const firebaseUid = req.user?.uid;
        if (!firebaseUid) return res.status(401).json({ error: 'Unauthorized' });

        const user = await prisma.user.findUnique({ where: { firebaseUid } });
        if (!user) return res.status(404).json({ error: 'User not found' });

        // Check Membership
        const app = await prisma.application.findUnique({
            where: { projectId_userId: { projectId: id, userId: user.id } }
        });
        if (!app || app.status !== 'ACCEPTED') return res.status(403).json({ error: 'Not a member' });

        // Check if Request Exists
        const requestLog = await prisma.projectLog.findFirst({
            where: { projectId: id, action: 'COMPLETION_REQUEST' },
            orderBy: { createdAt: 'desc' }
        });
        if (!requestLog) return res.status(400).json({ error: 'No active completion request' });

        // Record Vote
        await prisma.projectLog.create({
            data: {
                projectId: id,
                userId: user.id,
                action: 'COMPLETION_CONFIRM',
                metadata: { originalRequestId: requestLog.id }
            }
        });

        // Check Votes
        const project = await prisma.project.findUnique({ where: { id }, include: { applications: true } });
        const members = project!.applications.filter(a => a.status === 'ACCEPTED');

        const confirms = await prisma.projectLog.groupBy({
            by: ['userId'],
            where: {
                projectId: id,
                action: 'COMPLETION_CONFIRM',
                createdAt: { gt: requestLog.createdAt }
            }
        });

        const confirmCount = confirms.length;
        // Logic: Greater than 50%
        if (confirmCount > members.length / 2) {
            const updated = await prisma.project.update({
                where: { id },
                data: { status: 'COMPLETED', completedAt: new Date() }
            });

            // Notify Everyone
            const uniqueUserIds = new Set([project!.ownerId, ...members.map(m => m.userId)]);
            for (const uid of uniqueUserIds) {
                await prisma.notification.create({
                    data: {
                        userId: uid,
                        message: `🏆 Project "${project!.title}" is officially COMPLETED!`,
                        type: 'SUCCESS',
                        link: `/project/${id}`
                    }
                });
            }
            return res.json({ message: 'Project completed successfully', project: updated });
        }

        res.json({ message: 'Confirmation recorded. Waiting for more votes.', current: confirmCount, required: Math.floor(members.length / 2) + 1 });

    } catch (error) {
        console.error("Confirm Error:", error);
        res.status(500).json({ error: 'Failed to confirm' });
    }
};
