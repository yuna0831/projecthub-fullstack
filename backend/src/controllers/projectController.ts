import { Request, Response } from 'express';
import { PrismaClient, ProjectStatus, LogAction } from '@prisma/client';
import { createNotification } from '../services/notificationService';
import { sendEmail } from '../services/emailService';

const prisma = new PrismaClient();

export const createProject = async (req: Request, res: Response) => {
    try {
        const {
            title, description, content, role, techStacks, // 'role' maps to roles array
            meetingType, location, duration, deadline, contactUrl,
            courseCode, semester, isCourseProject, // 🦡 BadgerMatch Fields
            category, // 🦡 New Category
            hackathonName, hackathonDate, // 🏆 Hackathon Fields
            screeningQuestions // 🆕
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

                    screeningQuestions: screeningQuestions || [], // 🆕

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

            // 🏅 Badge: Project Creator
            const userBadges = user.badges || [];
            if (!userBadges.includes('PROJECT_CREATOR')) {
                await tx.user.update({
                    where: { id: user.id },
                    data: { badges: { push: 'PROJECT_CREATOR' } }
                });
            }

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
            hackathonName, hackathonDate,
            screeningQuestions // 🆕
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

                screeningQuestions: screeningQuestions || [], // 🆕

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
                applications: { where: { status: 'ACCEPTED' }, select: { userId: true } } // 🆕 Need to know members count for UI
            }
        });

        if (!project) return res.status(404).json({ error: 'Project not found' });

        // Calculate Voting Status for UI
        const memberCount = project.applications.length; // Accepted applications
        const totalVoters = memberCount + 1; // + Owner
        const voteCount = project.completionVotes.length;
        const requiredVotes = Math.floor(totalVoters / 2) + 1;

        // Check if completion requested
        const completionRequest = await prisma.projectLog.findFirst({
            where: { projectId: id, action: 'COMPLETION_REQUEST' },
            orderBy: { createdAt: 'desc' }
        });

        res.json({
            ...project,
            completionRequested: project.completionRequested || !!completionRequest,
            voting: { current: voteCount, required: requiredVotes, total: totalVoters } // 🆕
        });
    } catch (error) {
        console.error('Error fetching project:', error);
        res.status(500).json({ error: 'Failed to fetch project' });
    }
};


// 🦡 Apply to a project
export const applyToProject = async (req: Request, res: Response) => {
    try {
        const { id } = req.params; // Project ID
        const { message, resumeUrl, roleName, answers } = req.body; // 🆕 answers
        const firebaseUid = req.user?.uid;

        if (!firebaseUid) return res.status(401).json({ error: 'Unauthorized' });

        const user = await prisma.user.findUnique({ where: { firebaseUid } });
        if (!user) return res.status(404).json({ error: 'User not found' });

        // Check if project exists
        const project = await prisma.project.findUnique({
            where: { id },
            include: { owner: true } // Need owner email
        });
        if (!project) return res.status(404).json({ error: 'Project not found' });

        if (project.ownerId === user.id) {
            return res.status(400).json({ error: 'You cannot apply to your own project' });
        }

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
                roleName,
                answers: answers ?? {}
            } as any
        });

        // 🔔 Notification Logic (Async)
        (async () => {
            try {
                // 1. In-App Notification (Owner)
                await createNotification({
                    userId: project.ownerId,
                    message: `📢 New Applicant: ${user.name} applied to "${project.title}"`,
                    type: 'INFO',
                    relatedUserId: user.id,
                    relatedProjectId: project.id,
                    link: `/project/${project.id}`
                });

                // 2. Email Notification (Owner)
                if (project.owner.email) {
                    await sendEmail({
                        to: project.owner.email,
                        subject: `[MadCollab] New Application for ${project.title}`,
                        html: `
                            <h2>New Applicant: ${user.name}</h2>
                            <p><strong>Project:</strong> ${project.title}</p>
                            <p><strong>Role:</strong> ${roleName || 'General'}</p>
                            <p><strong>Message:</strong> ${message || 'No message provided.'}</p>
                            <br/>
                            <a href="http://localhost:3000/project/${project.id}" style="padding: 10px 20px; background-color: #c5050c; color: white; text-decoration: none; border-radius: 5px;">View Application</a>
                        `
                    });
                }

                // 3. In-App Notification (Applicant Confirmation)
                await createNotification({
                    userId: user.id,
                    message: `✅ You successfully applied to "${project.title}"`,
                    type: 'SUCCESS',
                    link: `/dashboard`
                });

            } catch (err) {
                console.error("Notification Error:", err);
            }
        })();

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

        // 🆕 Force Update DB State
        await prisma.project.update({
            where: { id },
            data: { completionRequested: true }
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

        // Fetch Project & Members
        const project = await prisma.project.findUnique({
            where: { id },
            include: { applications: { where: { status: 'ACCEPTED' }, include: { user: true } } }
        });

        if (!project) return res.status(404).json({ error: 'Project not found' });

        // Verify Membership (Owner or Member)
        const isOwner = project.ownerId === user.id;
        const isMember = project.applications.some(app => app.userId === user.id);

        if (!isOwner && !isMember) return res.status(403).json({ error: 'Not a member of this project' });

        // Add Vote (Idempotent)
        const currentVotes = new Set(project.completionVotes);
        if (!currentVotes.has(user.id)) {
            currentVotes.add(user.id);
            await prisma.project.update({
                where: { id },
                data: { completionVotes: Array.from(currentVotes) }
            });
        }

        // Check Consensus
        // Voters = Owner + Accepted Members
        const allMemberIds = new Set([project.ownerId, ...project.applications.map(app => app.userId)]);
        const totalVoters = allMemberIds.size;
        const voteCount = currentVotes.size + (currentVotes.has(user.id) ? 0 : 1); // Optimistic count if we just added

        const majorityThreshold = Math.floor(totalVoters / 2) + 1;

        if (voteCount >= majorityThreshold) {
            // 🚀 AUTOMATION: Transaction for Completion
            await prisma.$transaction(async (tx) => {
                // 1. Update Project Status
                await tx.project.update({
                    where: { id },
                    data: { status: 'COMPLETED', completedAt: new Date() }
                });

                // 2. Award Badges & Increment Count for ALL Participants
                for (const memberId of allMemberIds) {
                    const member = await tx.user.findUnique({ where: { id: memberId } });
                    if (!member) continue;

                    const newCount = member.completedProjectCount + 1;
                    const newBadges = new Set(member.badges);

                    // Award 'COMPLETED_PRO' badge if 1st completion
                    if (newCount >= 1) newBadges.add('COMPLETED_PRO');

                    await tx.user.update({
                        where: { id: memberId },
                        data: {
                            completedProjectCount: { increment: 1 },
                            badges: Array.from(newBadges)
                        }
                    });

                    // Notification
                    await tx.notification.create({
                        data: {
                            userId: memberId,
                            message: `🏆 Victory! Project "${project.title}" is officially COMPLETED! You earned a completion point.`,
                            type: 'SUCCESS',
                            link: `/project/${id}`
                        }
                    });
                }
            });

            return res.json({
                message: 'Consensus reached! Project marked as COMPLETED. Badges awarded.',
                status: 'COMPLETED'
            });
        }

        res.json({
            message: `Vote recorded. Progress: ${voteCount}/${totalVoters} (Need ${majorityThreshold})`,
            current: voteCount,
            required: majorityThreshold
        });

    } catch (error) {
        console.error("Confirm Error:", error);
        res.status(500).json({ error: 'Failed to confirm' });
    }
};
// 🗑️ Delete Project
export const deleteProject = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const firebaseUid = req.user?.uid;
        if (!firebaseUid) return res.status(401).json({ error: 'Unauthorized' });

        const user = await prisma.user.findUnique({ where: { firebaseUid } });
        if (!user) return res.status(404).json({ error: 'User not found' });

        const project = await prisma.project.findUnique({ where: { id } });
        if (!project) return res.status(404).json({ error: 'Project not found' });

        if (project.ownerId !== user.id) {
            return res.status(403).json({ error: 'Only the owner can delete this project' });
        }

        await prisma.project.delete({ where: { id } });

        res.json({ message: 'Project deleted successfully' });
    } catch (error) {
        console.error("Delete Project Error:", error);
        res.status(500).json({ error: 'Failed to delete project' });
    }
};

// ❤️ Toggle Bookmark
export const toggleBookmark = async (req: Request, res: Response) => {
    try {
        const { id } = req.params; // Project ID
        const firebaseUid = req.user?.uid;
        if (!firebaseUid) return res.status(401).json({ error: 'Unauthorized' });

        const user = await prisma.user.findUnique({ where: { firebaseUid } });
        if (!user) return res.status(404).json({ error: 'User not found' });

        const project = await prisma.project.findUnique({ where: { id } });
        if (!project) return res.status(404).json({ error: 'Project not found' });

        const existingBookmark = await prisma.bookmark.findUnique({
            where: {
                userId_projectId: {
                    userId: user.id,
                    projectId: id
                }
            }
        });

        if (existingBookmark) {
            await prisma.bookmark.delete({
                where: {
                    userId_projectId: {
                        userId: user.id,
                        projectId: id
                    }
                }
            });
            return res.json({ message: 'Bookmark removed', bookmarked: false });
        } else {
            await prisma.bookmark.create({
                data: {
                    userId: user.id,
                    projectId: id
                }
            });
            return res.json({ message: 'Project bookmarked', bookmarked: true });
        }
    } catch (error) {
        console.error("Toggle Bookmark Error:", error);
        res.status(500).json({ error: 'Failed to toggle bookmark' });
    }
};

// 📚 Get Bookmarked Projects
export const getBookmarks = async (req: Request, res: Response) => {
    try {
        const firebaseUid = req.user?.uid;
        if (!firebaseUid) return res.status(401).json({ error: 'Unauthorized' });

        const user = await prisma.user.findUnique({ where: { firebaseUid } });
        if (!user) return res.status(404).json({ error: 'User not found' });

        const bookmarks = await prisma.bookmark.findMany({
            where: { userId: user.id },
            include: {
                project: {
                    include: {
                        owner: { select: { name: true, email: true } },
                        techStacks: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        const projects = bookmarks.map(b => b.project);
        res.json(projects);
    } catch (error) {
        console.error("Get Bookmarks Error:", error);
        res.status(500).json({ error: 'Failed to fetch bookmarks' });
    }
};
