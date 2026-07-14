import { Response } from 'express';
import crypto from 'crypto';
import User from '../models/User';
import { AuthRequest } from '../middleware/auth.middleware';

const MIN_TEMPLATE_SIZE = 100;
const MATCH_THRESHOLD = 0.85;

function hashFingerprint(template: Buffer): string {
    return crypto.createHash('sha256').update(template).digest('hex');
}

function calculateSimilarity(a: Buffer, b: Buffer): number {
    if (a.length !== b.length) return 0;
    let matchingBits = 0;
    const totalBits = a.length * 8;
    for (let i = 0; i < a.length; i++) {
        const xor = a[i] ^ b[i];
        matchingBits += 8 - popcount(xor);
    }
    return matchingBits / totalBits;
}

function popcount(n: number): number {
    let count = 0;
    while (n) { count += n & 1; n >>= 1; }
    return count;
}

export async function registerFingerprint(req: AuthRequest, res: Response) {
    try {
        const { fingerprint } = req.body;

        const template = Buffer.from(fingerprint, 'base64');
        if (template.length < MIN_TEMPLATE_SIZE) {
            return res.status(422).json({ error: 'Datos de huella invalidos (muy cortos)' });
        }

        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

        user.fingerprint = Buffer.from(hashFingerprint(template), 'hex');
        await user.save();

        res.json({ message: 'Huella registrada exitosamente' });
    } catch (error) {
        res.status(500).json({ error: 'Error al registrar huella' });
    }
}

export async function verifyFingerprint(req: AuthRequest, res: Response) {
    try {
        const { email, fingerprint } = req.body;

        const user = await User.findOne({ email });
        if (!user) return res.status(401).json({ error: 'Credenciales invalidas' });
        if (!user.fingerprint) return res.status(400).json({ error: 'Usuario no tiene huella registrada' });

        const receivedTemplate = Buffer.from(fingerprint, 'base64');
        if (receivedTemplate.length < MIN_TEMPLATE_SIZE) {
            return res.status(422).json({ error: 'Datos de huella invalidos' });
        }

        const receivedHash = hashFingerprint(receivedTemplate);
        const storedHash = user.fingerprint.toString('hex');

        if (receivedHash === storedHash) {
            return res.json({ message: 'Huella verificada', match: true, confidence: 1.0 });
        }

        const similarity = calculateSimilarity(
            Buffer.from(receivedHash, 'hex'),
            Buffer.from(storedHash, 'hex')
        );

        if (similarity >= MATCH_THRESHOLD) {
            return res.json({ message: 'Huella verificada', match: true, confidence: Math.round(similarity * 100) / 100 });
        }

        return res.status(401).json({ error: 'Huella no coincide', match: false, confidence: Math.round(similarity * 100) / 100 });
    } catch (error) {
        res.status(500).json({ error: 'Error al verificar huella' });
    }
}
