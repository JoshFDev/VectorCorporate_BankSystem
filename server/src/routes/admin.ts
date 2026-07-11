import { Router, Response } from 'express';
import User from '../models/User';
import Account from '../models/Account';
import Transaction from '../models/Transaction';
import AuditLog from '../models/AuditLog';
import { authMiddleware, requireRole, AuthRequest } from '../middleware/auth.middleware';
import { logAudit } from '../services/audit.service';

const router = Router();

router.use(authMiddleware);
router.use(requireRole('admin', 'supervisor'));

// GET /api/admin/users — list all users
router.get('/users', async (req: AuthRequest, res: Response) => {
    try {
        const page = Math.max(1, parseInt(req.query.page as string) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
        const search = (req.query.search as string) || '';
        const role = (req.query.role as string) || '';
        const skip = (page - 1) * limit;

        const filter: any = {};
        if (search) {
            const regex = new RegExp(search, 'i');
            filter.$or = [
                { name: regex }, { email: regex },
                { dni: regex }, { phone: regex }
            ];
        }
        if (role) filter.role = role;

        const [users, total] = await Promise.all([
            User.find(filter).select('-password -fingerprint -photo')
                .sort({ createdAt: -1 }).skip(skip).limit(limit),
            User.countDocuments(filter)
        ]);

        res.json({
            users: users.map(u => ({
                id: u._id, name: u.name, email: u.email,
                dni: u.dni, phone: u.phone, address: u.address,
                dateOfBirth: u.dateOfBirth, nationality: u.nationality,
                occupation: u.occupation, role: u.role,
                isVerified: u.isVerified, isActive: u.isActive,
                lastLogin: u.lastLogin, createdAt: u.createdAt
            })),
            pagination: { page, limit, total, pages: Math.ceil(total / limit) }
        });
    } catch (error) {
        res.status(500).json({ error: 'Error al listar usuarios' });
    }
});

// GET /api/admin/users/:id — user detail + accounts
router.get('/users/:id', async (req: AuthRequest, res: Response) => {
    try {
        const user = await User.findById(req.params.id).select('-password -fingerprint -photo');
        if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

        const accounts = await Account.find({ userId: user._id });

        res.json({
            user: {
                id: user._id, name: user.name, email: user.email,
                dni: user.dni, phone: user.phone, address: user.address,
                dateOfBirth: user.dateOfBirth, nationality: user.nationality,
                occupation: user.occupation, role: user.role,
                isVerified: user.isVerified, isActive: user.isActive,
                lastLogin: user.lastLogin, createdAt: user.createdAt
            },
            accounts: accounts.map(a => ({
                id: a._id, number: a.accountNumber, type: a.type,
                balance: a.balance, currency: a.currency,
                isActive: a.isActive, createdAt: a.createdAt
            }))
        });
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener usuario' });
    }
});

// PATCH /api/admin/users/:id/verify — verify user documents
router.patch('/users/:id/verify', async (req: AuthRequest, res: Response) => {
    try {
        const user = await User.findByIdAndUpdate(
            req.params.id,
            { isVerified: true },
            { new: true }
        ).select('-password -fingerprint -photo');

        if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

        await logAudit({
            userId: req.user._id.toString(),
            action: 'verify_user',
            detail: `Usuario ${user.name} (${user.email}) verificado`,
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'],
            metadata: { targetUserId: user._id.toString() }
        });

        res.json({ message: 'Usuario verificado exitosamente', user });
    } catch (error) {
        res.status(500).json({ error: 'Error al verificar usuario' });
    }
});

// PATCH /api/admin/users/:id/role — change user role
router.patch('/users/:id/role', async (req: AuthRequest, res: Response) => {
    try {
        const { role } = req.body;
        const validRoles = ['client', 'teller', 'supervisor', 'admin'];
        if (!validRoles.includes(role)) {
            return res.status(400).json({ error: `Rol invalido. Validos: ${validRoles.join(', ')}` });
        }

        const user = await User.findByIdAndUpdate(
            req.params.id,
            { role },
            { new: true }
        ).select('-password -fingerprint -photo');

        if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

        await logAudit({
            userId: req.user._id.toString(),
            action: 'role_change',
            detail: `Rol de ${user.name} cambiado a ${role}`,
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'],
            metadata: { targetUserId: user._id.toString(), newRole: role }
        });

        res.json({ message: 'Rol actualizado exitosamente', user });
    } catch (error) {
        res.status(500).json({ error: 'Error al cambiar rol' });
    }
});

// PATCH /api/admin/users/:id/toggle-active — activate/deactivate user
router.patch('/users/:id/toggle-active', async (req: AuthRequest, res: Response) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

        const newStatus = !user.isActive;
        user.isActive = newStatus;
        await user.save();

        await logAudit({
            userId: req.user._id.toString(),
            action: 'admin_action',
            detail: `Usuario ${user.name} ${newStatus ? 'activado' : 'desactivado'}`,
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'],
            metadata: { targetUserId: user._id.toString(), isActive: newStatus }
        });

        res.json({ message: `Usuario ${newStatus ? 'activado' : 'desactivado'} exitosamente` });
    } catch (error) {
        res.status(500).json({ error: 'Error al cambiar estado' });
    }
});

// GET /api/admin/accounts — list all accounts
router.get('/accounts', async (req: AuthRequest, res: Response) => {
    try {
        const page = Math.max(1, parseInt(req.query.page as string) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
        const skip = (page - 1) * limit;
        const type = (req.query.type as string) || '';
        const status = (req.query.status as string) || '';

        const filter: any = {};
        if (type) filter.type = type;
        if (status === 'active') filter.isActive = true;
        else if (status === 'inactive') filter.isActive = false;

        const [accounts, total] = await Promise.all([
            Account.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit)
                .populate('userId', 'name email'),
            Account.countDocuments(filter)
        ]);

        res.json({
            accounts: accounts.map(a => ({
                id: a._id, number: a.accountNumber, type: a.type,
                balance: a.balance, currency: a.currency,
                isActive: a.isActive, createdAt: a.createdAt,
                user: (a as any).userId ? { id: (a as any).userId._id, name: (a as any).userId.name, email: (a as any).userId.email } : null
            })),
            pagination: { page, limit, total, pages: Math.ceil(total / limit) }
        });
    } catch (error) {
        res.status(500).json({ error: 'Error al listar cuentas' });
    }
});

// GET /api/admin/audit-logs — list audit logs
router.get('/audit-logs', async (req: AuthRequest, res: Response) => {
    try {
        const page = Math.max(1, parseInt(req.query.page as string) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
        const skip = (page - 1) * limit;
        const action = (req.query.action as string) || '';
        const search = (req.query.search as string) || '';

        const filter: any = {};
        if (action) filter.action = action;
        if (search) filter.detail = new RegExp(search, 'i');

        const [logs, total] = await Promise.all([
            AuditLog.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit)
                .populate('userId', 'name email'),
            AuditLog.countDocuments(filter)
        ]);

        res.json({
            logs: logs.map(l => ({
                id: l._id, action: l.action, detail: l.detail,
                ipAddress: l.ipAddress, userAgent: l.userAgent,
                metadata: l.metadata, createdAt: l.createdAt,
                user: (l as any).userId ? { id: (l as any).userId._id, name: (l as any).userId.name, email: (l as any).userId.email } : null
            })),
            pagination: { page, limit, total, pages: Math.ceil(total / limit) }
        });
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener auditoria' });
    }
});

// GET /api/admin/stats — dashboard stats
router.get('/stats', async (req: AuthRequest, res: Response) => {
    try {
        const [totalUsers, totalAccounts, totalTransactions, verifiedUsers, auditCount] = await Promise.all([
            User.countDocuments(),
            Account.countDocuments(),
            Transaction.countDocuments(),
            User.countDocuments({ isVerified: true }),
            AuditLog.countDocuments()
        ]);

        const balances = await Account.aggregate([
            { $group: { _id: null, total: { $sum: '$balance' }, avg: { $avg: '$balance' } } }
        ]);

        res.json({
            totalUsers,
            totalAccounts,
            totalTransactions,
            verifiedUsers,
            unverifiedUsers: totalUsers - verifiedUsers,
            auditLogCount: auditCount,
            totalDeposits: balances[0]?.total || 0,
            averageBalance: balances[0]?.avg || 0
        });
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener estadisticas' });
    }
});

export default router;
