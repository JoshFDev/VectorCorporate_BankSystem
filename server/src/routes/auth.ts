import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import User from '../models/User';
import Account from '../models/Account';
import { hashPassword, comparePassword, generateToken } from '../services/auth';
import { validateEmail } from '../services/validation';
import { generateAccountNumber } from '../services/account.service';
import { logAudit } from '../services/audit.service';
import { sendPasswordResetEmail } from '../services/email.service';

const router = Router();

/**
 * @openapi
 * /api/auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Registrar nuevo usuario
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password, dni, phone, dateOfBirth]
 *             properties:
 *               name: { type: string, example: "Juan Perez" }
 *               email: { type: string, example: "juan@email.com" }
 *               password: { type: string, example: "123456" }
 *               dni: { type: string, example: "123456789" }
 *               phone: { type: string, example: "12345678" }
 *               address: { type: string, example: "Ciudad" }
 *               dateOfBirth: { type: string, format: date, example: "2000-01-01" }
 *               nationality: { type: string, example: "Guatemala" }
 *               occupation: { type: string, example: "Developer" }
 *     responses:
 *       201:
 *         description: Usuario creado exitosamente
 *       400:
 *         description: Email invalido
 *       409:
 *         description: Email ya registrado
 *       422:
 *         description: Campos obligatorios faltantes
 */
router.post('/register', async (req: Request, res: Response) => {
    try {
        const requiredFields = ['name', 'email', 'password', 'dni', 'phone', 'dateOfBirth'];
        const missingFields = requiredFields.filter(f => !req.body[f]);
        if (missingFields.length > 0) {
            return res.status(422).json({ error: 'Campos obligatorios faltantes', missingFields });
        }

        const { name, email, password, dni, phone, address, dateOfBirth, nationality, occupation } = req.body;

        const emailCheck = await validateEmail(email);
        if (!emailCheck.valid) {
            return res.status(400).json({ error: emailCheck.message });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(409).json({ error: 'Email ya registrado' });
        }

        const hashedPassword = await hashPassword(password);

        const user = new User({
            name, email, password: hashedPassword, dni, phone, address,
            dateOfBirth: new Date(dateOfBirth), nationality, occupation
        });
        await user.save();

        const accountNumber = await generateAccountNumber();
        const account = new Account({
            userId: user._id, accountNumber, type: 'savings', balance: 0, currency: 'GTQ'
        });
        await account.save();

        await logAudit({
            userId: user._id.toString(), action: 'register',
            detail: `Usuario ${name} registrado con cuenta ${accountNumber}`,
            ipAddress: req.ip, userAgent: req.headers['user-agent'],
            metadata: { email, accountNumber }
        });

        const token = generateToken(user._id.toString());

        res.status(201).json({
            message: 'Usuario creado exitosamente', token,
            user: { id: user._id, name: user.name, email: user.email },
            account: { number: account.accountNumber, type: account.type, balance: account.balance }
        });
    } catch (error) {
        res.status(500).json({ error: 'Error al registrar usuario' });
    }
});

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Iniciar sesion
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, example: "juan@email.com" }
 *               password: { type: string, example: "123456" }
 *     responses:
 *       200:
 *         description: Inicio de sesion exitoso
 *       401:
 *         description: Credenciales invalidas
 *       422:
 *         description: Email y password son obligatorios
 */
router.post('/login', async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(422).json({ error: 'Email y password son obligatorios' });
        }

        const user = await User.findOne({ email });
        if (!user) return res.status(401).json({ error: 'Credenciales invalidas' });

        const isMatch = await comparePassword(password, user.password);
        if (!isMatch) return res.status(401).json({ error: 'Credenciales invalidas' });

        user.lastLogin = new Date();
        await user.save();

        await logAudit({
            userId: user._id.toString(), action: 'login',
            detail: `Inicio de sesion: ${email}`,
            ipAddress: req.ip, userAgent: req.headers['user-agent'],
            metadata: { email }
        });

        const token = generateToken(user._id.toString());
        res.json({
            message: 'Inicio de sesion exitoso', token,
            user: { id: user._id, name: user.name, email: user.email, role: user.role }
        });
    } catch (error) {
        res.status(500).json({ error: 'Error al iniciar sesion' });
    }
});

/**
 * @openapi
 * /api/auth/change-password:
 *   put:
 *     tags: [Auth]
 *     summary: Cambiar contraseña
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, currentPassword, newPassword]
 *             properties:
 *               email: { type: string, example: "juan@email.com" }
 *               currentPassword: { type: string, example: "123456" }
 *               newPassword: { type: string, example: "nueva123" }
 *     responses:
 *       200:
 *         description: Contraseña actualizada
 *       401:
 *         description: Contraseña actual incorrecta
 *       404:
 *         description: Usuario no encontrado
 *       422:
 *         description: Campos requeridos
 */
router.put('/change-password', async (req: Request, res: Response) => {
    try {
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) {
            return res.status(422).json({ error: 'Contraseña actual y nueva son requeridas' });
        }

        const { email } = req.body;
        if (!email) return res.status(422).json({ error: 'Email requerido' });

        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

        const isMatch = await comparePassword(currentPassword, user.password);
        if (!isMatch) return res.status(401).json({ error: 'Contraseña actual incorrecta' });

        user.password = await hashPassword(newPassword);
        await user.save();

        await logAudit({
            userId: user._id.toString(), action: 'update_profile',
            detail: 'Contraseña cambiada',
            ipAddress: req.ip, userAgent: req.headers['user-agent'],
            metadata: {}
        });

        res.json({ message: 'Contraseña actualizada exitosamente' });
    } catch (error) {
        res.status(500).json({ error: 'Error al cambiar contraseña' });
    }
});

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req: Request, res: Response) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(422).json({ error: 'Email requerido' });

        const user = await User.findOne({ email });
        // Always return success to avoid email enumeration
        if (!user) return res.json({ message: 'Si el correo existe, recibiras un enlace de recuperacion' });

        const token = crypto.randomBytes(32).toString('hex');
        user.resetPasswordToken = token;
        user.resetPasswordExpires = new Date(Date.now() + 3600000); // 1 hour
        await user.save();

        await sendPasswordResetEmail(email, token);

        res.json({ message: 'Si el correo existe, recibiras un enlace de recuperacion' });
    } catch (error) {
        res.status(500).json({ error: 'Error al enviar correo de recuperacion' });
    }
});

// POST /api/auth/reset-password
router.post('/reset-password', async (req: Request, res: Response) => {
    try {
        const { token, newPassword } = req.body;
        if (!token || !newPassword) {
            return res.status(422).json({ error: 'Token y nueva contrasena requeridos' });
        }

        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: new Date() }
        });

        if (!user) return res.status(400).json({ error: 'Token invalido o expirado' });

        user.password = await hashPassword(newPassword);
        user.resetPasswordToken = null;
        user.resetPasswordExpires = null;
        await user.save();

        await logAudit({
            userId: user._id.toString(),
            action: 'update_profile',
            detail: 'Contrasena restablecida via email',
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'],
            metadata: {}
        });

        res.json({ message: 'Contrasena actualizada exitosamente' });
    } catch (error) {
        res.status(500).json({ error: 'Error al restablecer contrasena' });
    }
});

export default router;