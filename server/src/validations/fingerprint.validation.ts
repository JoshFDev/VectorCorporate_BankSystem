import { z } from 'zod';

export const registerFingerprintSchema = z.object({
    fingerprint: z.string().min(1, 'ID de sensor requerido'),
});

export const compareFingerprintsSchema = z.object({
    fingerprint1: z.string().min(1, 'Primera huella requerida'),
    fingerprint2: z.string().min(1, 'Segunda huella requerida'),
});

export const verifyFingerprintSchema = z.object({
    email: z.string().email('Email invalido'),
    fingerprint: z.string().min(1, 'Datos de huella requeridos'),
});
