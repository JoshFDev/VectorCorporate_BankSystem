import { Response } from 'express';
import crypto from 'crypto';
import User from '../models/User';
import Account from '../models/Account';
import { hashPassword, comparePassword, generateToken, generateRefreshToken, verifyRefreshToken } from '../services/auth';
import { validateEmail } from '../services/validation';
import { generateAccountNumber } from '../services/account.service';
import { logAudit } from '../services/audit.service';
import { sendPasswordResetEmail, sendVerificationCodeEmail } from '../services/email.service';
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
        const refreshToken = generateRefreshToken(user._id.toString());
        user.refreshToken = refreshToken;
        await user.save();
        res.status(201).json({ message: 'Usuario creado exitosamente', token, refreshToken, user: { id: user._id, name: user.name, email: user.email }, account: { number: account.accountNumber, type: account.type, balance: account.balance } });
    } catch (error) {
        res.status(500).json({ error: 'Error al registrar usuario' });
    }
}

export async function login(req: AuthRequest, res: Response) {
    try {
        const { email, password } = req.body;
        const isPhone = /^\d{8,15}$/.test(email);
        const query = isPhone ? { phone: email } : { email };
        const user = await User.findOne(query);
        if (!user) return res.status(401).json({ error: 'Credenciales invalidas' });

        if (!await comparePassword(password, user.password)) return res.status(401).json({ error: 'Credenciales invalidas' });

        user.lastLogin = new Date();
        await user.save();

        await logAudit({ userId: user._id.toString(), action: 'login', detail: `Inicio de sesion: ${email}`, ipAddress: req.ip, userAgent: req.headers['user-agent'], metadata: { email } });

        const token = generateToken(user._id.toString());
        const refreshToken = generateRefreshToken(user._id.toString());
        user.refreshToken = refreshToken;
        await user.save();
        res.json({ message: 'Inicio de sesion exitoso', token, refreshToken, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
    } catch (error) {
        res.status(500).json({ error: 'Error al iniciar sesion' });
    }
}

export async function loginFingerprint(req: AuthRequest, res: Response) {
    try {
        const { email, sensorPosition } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(401).json({ error: 'Credenciales invalidas' });
        if (!user.fingerprint) return res.status(400).json({ error: 'Usuario no tiene huella registrada' });

        const storedPosition = user.fingerprint.toString('utf-8');

        if (storedPosition !== String(sensorPosition)) {
            return res.status(401).json({ error: 'Huella no coincide' });
        }

        user.lastLogin = new Date();
        await user.save();

        await logAudit({ userId: user._id.toString(), action: 'login', detail: `Inicio de sesion por huella: ${email}`, ipAddress: req.ip, userAgent: req.headers['user-agent'], metadata: { email, method: 'fingerprint' } });

        const token = generateToken(user._id.toString());
        const refreshToken = generateRefreshToken(user._id.toString());
        user.refreshToken = refreshToken;
        await user.save();
        res.json({ message: 'Inicio de sesion exitoso', token, refreshToken, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
    } catch (error) {
        res.status(500).json({ error: 'Error al iniciar sesion con huella' });
    }
}

export async function changePassword(req: AuthRequest, res: Response) {
    try {
        const { currentPassword, newPassword } = req.body;
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

        if (!await comparePassword(currentPassword, user.password)) return res.status(401).json({ error: 'Contraseña actual incorrecta' });

        user.password = await hashPassword(newPassword);
        user.refreshToken = null;
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
        user.refreshToken = null;
        await user.save();

        await logAudit({ userId: user._id.toString(), action: 'update_profile', detail: 'Contrasena restablecida via email', ipAddress: req.ip, userAgent: req.headers['user-agent'], metadata: {} });
        res.json({ message: 'Contrasena actualizada exitosamente' });
    } catch (error) {
        res.status(500).json({ error: 'Error al restablecer contrasena' });
    }
}

export async function refresh(req: AuthRequest, res: Response) {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) return res.status(400).json({ error: 'Refresh token requerido' });

        const decoded = verifyRefreshToken(refreshToken);
        if (!decoded) return res.status(401).json({ error: 'Refresh token invalido o expirado' });

        const user = await User.findById(decoded.id);
        if (!user || user.refreshToken !== refreshToken) {
            return res.status(401).json({ error: 'Refresh token invalido' });
        }

        const newToken = generateToken(user._id.toString());
        const newRefreshToken = generateRefreshToken(user._id.toString());
        user.refreshToken = newRefreshToken;
        await user.save();

        res.json({ token: newToken, refreshToken: newRefreshToken });
    } catch (error) {
        res.status(500).json({ error: 'Error al refrescar token' });
    }
}

export async function sendVerificationCode(req: AuthRequest, res: Response) {
    try {
        const { email } = req.body;

        if (await User.findOne({ email })) {
            return res.status(409).json({ error: 'Email ya registrado' });
        }

        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const expires = new Date(Date.now() + 15 * 60 * 1000);

        let user = await User.findOne({ email });
        if (!user) {
            user = new User({ email, name: '', password: 'pending', dni: '', phone: '', dateOfBirth: new Date() });
        }
        user.emailVerificationCode = code;
        user.emailVerificationExpires = expires;
        await user.save();

        try {
            await sendVerificationCodeEmail(email, code);
        } catch (e) {
            console.error('Email send failed:', (e as Error).message);
            if (process.env.NODE_ENV === 'development') {
                return res.json({ message: 'Codigo generado (email no configurado)', code });
            }
        }

        res.json({ message: 'Codigo de verificacion enviado a tu correo' });
    } catch (error) {
        res.status(500).json({ error: 'Error al enviar codigo de verificacion' });
    }
}

export async function verifyEmailCode(req: AuthRequest, res: Response) {
    try {
        const { email, code } = req.body;

        const user = await User.findOne({
            email,
            emailVerificationCode: code,
            emailVerificationExpires: { $gt: new Date() },
        });

        if (!user) {
            return res.status(400).json({ error: 'Codigo invalido o expirado' });
        }

        user.emailVerificationCode = null;
        user.emailVerificationExpires = null;
        await user.save();

        res.json({ message: 'Correo verificado correctamente' });
    } catch (error) {
        res.status(500).json({ error: 'Error al verificar codigo' });
    }
}
