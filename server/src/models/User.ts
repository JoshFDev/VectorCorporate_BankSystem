import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
    name: string;
    email: string;
    password: string;
    photo: Buffer | null;
    fingerprint: Buffer | null;
    // -- Datos personales --
    dni: string;
    // Documento unico de identidad (DPI, cedula, pasaporte)
    phone: string;
    address: string;
    dateOfBirth: Date;
    nationality: string;
    occupation: string;
    // -- Datos del sistema --
    role: 'client' | 'admin' | 'teller' | 'supervisor';
    isVerified: boolean;
    twoFactorEnabled: boolean;
    lastLogin: Date | null;
    createdAt: Date;
    updatedAt: Date;
    isActive: boolean;
}

const userSchema = new Schema<IUser>({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    photo: { type: Buffer, default: null },
    fingerprint: { type: Buffer, default: null },
    // --- Nuevos campos ---
    dni: {
        type: String,
        required: true,
        unique: true
        // El DPI debe ser unico, no pueden repetirse
    },
    phone: { type: String, required: true },
    address: { type: String, default: '' },
    dateOfBirth: { type: Date, required: true },
    nationality: {
        type: String,
        default: 'Guatemala'
        // Usaremos restcountries API para validar
    },
    occupation: { type: String, default: '' },
    role: {
        type: String,
        enum: ['client', 'teller', 'supervisor', 'admin'],
        default: 'client'
        // Por defecto todos son clientes
    },
    isVerified: {
        type: Boolean,
        default: false
        // Se vuelve true cuando el admin verifica sus documentos
    },
    twoFactorEnabled: {
        type: Boolean,
        default: false
    },
    lastLogin: {
        type: Date,
        default: null
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    isActive: { type: Boolean, default: true },
});

export default mongoose.model<IUser>('User', userSchema);