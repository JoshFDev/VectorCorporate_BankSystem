import { z } from 'zod';

export const registerSchema = z.object({
    name: z.string().min(2, 'Nombre debe tener al menos 2 caracteres'),
    email: z.string().email('Email invalido'),
    password: z.string().min(6, 'Contraseña debe tener al menos 6 caracteres'),
    dni: z.string().min(1, 'CURP/DNI requerido'),
    phone: z.string().min(7, 'Telefono invalido'),
    address: z.string().optional().default(''),
    dateOfBirth: z.string().min(1, 'Fecha de nacimiento requerida'),
    nationality: z.string().optional().default('Guatemala'),
    occupation: z.string().optional().default(''),
});

export const loginSchema = z.object({
    email: z.string().email('Email invalido'),
    password: z.string().min(1, 'Password requerido'),
});

export const loginFingerprintSchema = z.object({
    email: z.string().email('Email invalido'),
    sensorPosition: z.coerce.number().int().min(0, 'Posicion del sensor requerida'),
});

export const changePasswordSchema = z.object({
    currentPassword: z.string().min(1, 'Contraseña actual requerida'),
    newPassword: z.string().min(6, 'Nueva contraseña debe tener al menos 6 caracteres'),
});

export const forgotPasswordSchema = z.object({
    email: z.string().email('Email invalido'),
});

export const resetPasswordSchema = z.object({
    token: z.string().min(1, 'Token requerido'),
    newPassword: z.string().min(6, 'Nueva contraseña debe tener al menos 6 caracteres'),
});

export const refreshTokenSchema = z.object({
    refreshToken: z.string().min(1, 'Refresh token requerido'),
});
