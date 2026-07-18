import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';

export async function hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
}

export function generateToken(userId: string): string {
    return jwt.sign({ id: userId }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES } as jwt.SignOptions);
}

export function generateRefreshToken(userId: string): string {
    return jwt.sign({ id: userId, type: 'refresh' }, env.JWT_REFRESH_SECRET, { expiresIn: env.JWT_REFRESH_EXPIRES } as jwt.SignOptions);
}

export function verifyRefreshToken(token: string): { id: string } | null {
    try {
        const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET) as { id: string; type: string };
        if (decoded.type !== 'refresh') return null;
        return { id: decoded.id };
    } catch {
        return null;
    }
}