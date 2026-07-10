import { Router, Response } from 'express';
import User from '../models/User';
import Account from '../models/Account';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware';
import { logAudit } from '../services/audit.service';

const router = Router();
router.use(authMiddleware);

/**
 * @openapi
 * /api/users/me:
 *   get:
 *     tags: [Users]
 *     summary: Obtener perfil del usuario logueado
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Perfil del usuario
 *       401:
 *         description: No autorizado
 *       404:
 *         description: Usuario no encontrado
 */
router.get('/me', async (req: AuthRequest, res: Response) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

        const accounts = await Account.find({ userId: user._id });

        res.json({
            user: {
                id: user._id, name: user.name, email: user.email,
                dni: user.dni, phone: user.phone, address: user.address,
                dateOfBirth: user.dateOfBirth, nationality: user.nationality,
                occupation: user.occupation, role: user.role,
                isVerified: user.isVerified, createdAt: user.createdAt
            },
            accounts: accounts.map(a => ({
                number: a.accountNumber, type: a.type, balance: a.balance,
                currency: a.currency, isActive: a.isActive
            }))
        });
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener perfil' });
    }
});

/**
 * @openapi
 * /api/users/me/accounts:
 *   get:
 *     tags: [Users]
 *     summary: Obtener todas las cuentas del usuario
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de cuentas del usuario
 *       401:
 *         description: No autorizado
 */
router.get('/me/accounts', async (req: AuthRequest, res: Response) => {
    try {
        const accounts = await Account.find({ userId: req.user._id });
        res.json({
            accounts: accounts.map(a => ({
                number: a.accountNumber, type: a.type, balance: a.balance,
                currency: a.currency, isActive: a.isActive, createdAt: a.createdAt
            }))
        });
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener cuentas' });
    }
});

/**
 * @openapi
 * /api/users/me:
 *   put:
 *     tags: [Users]
 *     summary: Actualizar perfil del usuario
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string, example: "Juan Perez" }
 *               phone: { type: string, example: "12345678" }
 *               address: { type: string, example: "Nueva direccion" }
 *               occupation: { type: string, example: "Ingeniero" }
 *     responses:
 *       200:
 *         description: Perfil actualizado
 *       401:
 *         description: No autorizado
 *       404:
 *         description: Usuario no encontrado
 */
router.put('/me', async (req: AuthRequest, res: Response) => {
    try {
        const allowedFields = ['name', 'phone', 'address', 'occupation'];
        const updates: any = {};
        for (const field of allowedFields) {
            if (req.body[field] !== undefined) updates[field] = req.body[field];
        }

        const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true }).select('-password');
        if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

        await logAudit({
            userId: user._id.toString(), action: 'update_profile',
            detail: `Perfil actualizado: ${JSON.stringify(updates)}`,
            ipAddress: req.ip, userAgent: req.headers['user-agent'], metadata: updates
        });

        res.json({
            message: 'Perfil actualizado',
            user: { id: user._id, name: user.name, email: user.email, phone: user.phone, address: user.address, occupation: user.occupation }
        });
    } catch (error) {
        res.status(500).json({ error: 'Error al actualizar perfil' });
    }
});

/**
 * @openapi
 * /api/users/me/deactivate:
 *   patch:
 *     tags: [Users]
 *     summary: Desactivar cuenta de usuario
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Usuario desactivado exitosamente
 *       400:
 *         description: Debe cerrar todas sus cuentas activas primero
 *       401:
 *         description: No autorizado
 */
router.patch('/me/deactivate', async (req: AuthRequest, res: Response) => {
    try {
        const accounts = await Account.find({ userId: req.user._id, isActive: true });
        if (accounts.length > 0) {
            return res.status(400).json({ error: 'Debe cerrar todas sus cuentas activas primero' });
        }

        await User.findByIdAndUpdate(req.user._id, { isActive: false });

        await logAudit({
            userId: req.user._id.toString(), action: 'delete_account',
            detail: 'Usuario desactivado',
            ipAddress: req.ip, userAgent: req.headers['user-agent'], metadata: {}
        });

        res.json({ message: 'Usuario desactivado exitosamente' });
    } catch (error) {
        res.status(500).json({ error: 'Error al desactivar usuario' });
    }
});

export default router;