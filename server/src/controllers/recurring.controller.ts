import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import RecurringPayment from '../models/RecurringPayment';
import Account from '../models/Account';
import Transaction from '../models/Transaction';
import { notifyUser } from '../services/socket.service';
import { createNotification } from '../services/notification.service';

function getNextDate(frequency: string, from: Date): Date {
    const next = new Date(from);
    switch (frequency) {
        case 'weekly': next.setDate(next.getDate() + 7); break;
        case 'biweekly': next.setDate(next.getDate() + 14); break;
        case 'monthly': next.setMonth(next.getMonth() + 1); break;
        case 'quarterly': next.setMonth(next.getMonth() + 3); break;
        case 'yearly': next.setFullYear(next.getFullYear() + 1); break;
    }
    return next;
}

export async function getRecurringPayments(req: AuthRequest, res: Response) {
    try {
        const payments = await RecurringPayment.find({ userId: req.user._id }).sort({ createdAt: -1 });
        res.json({ payments });
    } catch {
        res.status(500).json({ error: 'Error al obtener pagos recurrentes' });
    }
}

export async function createRecurringPayment(req: AuthRequest, res: Response) {
    try {
        const { fromAccountNumber, toAccountNumber, amount, description, category, frequency } = req.body;

        const source = await Account.findOne({ accountNumber: fromAccountNumber });
        if (!source) return res.status(404).json({ error: 'Cuenta origen no encontrada' });
        if (source.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: 'No tienes permiso para usar esta cuenta' });
        }

        const destination = await Account.findOne({ accountNumber: toAccountNumber });
        if (!destination) return res.status(404).json({ error: 'Cuenta destino no encontrada' });

        if (source.balance < amount) {
            return res.status(400).json({ error: 'Saldo insuficiente para la primera ejecucion' });
        }

        const payment = new RecurringPayment({
            userId: req.user._id,
            fromAccountNumber,
            toAccountNumber,
            amount,
            description: description || 'Pago recurrente',
            category: category || 'general',
            frequency,
            nextExecuteAt: new Date()
        });

        await payment.save();
        res.status(201).json({ message: 'Pago recurrente creado', payment });
    } catch (error: any) {
        if (error.code === 11000) {
            return res.status(400).json({ error: 'Ya existe un pago recurrente similar' });
        }
        res.status(500).json({ error: 'Error al crear pago recurrente' });
    }
}

export async function updateRecurringPayment(req: AuthRequest, res: Response) {
    try {
        const payment = await RecurringPayment.findOne({ _id: req.params.id, userId: req.user._id });
        if (!payment) return res.status(404).json({ error: 'Pago recurrente no encontrado' });

        const { amount, description, category, frequency, isActive } = req.body;
        if (amount !== undefined) payment.amount = amount;
        if (description !== undefined) payment.description = description;
        if (category !== undefined) payment.category = category;
        if (frequency !== undefined) {
            payment.frequency = frequency;
            payment.nextExecuteAt = getNextDate(frequency, new Date());
        }
        if (isActive !== undefined) payment.isActive = isActive;

        await payment.save();
        res.json({ message: 'Actualizado', payment });
    } catch {
        res.status(500).json({ error: 'Error al actualizar' });
    }
}

export async function deleteRecurringPayment(req: AuthRequest, res: Response) {
    try {
        const payment = await RecurringPayment.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
        if (!payment) return res.status(404).json({ error: 'No encontrado' });
        res.json({ message: 'Eliminado' });
    } catch {
        res.status(500).json({ error: 'Error al eliminar' });
    }
}

export async function processRecurringPayments() {
    try {
        const now = new Date();
        const duePayments = await RecurringPayment.find({
            isActive: true,
            nextExecuteAt: { $lte: now }
        });

        for (const payment of duePayments) {
            try {
                const source = await Account.findOne({ accountNumber: payment.fromAccountNumber });
                const destination = await Account.findOne({ accountNumber: payment.toAccountNumber });

                if (!source || !destination || source.balance < payment.amount || !source.isActive) {
                    payment.isActive = false;
                    await payment.save();
                    continue;
                }

                const sourceBalanceBefore = source.balance;
                source.balance -= payment.amount;
                await source.save();

                const destBalanceBefore = destination.balance;
                destination.balance += payment.amount;
                await destination.save();

                const desc = `${payment.description} (auto ${payment.frequency})`;

                await new Transaction({
                    accountId: source._id,
                    type: 'transfer_out',
                    amount: payment.amount,
                    description: desc,
                    category: payment.category,
                    relatedAccount: destination._id,
                    balanceBefore: sourceBalanceBefore,
                    balanceAfter: source.balance
                }).save();

                await new Transaction({
                    accountId: destination._id,
                    type: 'transfer_in',
                    amount: payment.amount,
                    description: desc,
                    category: payment.category,
                    relatedAccount: source._id,
                    balanceBefore: destBalanceBefore,
                    balanceAfter: destination.balance
                }).save();

                payment.lastExecuteAt = now;
                payment.nextExecuteAt = getNextDate(payment.frequency, now);
                payment.executionCount += 1;
                await payment.save();

                const userId = payment.userId.toString();
                createNotification({
                    userId, type: 'transfer_out', title: 'Transferencia recurrente',
                    message: `Se ejecuto pago de $${payment.amount.toFixed(2)} a ${payment.toAccountNumber}`,
                    amount: payment.amount, accountNumber: payment.fromAccountNumber
                }).catch(() => {});
                notifyUser(userId, 'notification', { type: 'transfer_out', title: 'Transferencia recurrente', message: desc, amount: payment.amount });
            } catch {
                payment.isActive = false;
                await payment.save();
            }
        }
    } catch {
        // Silent fail for scheduler
    }
}
