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

export async function getFingerprintStatus(req: AuthRequest, res: Response) {
    try {
        const user = await User.findById(req.user._id).select('fingerprint');
        if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

        res.json({ registered: !!user.fingerprint });
    } catch (error) {
        res.status(500).json({ error: 'Error al consultar estado de huella' });
    }
}

export async function registerFingerprint(req: AuthRequest, res: Response) {
    try {
        const { fingerprint } = req.body;

        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

        const sensorId = fingerprint;
        user.fingerprint = Buffer.from(sensorId, 'utf-8');
        await user.save();

        res.json({ message: 'Huella registrada exitosamente' });
    } catch (error) {
        res.status(500).json({ error: 'Error al registrar huella' });
    }
}

export async function removeFingerprint(req: AuthRequest, res: Response) {
    try {
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
        if (!user.fingerprint) return res.status(400).json({ error: 'No tienes huella registrada' });

        user.fingerprint = null;
        await user.save();

        res.json({ message: 'Huella eliminada exitosamente' });
    } catch (error) {
        res.status(500).json({ error: 'Error al eliminar huella' });
    }
}

export async function compareFingerprints(req: AuthRequest, res: Response) {
    try {
        const { fingerprint1, fingerprint2 } = req.body;

        const template1 = Buffer.from(fingerprint1, 'base64');
        const template2 = Buffer.from(fingerprint2, 'base64');

        if (template1.length < MIN_TEMPLATE_SIZE || template2.length < MIN_TEMPLATE_SIZE) {
            return res.status(422).json({ error: 'Datos de huella invalidos', match: false, confidence: 0 });
        }

        const hash1 = hashFingerprint(template1);
        const hash2 = hashFingerprint(template2);

        if (hash1 === hash2) {
            return res.json({ message: 'Huellas coinciden', match: true, confidence: 1.0 });
        }

        const similarity = calculateSimilarity(
            Buffer.from(hash1, 'hex'),
            Buffer.from(hash2, 'hex')
        );

        const match = similarity >= MATCH_THRESHOLD;

        res.json({
            message: match ? 'Huellas coinciden' : 'Huellas no coinciden',
            match,
            confidence: Math.round(similarity * 100) / 100,
        });
    } catch (error) {
        res.status(500).json({ error: 'Error al comparar huellas' });
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
