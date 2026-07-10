import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

export async function hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
}

export function generateToken(userId: string): string {
    const secret = process.env.JWT_SECRET || 'vectorbank_secret_key';
    return jwt.sign({ id: userId }, secret, { expiresIn: '24h' });
}