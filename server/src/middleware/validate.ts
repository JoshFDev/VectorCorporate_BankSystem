import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

export function validate(schema: ZodSchema) {
    return (req: Request, res: Response, next: NextFunction) => {
        const result = schema.safeParse(req.body);
        if (!result.success) {
            const errors = result.error.flatten().fieldErrors;
            const firstError = Object.values(errors)[0]?.[0] || 'Datos invalidos';
            return res.status(422).json({ error: firstError, errors });
        }
        req.body = result.data;
        next();
    };
}
