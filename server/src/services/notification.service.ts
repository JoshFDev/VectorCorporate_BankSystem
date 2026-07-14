import Notification, { INotification } from '../models/Notification';

interface CreateNotificationData {
    userId: string;
    type: INotification['type'];
    title: string;
    message: string;
    amount?: number;
    accountNumber?: string;
    relatedAccount?: string;
}

export async function createNotification(data: CreateNotificationData): Promise<INotification> {
    return Notification.create({
        userId: data.userId,
        type: data.type,
        title: data.title,
        message: data.message,
        amount: data.amount,
        accountNumber: data.accountNumber,
        relatedAccount: data.relatedAccount,
    });
}

export async function getNotifications(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [notifications, total] = await Promise.all([
        Notification.find({ userId }).sort({ createdAt: -1 }).skip(skip).limit(limit),
        Notification.countDocuments({ userId }),
    ]);
    return { notifications, total, page, pages: Math.ceil(total / limit) };
}

export async function getUnreadCount(userId: string): Promise<number> {
    return Notification.countDocuments({ userId, read: false });
}

export async function markAsRead(userId: string, notificationId: string): Promise<boolean> {
    const result = await Notification.findOneAndUpdate(
        { _id: notificationId, userId },
        { read: true }
    );
    return !!result;
}

export async function markAllAsRead(userId: string): Promise<void> {
    await Notification.updateMany({ userId, read: false }, { read: true });
}
