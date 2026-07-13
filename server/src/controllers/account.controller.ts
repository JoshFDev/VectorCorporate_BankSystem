import { Response } from 'express';
import Account from '../models/Account';
import Transaction from '../models/Transaction';
import { AuthRequest } from '../middleware/auth.middleware';
import { logAudit } from '../services/audit.service';
import { generateAccountNumber } from '../services/account.service';

export async function createAccount(req: AuthRequest, res: Response) {
    try {
        const { type = 'savings', currency = 'GTQ' } = req.body;

        const existing = await Account.findOne({ userId: req.user._id, type, isActive: true });
        if (existing) return res.status(400).json({ error: 'Ya tienes una cuenta de este tipo activa' });

        const accountNumber = await generateAccountNumber();
        const account = new Account({ userId: req.user._id, accountNumber, type, currency, balance: 0 });
        await account.save();

        await logAudit({ userId: req.user._id.toString(), action: 'create_account', detail: `Cuenta ${accountNumber} (${type}) creada`, ipAddress: req.ip, userAgent: req.headers['user-agent'], metadata: { accountNumber, type, currency } });

        res.status(201).json({ message: 'Cuenta creada', account: { number: account.accountNumber, type: account.type, balance: account.balance, currency: account.currency, isActive: true } });
    } catch (error) {
        res.status(500).json({ error: 'Error al crear cuenta' });
    }
}

export async function getAccount(req: AuthRequest, res: Response) {
    try {
        const account = await Account.findOne({ accountNumber: req.params.accountNumber }).populate('userId', 'name email');
        if (!account) return res.status(404).json({ error: 'Cuenta no encontrada' });

        res.json({ account: { number: account.accountNumber, type: account.type, balance: account.balance, currency: account.currency, isActive: account.isActive, owner: account.userId, createdAt: account.createdAt } });
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener cuenta' });
    }
}

export async function getTransactions(req: AuthRequest, res: Response) {
    try {
        const account = await Account.findOne({ accountNumber: req.params.accountNumber });
        if (!account) return res.status(404).json({ error: 'Cuenta no encontrada' });

        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const skip = (page - 1) * limit;

        const [transactions, total] = await Promise.all([
            Transaction.find({ accountId: account._id }).sort({ createdAt: -1 }).skip(skip).limit(limit),
            Transaction.countDocuments({ accountId: account._id })
        ]);

        res.json({ transactions, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener transacciones' });
    }
}

export async function deactivateAccount(req: AuthRequest, res: Response) {
    try {
        const account = await Account.findOne({ accountNumber: req.params.accountNumber });
        if (!account) return res.status(404).json({ error: 'Cuenta no encontrada' });
        if (!account.isActive) return res.status(400).json({ error: 'La cuenta ya esta desactivada' });
        if (account.balance > 0) return res.status(400).json({ error: 'Debe retirar todo el saldo antes de cerrar la cuenta' });

        account.isActive = false;
        await account.save();

        await logAudit({ userId: account.userId.toString(), action: 'delete_account', detail: `Cuenta ${req.params.accountNumber} desactivada`, ipAddress: req.ip, userAgent: req.headers['user-agent'], metadata: { accountNumber: req.params.accountNumber } });

        res.json({ message: 'Cuenta desactivada exitosamente' });
    } catch (error) {
        res.status(500).json({ error: 'Error al desactivar cuenta' });
    }
}
