import mongoose, { Schema, Document } from 'mongoose';

export interface IAccount extends Document {
    userId: mongoose.Types.ObjectId;
    accountNumber: string;
    type: 'savings' | 'checking';
    balance: number;
    currency: string;
    isActive: boolean;
    createdAt: Date;
}

const accountSchema = new Schema<IAccount>({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    accountNumber: {
        type: String,
        required: true,
        unique: true
    },
    type: {
        type: String,
        enum: ['savings', 'checking'],
        required: true,
        default: 'savings'
    },
    balance: {
        type: Number,
        required: true,
        default: 0
    },
    currency: {
        type: String,
        default: 'GTQ'
    },
    isActive: {
        type: Boolean,
        default: true
    },
    createdAt: { type: Date, default: Date.now }
});

accountSchema.index({ userId: 1 });
accountSchema.index({ accountNumber: 1 }, { unique: true });
accountSchema.index({ userId: 1, type: 1 });
accountSchema.index({ createdAt: -1 });

export default mongoose.model<IAccount>('Account', accountSchema);