import AuditLog from '../models/AuditLog';

interface AuditParams {
    userId?: string;
    action: string;
    detail: string;
    ipAddress?: string;
    userAgent?: string;
    metadata?: Record<string, any>;
}

export async function logAudit(params: AuditParams): Promise<void> {
    const log = new AuditLog({
        userId: params.userId,
        action: params.action,
        detail: params.detail,
        ipAddress: params.ipAddress || '0.0.0.0',
        userAgent: params.userAgent || '',
        metadata: params.metadata || {}
    });
    await log.save();
}