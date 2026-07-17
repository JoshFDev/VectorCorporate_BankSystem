import mongoose, { Schema, Document } from 'mongoose';

export interface IRecurringPayment extends Document {
    userId: mongoose.Types.ObjectId;
    fromAccountNumber: string;
    toAccountNumber: string;
    amount: number;
    description: string;
    category: string;
    frequency: 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly';
    nextExecuteAt: Date;
    lastExecuteAt: Date | null;
    isActive: boolean;
    executionCount: number;
    createdAt: Date;
}

const recurringPaymentSchema = new Schema<IRecurringPayment>({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    fromAccountNumber: {
        type: String,
        required: true
    },
    toAccountNumber: {
        type: String,
        required: true
    },
    amount: {
        type: Number,
        required: true,
        min: 0.01
    },
    description: {
        type: String,
        default: ''
    },
    category: {
        type: String,
        default: 'general'
    },
    frequency: {
        type: String,
        enum: ['weekly', 'biweekly', 'monthly', 'quarterly', 'yearly'],
        required: true
    },
    nextExecuteAt: {
        type: Date,
        required: true
    },
    lastExecuteAt: {
        type: Date,
        default: null
    },
    isActive: {
        type: Boolean,
        default: true
    },
    executionCount: {
        type: Number,
        default: 0
    },
    createdAt: { type: Date, default: Date.now }
});

recurringPaymentSchema.index({ userId: 1 });
recurringPaymentSchema.index({ nextExecuteAt: 1, isActive: 1 });

export default mongoose.model<IRecurringPayment>('RecurringPayment', recurringPaymentSchema);
