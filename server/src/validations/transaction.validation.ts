import { z } from 'zod';

export const depositSchema = z.object({
    accountNumber: z.string().min(1, 'Numero de cuenta requerido'),
    amount: z.number().positive('El monto debe ser mayor a 0'),
    description: z.string().optional().default(''),
});

export const withdrawSchema = z.object({
    accountNumber: z.string().min(1, 'Numero de cuenta requerido'),
    amount: z.number().positive('El monto debe ser mayor a 0'),
    description: z.string().optional().default(''),
});

export const transferSchema = z.object({
    fromAccount: z.string().min(1, 'Cuenta origen requerida'),
    toAccount: z.string().min(1, 'Cuenta destino requerida'),
    amount: z.number().positive('El monto debe ser mayor a 0'),
    description: z.string().optional().default(''),
});
