import mongoose, { Schema, Document } from 'mongoose';

export interface IAuditLog extends Document {
    userId: mongoose.Types.ObjectId | null;
    action: 'register' | 'login' | 'deposit' | 'withdrawal' | 'transfer' | 'update_profile' | 'delete_account';
    detail: string;
    // Descripcion de lo que se hizo
    ipAddress: string;
    // Direccion IP desde donde se hizo la accion
    userAgent: string;
    // Navegador o cliente usado
    metadata: Record<string, any>;
    // Datos extra (ej: monto, cuenta origen/destino)
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
        enum: ['register', 'login', 'deposit', 'withdrawal', 'transfer', 'update_profile', 'delete_account'],
        required: true
    },
    detail: { type: String, required: true },
    ipAddress: { type: String, default: '0.0.0.0' },
    userAgent: { type: String, default: '' },
    metadata: { type: Schema.Types.Mixed, default: {} },
    createdAt: { type: Date, default: Date.now }
});

export default mongoose.model<IAuditLog>('AuditLog', auditLogSchema);