import { Response } from 'express';
import User from '../models/User';
import Account from '../models/Account';
import { AuthRequest } from '../middleware/auth.middleware';
import { logAudit } from '../services/audit.service';

export async function getMe(req: AuthRequest, res: Response) {
    try {
        const user = await User.findById(req.user._id).select('-password');
        if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

        const accounts = await Account.find({ userId: user._id });
        res.json({
            user: { id: user._id, name: user.name, email: user.email, dni: user.dni, phone: user.phone, address: user.address, dateOfBirth: user.dateOfBirth, nationality: user.nationality, occupation: user.occupation, role: user.role, isVerified: user.isVerified, createdAt: user.createdAt, hasPhoto: !!user.photo, emailNotifications: user.emailNotifications },
            accounts: accounts.map(a => ({ number: a.accountNumber, type: a.type, balance: a.balance, currency: a.currency, isActive: a.isActive }))
        });
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener perfil' });
    }
}

export async function getMyAccounts(req: AuthRequest, res: Response) {
    try {
        const accounts = await Account.find({ userId: req.user._id });
        res.json({ accounts: accounts.map(a => ({ number: a.accountNumber, type: a.type, balance: a.balance, currency: a.currency, isActive: a.isActive, createdAt: a.createdAt })) });
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener cuentas' });
    }
}

export async function updateMe(req: AuthRequest, res: Response) {
    try {
        const allowedFields = ['name', 'phone', 'address', 'occupation'];
        const updates: any = {};
        for (const field of allowedFields) { if (req.body[field] !== undefined) updates[field] = req.body[field]; }

        const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true }).select('-password');
        if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

        await logAudit({ userId: user._id.toString(), action: 'update_profile', detail: `Perfil actualizado: ${JSON.stringify(updates)}`, ipAddress: req.ip, userAgent: req.headers['user-agent'], metadata: updates });

        res.json({ message: 'Perfil actualizado', user: { id: user._id, name: user.name, email: user.email, phone: user.phone, address: user.address, occupation: user.occupation } });
    } catch (error) {
        res.status(500).json({ error: 'Error al actualizar perfil' });
    }
}

export async function deactivateMe(req: AuthRequest, res: Response) {
    try {
        const accounts = await Account.find({ userId: req.user._id, isActive: true });
        if (accounts.length > 0) return res.status(400).json({ error: 'Debe cerrar todas sus cuentas activas primero' });

        await User.findByIdAndUpdate(req.user._id, { isActive: false });
        await logAudit({ userId: req.user._id.toString(), action: 'delete_account', detail: 'Usuario desactivado', ipAddress: req.ip, userAgent: req.headers['user-agent'], metadata: {} });

        res.json({ message: 'Usuario desactivado exitosamente' });
    } catch (error) {
        res.status(500).json({ error: 'Error al desactivar usuario' });
    }
}

export async function uploadPhoto(req: AuthRequest, res: Response) {
    try {
        const { photo } = req.body;
        const buffer = Buffer.from(photo.replace(/^data:image\/\w+;base64,/, ''), 'base64');
        await User.findByIdAndUpdate(req.user._id, { photo: buffer });
        res.json({ message: 'Foto actualizada', hasPhoto: true });
    } catch (error) {
        res.status(500).json({ error: 'Error al actualizar foto' });
    }
}

export async function getPhoto(req: AuthRequest, res: Response) {
    try {
        const user = await User.findById(req.params.id).select('photo');
        if (!user || !user.photo) return res.status(404).json({ error: 'Foto no encontrada' });
        res.set('Content-Type', 'image/jpeg');
        res.send(user.photo);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener foto' });
    }
}

export async function updateNotificationPreferences(req: AuthRequest, res: Response) {
    try {
        const { emailNotifications } = req.body;
        const user = await User.findByIdAndUpdate(
            req.user._id,
            { emailNotifications },
            { new: true }
        ).select('-password');
        if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

        res.json({ message: 'Preferencias actualizadas', emailNotifications: user.emailNotifications });
    } catch (error) {
        res.status(500).json({ error: 'Error al actualizar preferencias' });
    }
}
