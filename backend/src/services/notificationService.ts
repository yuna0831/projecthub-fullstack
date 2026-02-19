import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface CreateNotificationOptions {
    userId: string;
    message: string;
    type?: 'INFO' | 'SUCCESS' | 'ERROR' | 'WARNING';
    link?: string;
    relatedUserId?: string;
    relatedProjectId?: string;
}

export const createNotification = async (options: CreateNotificationOptions) => {
    try {
        const { userId, message, type = 'INFO', link, relatedUserId, relatedProjectId } = options;

        const notification = await prisma.notification.create({
            data: {
                userId,
                message,
                type,
                link,
                relatedUserId,
                relatedProjectId,
                read: false
            }
        });

        return notification;
    } catch (error) {
        console.error("Error creating notification:", error);
        throw error;
    }
};
