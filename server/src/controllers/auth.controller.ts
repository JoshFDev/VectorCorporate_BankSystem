import { Response } from 'express';
import crypto from 'crypto';
import User from '../models/User';
import Account from '../models/Account';
import { hashPassword, comparePassword, generateToken } from '../services/auth';
import { validateEmail } from '../services/validation';
import { generateAccountNumber } from '../services/account.service';
import { logAudit } from '../services/audit.service';
import { sendPasswordResetEmail } from '../services/email.service';
import { AuthRequest } from '../middleware/auth.middleware';

export async function register(req: AuthRequest, res: Response) {
    try {
        const { name, email, password, dni, phone, address, dateOfBirth, nationality, occupation } = req.body;

        const emailCheck = await validateEmail(email);
        if (!emailCheck.valid) return res.status(400).json({ error: emailCheck.message });

        if (await User.findOne({ email })) return res.status(409).json({ error: 'Email ya registrado' });

        const hashedPassword = await hashPassword(password);
        const user = new User({ name, email, password: hashedPassword, dni, phone, address, dateOfBirth: new Date(dateOfBirth), nationality, occupation });
        await user.save();

        const accountNumber = await generateAccountNumber();
        const account = new Account({ userId: user._id, accountNumber, type: 'savings', balance: 0, currency: 'GTQ' });
        await account.save();

        await logAudit({ userId: user._id.toString(), action: 'register', detail: `Usuario ${name} registrado con cuenta ${accountNumber}`, ipAddress: req.ip, userAgent: req.headers['user-agent'], metadata: { email, accountNumber } });

        const token = generateToken(user._id.toString());
        res.status(201).json({ message: 'Usuario creado exitosamente', token, user: { id: user._id, name: user.name, email: user.email }, account: { number: account.accountNumber, type: account.type, balance: account.balance } });
    } catch (error) {
        res.status(500).json({ error: 'Error al registrar usuario' });
    }
}

export async function login(req: AuthRequest, res: Response) {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(401).json({ error: 'Credenciales invalidas' });

        if (!await comparePassword(password, user.password)) return res.status(401).json({ error: 'Credenciales invalidas' });

        user.lastLogin = new Date();
        await user.save();

        await logAudit({ userId: user._id.toString(), action: 'login', detail: `Inicio de sesion: ${email}`, ipAddress: req.ip, userAgent: req.headers['user-agent'], metadata: { email } });

        const token = generateToken(user._id.toString());
        res.json({ message: 'Inicio de sesion exitoso', token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
    } catch (error) {
        res.status(500).json({ error: 'Error al iniciar sesion' });
    }
}

export async function changePassword(req: AuthRequest, res: Response) {
    try {
        const { currentPassword, newPassword } = req.body;
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

        if (!await comparePassword(currentPassword, user.password)) return res.status(401).json({ error: 'Contraseña actual incorrecta' });

        user.password = await hashPassword(newPassword);
        await user.save();

        await logAudit({ userId: user._id.toString(), action: 'update_profile', detail: 'Contraseña cambiada', ipAddress: req.ip, userAgent: req.headers['user-agent'], metadata: {} });
        res.json({ message: 'Contraseña actualizada exitosamente' });
    } catch (error) {
        res.status(500).json({ error: 'Error al cambiar contraseña' });
    }
}

export async function forgotPassword(req: AuthRequest, res: Response) {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.json({ message: 'Si el correo existe, recibiras un enlace de recuperacion' });

        const token = crypto.randomBytes(32).toString('hex');
        user.resetPasswordToken = token;
        user.resetPasswordExpires = new Date(Date.now() + 3600000);
        await user.save();

        try { await sendPasswordResetEmail(email, token); } catch (e) { console.error('Email send failed:', (e as Error).message); }

        res.json({ message: 'Si el correo existe, recibiras un enlace de recuperacion', ...(process.env.NODE_ENV === 'development' && { token }) });
    } catch (error) {
        res.status(500).json({ error: 'Error al enviar correo de recuperacion' });
    }
}

export async function resetPassword(req: AuthRequest, res: Response) {
    try {
        const { token, newPassword } = req.body;
        const user = await User.findOne({ resetPasswordToken: token, resetPasswordExpires: { $gt: new Date() } });
        if (!user) return res.status(400).json({ error: 'Token invalido o expirado' });

        user.password = await hashPassword(newPassword);
        user.resetPasswordToken = null;
        user.resetPasswordExpires = null;
        await user.save();

        await logAudit({ userId: user._id.toString(), action: 'update_profile', detail: 'Contrasena restablecida via email', ipAddress: req.ip, userAgent: req.headers['user-agent'], metadata: {} });
        res.json({ message: 'Contrasena actualizada exitosamente' });
    } catch (error) {
        res.status(500).json({ error: 'Error al restablecer contrasena' });
    }
}
