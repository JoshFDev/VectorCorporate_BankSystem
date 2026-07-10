import { Request, Response, NextFunction } from 'express';

export class AppError extends Error {
    statusCode: number;
    constructor(message: string, statusCode: number) {
        super(message);
        this.statusCode = statusCode;
    }
}

export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction) {
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Error interno del servidor';
    console.error(`[ERROR] ${statusCode}: ${message}`);
    res.status(statusCode).json({
        error: message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
}