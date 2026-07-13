import { z } from 'zod';

export const changeRoleSchema = z.object({
    role: z.enum(['client', 'teller', 'supervisor', 'admin']),
});

export const paginationSchema = z.object({
    page: z.coerce.number().int().positive().optional().default(1),
    limit: z.coerce.number().int().positive().max(100).optional().default(20),
    search: z.string().optional().default(''),
    role: z.string().optional().default(''),
});
