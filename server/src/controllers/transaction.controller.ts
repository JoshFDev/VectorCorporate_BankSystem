import { Response } from 'express';
import Account from '../models/Account';
import User from '../models/User';
import Transaction from '../models/Transaction';
import { logAudit } from '../services/audit.service';
import { AuthRequest } from '../middleware/auth.middleware';
import { notifyUser } from '../services/socket.service';
import { createNotification } from '../services/notification.service';
import { sendTransactionEmail } from '../services/email.service';

const TYPE_LABELS: Record<string, string> = {
    deposit: 'Deposito',
    withdrawal: 'Retiro',
    transfer_in: 'Transferencia recibida',
    transfer_out: 'Transferencia enviada',
};

async function notifyAndEmail(userId: string, type: string, title: string, message: string, amount: number, accountNumber: string, relatedAccount?: string, balanceAfter?: number) {
    const userIdStr = userId.toString();

    createNotification({ userId: userIdStr, type: type as any, title, message, amount, accountNumber, relatedAccount }).catch(() => {});

    notifyUser(userIdStr, 'notification', { type, title, message, amount, accountNumber, relatedAccount, createdAt: new Date().toISOString() });

    if (balanceAfter !== undefined) {
        const user = await User.findById(userId);
        if (user?.emailNotifications) {
            sendTransactionEmail({
                to: user.email,
                userName: user.name,
                type: type as any,
                amount,
                accountNumber,
                relatedAccount,
                balanceAfter,
            }).catch(() => {});
        }
    }
}

export async function deposit(req: AuthRequest, res: Response) {
    try {
        const { accountNumber, amount, description } = req.body;
        const account = await Account.findOne({ accountNumber });
        if (!account) return res.status(404).json({ error: 'Cuenta no encontrada' });

        const balanceBefore = account.balance;
        account.balance += amount;
        await account.save();

        const transaction = new Transaction({ accountId: account._id, type: 'deposit', amount, description: description || 'Deposito', balanceBefore, balanceAfter: account.balance });
        await transaction.save();

        await logAudit({ userId: account.userId.toString(), action: 'deposit', detail: `Deposito de Q${amount} a cuenta ${accountNumber}`, ipAddress: req.ip, userAgent: req.headers['user-agent'], metadata: { accountNumber, amount, balanceAfter: account.balance } });

        await notifyAndEmail(account.userId, 'deposit', 'Deposito recibido', `Se deposito Q${amount.toFixed(2)} en tu cuenta ${accountNumber}`, amount, accountNumber, undefined, account.balance);

        res.json({ message: 'Deposito exitoso', account: { number: account.accountNumber, balance: account.balance }, transaction: { id: transaction._id, type: transaction.type, amount: transaction.amount, balanceBefore: transaction.balanceBefore, balanceAfter: transaction.balanceAfter } });
    } catch (error) {
        res.status(500).json({ error: 'Error al realizar deposito' });
    }
}

export async function withdraw(req: AuthRequest, res: Response) {
    try {
        const { accountNumber, amount, description } = req.body;
        const account = await Account.findOne({ accountNumber });
        if (!account) return res.status(404).json({ error: 'Cuenta no encontrada' });
        if (account.balance < amount) return res.status(400).json({ error: 'Saldo insuficiente' });

        const balanceBefore = account.balance;
        account.balance -= amount;
        await account.save();

        const transaction = new Transaction({ accountId: account._id, type: 'withdrawal', amount, description: description || 'Retiro', balanceBefore, balanceAfter: account.balance });
        await transaction.save();

        await logAudit({ userId: account.userId.toString(), action: 'withdrawal', detail: `Retiro de Q${amount} de cuenta ${accountNumber}`, ipAddress: req.ip, userAgent: req.headers['user-agent'], metadata: { accountNumber, amount, balanceAfter: account.balance } });

        await notifyAndEmail(account.userId, 'withdrawal', 'Retiro realizado', `Se retiraron Q${amount.toFixed(2)} de tu cuenta ${accountNumber}`, amount, accountNumber, undefined, account.balance);

        res.json({ message: 'Retiro exitoso', account: { number: account.accountNumber, balance: account.balance }, transaction: { id: transaction._id, type: transaction.type, amount: transaction.amount, balanceBefore: transaction.balanceBefore, balanceAfter: transaction.balanceAfter } });
    } catch (error) {
        res.status(500).json({ error: 'Error al realizar retiro' });
    }
}

export async function transfer(req: AuthRequest, res: Response) {
    try {
        const { fromAccount, toAccount, amount, description } = req.body;

        const source = await Account.findOne({ accountNumber: fromAccount });
        if (!source) return res.status(404).json({ error: 'Cuenta origen no encontrada' });
        if (source.userId.toString() !== req.user._id.toString()) return res.status(403).json({ error: 'No tienes permiso para usar esta cuenta' });

        const destination = await Account.findOne({ accountNumber: toAccount });
        if (!destination) return res.status(404).json({ error: 'Cuenta destino no encontrada' });
        if (source.balance < amount) return res.status(400).json({ error: 'Saldo insuficiente' });

        const sourceBalanceBefore = source.balance;
        source.balance -= amount;
        await source.save();

        const destBalanceBefore = destination.balance;
        destination.balance += amount;
        await destination.save();

        const txOut = new Transaction({ accountId: source._id, type: 'transfer_out', amount, description: description || 'Transferencia enviada', relatedAccount: destination._id, balanceBefore: sourceBalanceBefore, balanceAfter: source.balance });
        await txOut.save();

        const txIn = new Transaction({ accountId: destination._id, type: 'transfer_in', amount, description: description || 'Transferencia recibida', relatedAccount: source._id, balanceBefore: destBalanceBefore, balanceAfter: destination.balance });
        await txIn.save();

        await logAudit({ userId: source.userId.toString(), action: 'transfer', detail: `Transferencia de Q${amount} de ${fromAccount} a ${toAccount}`, ipAddress: req.ip, userAgent: req.headers['user-agent'], metadata: { fromAccount, toAccount, amount } });

        await notifyAndEmail(source.userId, 'transfer_out', 'Transferencia enviada', `Enviaste Q${amount.toFixed(2)} a la cuenta ${toAccount}`, amount, fromAccount, toAccount, source.balance);

        await notifyAndEmail(destination.userId, 'transfer_in', 'Transferencia recibida', `Recibiste Q${amount.toFixed(2)} de la cuenta ${fromAccount}`, amount, toAccount, fromAccount, destination.balance);

        res.json({ message: 'Transferencia exitosa', source: { number: source.accountNumber, balance: source.balance }, destination: { number: destination.accountNumber, balance: destination.balance } });
    } catch (error) {
        res.status(500).json({ error: 'Error al realizar transferencia' });
    }
}

export async function cancel(req: AuthRequest, res: Response) {
    try {
        const transaction = await Transaction.findById(req.params.id);
        if (!transaction) return res.status(404).json({ error: 'Transaccion no encontrada' });

        if (transaction.type === 'transfer_in' || transaction.type === 'transfer_out') return res.status(400).json({ error: 'Cancela la transferencia original desde la cuenta origen' });

        const account = await Account.findById(transaction.accountId);
        if (!account) return res.status(404).json({ error: 'Cuenta no encontrada' });

        const reversalAmount = transaction.type === 'deposit' ? -transaction.amount : transaction.amount;
        if (account.balance + reversalAmount < 0) return res.status(400).json({ error: 'Saldo insuficiente para reversar' });

        const balanceBefore = account.balance;
        account.balance += reversalAmount;
        await account.save();

        const reversal = new Transaction({ accountId: account._id, type: transaction.type === 'deposit' ? 'withdrawal' : 'deposit', amount: transaction.amount, description: `REVERSION: ${transaction.description || transaction.type}`, balanceBefore, balanceAfter: account.balance });
        await reversal.save();

        await logAudit({ userId: account.userId.toString(), action: 'withdrawal', detail: `Reversion de ${transaction.type} por Q${transaction.amount}`, ipAddress: req.ip, userAgent: req.headers['user-agent'], metadata: { originalTransaction: transaction._id, reversalId: reversal._id } });

        await notifyAndEmail(account.userId, 'system', 'Transaccion reversada', `Se reverso una transaccion de Q${transaction.amount.toFixed(2)}`, transaction.amount, account.accountNumber, undefined, account.balance);

        res.json({ message: 'Transaccion reversada exitosamente', reversal: { id: reversal._id, type: reversal.type, amount: reversal.amount, balanceBefore: reversal.balanceBefore, balanceAfter: reversal.balanceAfter } });
    } catch (error) {
        res.status(500).json({ error: 'Error al reversar transaccion' });
    }
}
