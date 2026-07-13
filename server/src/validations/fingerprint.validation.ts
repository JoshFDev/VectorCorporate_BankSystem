import { z } from 'zod';

export const registerFingerprintSchema = z.object({
    fingerprint: z.string().min(1, 'Datos de huella requeridos'),
});

export const verifyFingerprintSchema = z.object({
    email: z.string().email('Email invalido'),
    fingerprint: z.string().min(1, 'Datos de huella requeridos'),
});
