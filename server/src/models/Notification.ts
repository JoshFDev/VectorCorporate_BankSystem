import mongoose, { Schema, Document } from 'mongoose';

export interface INotification extends Document {
    userId: mongoose.Types.ObjectId;
    type: 'deposit' | 'withdrawal' | 'transfer_in' | 'transfer_out' | 'security' | 'system';
    title: string;
    message: string;
    amount?: number;
    accountNumber?: string;
    relatedAccount?: string;
    read: boolean;
    createdAt: Date;
}

const notificationSchema = new Schema<INotification>({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['deposit', 'withdrawal', 'transfer_in', 'transfer_out', 'security', 'system'], required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    amount: { type: Number },
    accountNumber: { type: String },
    relatedAccount: { type: String },
    read: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
});

notificationSchema.index({ userId: 1, read: 1 });
notificationSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model<INotification>('Notification', notificationSchema);
