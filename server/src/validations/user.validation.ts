import { z } from 'zod';

export const updateProfileSchema = z.object({
    name: z.string().min(2).optional(),
    phone: z.string().min(7).optional(),
    address: z.string().optional(),
    occupation: z.string().optional(),
});

export const photoSchema = z.object({
    photo: z.string().min(1, 'Imagen en base64 requerida'),
});
