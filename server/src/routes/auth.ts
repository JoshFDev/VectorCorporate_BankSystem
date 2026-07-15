import { Router } from 'express';
import * as authController from '../controllers/auth.controller';
import { validate } from '../middleware/validate';
import { registerSchema, loginSchema, loginFingerprintSchema, changePasswordSchema, forgotPasswordSchema, resetPasswordSchema, refreshTokenSchema, sendVerificationCodeSchema, verifyEmailCodeSchema } from '../validations/auth.validation';
import { authMiddleware } from '../middleware/auth.middleware';
import rateLimit from 'express-rate-limit';

const router = Router();

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: { error: 'Demasiados intentos de inicio de sesion. Intenta de nuevo en 15 minutos.' },
    standardHeaders: true,
    legacyHeaders: false,
});

const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 3,
    message: { error: 'Demasiados registros desde esta IP. Intenta de nuevo en 1 hora.' },
    standardHeaders: true,
    legacyHeaders: false,
});

const forgotPasswordLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 3,
    message: { error: 'Demasiadas solicitudes de recuperacion. Intenta de nuevo en 15 minutos.' },
    standardHeaders: true,
    legacyHeaders: false,
});

/**
 * @swagger
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
 *               name:
 *                 type: string
 *                 minLength: 2
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 6
 *               dni:
 *                 type: string
 *               phone:
 *                 type: string
 *               address:
 *                 type: string
 *               dateOfBirth:
 *                 type: string
 *               nationality:
 *                 type: string
 *                 default: Guatemala
 *               occupation:
 *                 type: string
 *     responses:
 *       201:
 *         description: Usuario creado exitosamente
 *       409:
 *         description: Email ya registrado
 */
router.post('/register', registerLimiter, validate(registerSchema), authController.register);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Iniciar sesion con email y password
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Inicio de sesion exitoso
 *       401:
 *         description: Credenciales invalidas
 */
router.post('/login', loginLimiter, validate(loginSchema), authController.login);

/**
 * @swagger
 * /api/auth/login-fingerprint:
 *   post:
 *     tags: [Auth]
 *     summary: Iniciar sesion con huella digital
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, sensorPosition]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               sensorPosition:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Inicio de sesion exitoso
 *       401:
 *         description: Credenciales invalidas
 */
router.post('/login-fingerprint', loginLimiter, validate(loginFingerprintSchema), authController.loginFingerprint);

/**
 * @swagger
 * /api/auth/change-password:
 *   put:
 *     tags: [Auth]
 *     summary: Cambiar contrasena
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [currentPassword, newPassword]
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *                 minLength: 6
 *     responses:
 *       200:
 *         description: Contrasena actualizada
 *       401:
 *         description: Contrasena actual incorrecta
 */
router.put('/change-password', authMiddleware, validate(changePasswordSchema), authController.changePassword);

/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     tags: [Auth]
 *     summary: Solicitar recuperacion de contrasena
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Si el correo existe, recibiras un enlace
 */
router.post('/forgot-password', forgotPasswordLimiter, validate(forgotPasswordSchema), authController.forgotPassword);

/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     tags: [Auth]
 *     summary: Restablecer contrasena con token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token, newPassword]
 *             properties:
 *               token:
 *                 type: string
 *               newPassword:
 *                 type: string
 *                 minLength: 6
 *     responses:
 *       200:
 *         description: Contrasena actualizada
 *       400:
 *         description: Token invalido o expirado
 */
router.post('/reset-password', validate(resetPasswordSchema), authController.resetPassword);

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     tags: [Auth]
 *     summary: Refrescar token de acceso
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Tokens renovados
 *       401:
 *         description: Refresh token invalido
 */
router.post('/refresh', validate(refreshTokenSchema), authController.refresh);

router.post('/send-verification-code', registerLimiter, validate(sendVerificationCodeSchema), authController.sendVerificationCode);

router.post('/verify-email-code', validate(verifyEmailCodeSchema), authController.verifyEmailCode);

export default router;
