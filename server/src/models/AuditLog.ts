import mongoose, { Schema, Document } from 'mongoose';

export interface IAuditLog extends Document {
    userId: mongoose.Types.ObjectId | null;
    action: 'register' | 'login' | 'deposit' | 'withdrawal' | 'transfer' | 'update_profile' | 'delete_account' | 'verify_user' | 'role_change' | 'admin_action';
    detail: string;
    ipAddress: string;
    userAgent: string;
    metadata: Record<string, any>;
    createdAt: Date;
}

const auditLogSchema = new Schema<IAuditLog>({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    action: {
        type: String,
        enum: ['register', 'login', 'deposit', 'withdrawal', 'transfer', 'update_profile', 'delete_account', 'verify_user', 'role_change', 'admin_action'],
        required: true
    },
    detail: { type: String, required: true },
    ipAddress: { type: String, default: '0.0.0.0' },
    userAgent: { type: String, default: '' },
    metadata: { type: Schema.Types.Mixed, default: {} },
    createdAt: { type: Date, default: Date.now }
});

export default mongoose.model<IAuditLog>('AuditLog', auditLogSchema);