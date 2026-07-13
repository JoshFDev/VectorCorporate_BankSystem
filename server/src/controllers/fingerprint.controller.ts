import { Response } from 'express';
import User from '../models/User';
import { AuthRequest } from '../middleware/auth.middleware';

export async function registerFingerprint(req: AuthRequest, res: Response) {
    try {
        const { fingerprint } = req.body;
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

        user.fingerprint = Buffer.from(fingerprint, 'base64');
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

        const receivedBuffer = Buffer.from(fingerprint, 'base64');
        const isMatch = user.fingerprint.equals(receivedBuffer);

        if (!isMatch) return res.status(401).json({ error: 'Huella no coincide' });

        res.json({ message: 'Huella verificada', match: true });
    } catch (error) {
        res.status(500).json({ error: 'Error al verificar huella' });
    }
}
