import mongoose, { Schema, Document } from 'mongoose';

export interface ITransaction extends Document {
    accountId: mongoose.Types.ObjectId;
    // Cuenta a la que pertenece esta transaccion
    type: 'deposit' | 'withdrawal' | 'transfer_in' | 'transfer_out';
    // deposit: deposito, withdrawal: retiro
    // transfer_in: transferencia recibida
    // transfer_out: transferencia enviada
    amount: number;
    // Monto de la transaccion (siempre positivo)
    description: string;
    // Descripcion opcional (ej: "Pago de servicios")
    category: string;
    // Categoria del gasto: food, transport, services, entertainment, health, education, shopping, general
    relatedAccount: mongoose.Types.ObjectId | null;
    // Si es transferencia, la cuenta destino/origen
    balanceBefore: number;
    // Saldo de la cuenta ANTES de la transaccion
    balanceAfter: number;
    // Saldo de la cuenta DESPUES de la transaccion
    createdAt: Date;
}

const transactionSchema = new Schema<ITransaction>({
    accountId: {
        type: Schema.Types.ObjectId,
        ref: 'Account',
        required: true
    },
    type: {
        type: String,
        enum: ['deposit', 'withdrawal', 'transfer_in', 'transfer_out'],
        required: true
    },
    amount: {
        type: Number,
        required: true,
        min: 0.01
        // No puede ser 0 ni negativo
    },
    description: {
        type: String,
        default: ''
    },
    category: {
        type: String,
        default: 'general',
        enum: ['food', 'transport', 'services', 'entertainment', 'health', 'education', 'shopping', 'salary', 'transfer', 'general']
    },
    relatedAccount: {
        type: Schema.Types.ObjectId,
        ref: 'Account',
        default: null
    },
    balanceBefore: {
        type: Number,
        required: true
    },
    balanceAfter: {
        type: Number,
        required: true
    },
    createdAt: { type: Date, default: Date.now }
});

transactionSchema.index({ accountId: 1, createdAt: -1 });
transactionSchema.index({ type: 1 });
transactionSchema.index({ createdAt: -1 });

export default mongoose.model<ITransaction>('Transaction', transactionSchema);