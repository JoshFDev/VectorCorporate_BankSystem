import mongoose, { Schema, Document } from 'mongoose';

export interface IBeneficiary extends Document {
    userId: mongoose.Types.ObjectId;
    name: string;
    accountNumber: string;
    alias: string;
    bank: string;
    createdAt: Date;
}

const beneficiarySchema = new Schema<IBeneficiary>({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    accountNumber: {
        type: String,
        required: true,
        trim: true
    },
    alias: {
        type: String,
        default: '',
        trim: true
    },
    bank: {
        type: String,
        default: 'VectorBank'
    },
    createdAt: { type: Date, default: Date.now }
});

beneficiarySchema.index({ userId: 1 });
beneficiarySchema.index({ userId: 1, accountNumber: 1 }, { unique: true });

export default mongoose.model<IBeneficiary>('Beneficiary', beneficiarySchema);
