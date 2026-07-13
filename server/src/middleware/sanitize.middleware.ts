import { Request, Response, NextFunction } from 'express';

const DANGEROUS_KEYS = /^\$|^__/;

function sanitize(obj: any): void {
    if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
        for (const key of Object.keys(obj)) {
            if (DANGEROUS_KEYS.test(key)) {
                delete obj[key];
            } else {
                sanitize(obj[key]);
            }
        }
    }
    if (Array.isArray(obj)) {
        obj.forEach(sanitize);
    }
}

export function mongoSanitize(req: Request, _res: Response, next: NextFunction): void {
    if (req.body) sanitize(req.body);
    if (req.query) sanitize(req.query);
    if (req.params) sanitize(req.params);
    next();
}
