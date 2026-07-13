import { z } from 'zod';

export const createAccountSchema = z.object({
    type: z.enum(['savings', 'checking']).optional().default('savings'),
    currency: z.string().optional().default('GTQ'),
});
