import { Response } from 'express';
import PDFDocument from 'pdfkit';
import Account from '../models/Account';
import User from '../models/User';
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

export async function searchTransactions(req: AuthRequest, res: Response) {
    try {
        const account = await Account.findOne({ accountNumber: req.params.accountNumber });
        if (!account) return res.status(404).json({ error: 'Cuenta no encontrada' });
        if (account.userId.toString() !== req.user._id.toString()) return res.status(403).json({ error: 'No tienes acceso a esta cuenta' });

        const { type, from, to, minAmount, maxAmount, description, sort = 'createdAt', order = 'desc', page = '1', limit = '20' } = req.query as Record<string, string>;

        const filter: any = { accountId: account._id };

        if (type) filter.type = type;
        if (description) filter.description = { $regex: description, $options: 'i' };
        if (from || to) {
            filter.createdAt = {};
            if (from) filter.createdAt.$gte = new Date(from);
            if (to) filter.createdAt.$lte = new Date(to + 'T23:59:59.999Z');
        }
        if (minAmount || maxAmount) {
            filter.amount = {};
            if (minAmount) filter.amount.$gte = parseFloat(minAmount);
            if (maxAmount) filter.amount.$lte = parseFloat(maxAmount);
        }

        const pageNum = parseInt(page) || 1;
        const limitNum = parseInt(limit) || 20;
        const skip = (pageNum - 1) * limitNum;
        const sortDir = order === 'asc' ? 1 : -1;

        const [transactions, total] = await Promise.all([
            Transaction.find(filter).sort({ [sort]: sortDir }).skip(skip).limit(limitNum).populate('relatedAccount', 'accountNumber'),
            Transaction.countDocuments(filter)
        ]);

        res.json({
            transactions,
            pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) }
        });
    } catch (error) {
        res.status(500).json({ error: 'Error al buscar transacciones' });
    }
}

export async function getTransactionById(req: AuthRequest, res: Response) {
    try {
        const tx = await Transaction.findById(req.params.id).populate('relatedAccount', 'accountNumber');
        if (!tx) return res.status(404).json({ error: 'Transaccion no encontrada' });

        const account = await Account.findById(tx.accountId);
        if (!account) return res.status(404).json({ error: 'Cuenta no encontrada' });
        if (account.userId.toString() !== req.user._id.toString()) return res.status(403).json({ error: 'No tienes acceso' });

        res.json({ transaction: tx });
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener transaccion' });
    }
}

export async function downloadReceipt(req: AuthRequest, res: Response) {
    try {
        const tx = await Transaction.findById(req.params.id).populate('relatedAccount', 'accountNumber');
        if (!tx) return res.status(404).json({ error: 'Transaccion no encontrada' });

        const account = await Account.findById(tx.accountId);
        if (!account) return res.status(404).json({ error: 'Cuenta no encontrada' });
        if (account.userId.toString() !== req.user._id.toString()) return res.status(403).json({ error: 'No tienes acceso' });

        const user = await User.findById(req.user._id);
        const isPositive = tx.type === 'deposit' || tx.type === 'transfer_in';
        const sign = isPositive ? '+' : '-';
        const color = isPositive ? '#16a34a' : '#dc2626';

        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="recibo_${tx._id}.pdf"`);
        doc.pipe(res);

        doc.rect(0, 0, 595.28, 120).fill('#1e40af');
        doc.fontSize(22).font('Helvetica-Bold').fillColor('#ffffff').text('VectorBank', 50, 30, { align: 'left' });
        doc.fontSize(11).font('Helvetica').fillColor('#bfdbfe').text('Recibo de Transaccion', 50, 58);
        doc.fontSize(9).fillColor('#93c5fd').text(`Comprobante No. ${String(tx._id).slice(-8).toUpperCase()}`, 50, 76);

        doc.fillColor('#1e293b');

        doc.y = 145;
        doc.fontSize(16).font('Helvetica-Bold').text('Detalle de Transaccion', 50);
        doc.moveDown(0.3);
        doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke('#e2e8f0');
        doc.moveDown(0.8);

        const leftX = 50;
        const rightX = 300;
        let y = doc.y;

        const drawField = (label: string, value: string, x: number, yPos: number, options?: { bold?: boolean; color?: string; size?: number }) => {
            doc.fontSize(9).font('Helvetica').fillColor('#94a3b8').text(label, x, yPos, { width: 230 });
            doc.fontSize(12).font(options?.bold ? 'Helvetica-Bold' : 'Helvetica').fillColor(options?.color || '#1e293b').text(value, x, yPos + 14, { width: 230 });
            return yPos + 36;
        };

        const typeLabel = TYPE_LABELS[tx.type] || tx.type;
        const dateStr = new Date(tx.createdAt).toLocaleDateString('es-GT', { year: 'numeric', month: 'long', day: 'numeric' });
        const timeStr = new Date(tx.createdAt).toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

        y = drawField('TIPO DE TRANSACCION', typeLabel, leftX, y, { bold: true });
        y = drawField('FECHA', dateStr, leftX, y);
        y = drawField('HORA', timeStr, leftX, y);

        y = doc.y;
        y = drawField('CUENTA ORIGEN', account.accountNumber, leftX, y);

        const relatedAcc = (tx.relatedAccount as any)?.accountNumber;
        if (relatedAcc) {
            y = drawField('CUENTA DESTINO', relatedAcc, leftX, y);
        }

        y = doc.y;
        y = drawField('DESCRIPCION', tx.description || 'Sin descripcion', leftX, y);

        doc.y = y + 10;
        doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke('#e2e8f0');
        doc.moveDown(1);

        doc.y += 5;
        const amountY = doc.y;

        doc.fontSize(10).font('Helvetica').fillColor('#94a3b8').text('MONTO', 50, amountY, { width: 250 });
        doc.fontSize(28).font('Helvetica-Bold').fillColor(color).text(`${sign}Q${tx.amount.toFixed(2)}`, 50, amountY + 16, { width: 250 });

        doc.fontSize(10).font('Helvetica').fillColor('#94a3b8').text('SALDO ANTES', 300, amountY, { width: 200 });
        doc.fontSize(14).font('Helvetica-Bold').fillColor('#1e293b').text(`Q${tx.balanceBefore.toFixed(2)}`, 300, amountY + 14, { width: 200 });

        doc.fontSize(10).font('Helvetica').fillColor('#94a3b8').text('SALDO DESPUES', 300, amountY + 40, { width: 200 });
        doc.fontSize(14).font('Helvetica-Bold').fillColor(color).text(`Q${tx.balanceAfter.toFixed(2)}`, 300, amountY + 54, { width: 200 });

        doc.y = amountY + 90;
        doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke('#e2e8f0');
        doc.moveDown(1.5);

        doc.fontSize(9).font('Helvetica').fillColor('#94a3b8');
        doc.text(`Cliente: ${user?.name || 'N/A'}`, 50);
        doc.text(`Documento generado el ${new Date().toLocaleDateString('es-GT')} a las ${new Date().toLocaleTimeString('es-GT')}`, 50);

        doc.moveDown(2);
        const footerY = doc.y + 10;
        doc.rect(0, footerY, 595.28, 40).fill('#f8fafc');
        doc.fontSize(8).font('Helvetica').fillColor('#94a3b8').text('Este documento es un comprobante oficial de VectorBank. Para consultas contactar soporte@vectorbank.com', 50, footerY + 14, { align: 'center', width: 495 });

        doc.end();
    } catch (error) {
        res.status(500).json({ error: 'Error al generar recibo' });
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

export async function getTransferLimits(req: AuthRequest, res: Response) {
    try {
        const account = await Account.findOne({ accountNumber: req.params.accountNumber });
        if (!account) return res.status(404).json({ error: 'Cuenta no encontrada' });
        if (account.userId.toString() !== req.user._id.toString()) return res.status(403).json({ error: 'No tienes acceso' });

        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        weekStart.setHours(0, 0, 0, 0);

        const [todayAgg, weekAgg] = await Promise.all([
            Transaction.aggregate([
                { $match: { accountId: account._id, type: 'transfer_out', createdAt: { $gte: todayStart } } },
                { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
            ]),
            Transaction.aggregate([
                { $match: { accountId: account._id, type: 'transfer_out', createdAt: { $gte: weekStart } } },
                { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
            ])
        ]);

        res.json({
            daily: {
                limit: account.dailyTransferLimit,
                used: todayAgg[0]?.total || 0,
                count: todayAgg[0]?.count || 0,
            },
            weekly: {
                limit: account.weeklyTransferLimit,
                used: weekAgg[0]?.total || 0,
                count: weekAgg[0]?.count || 0,
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener limites' });
    }
}

export async function setTransferLimits(req: AuthRequest, res: Response) {
    try {
        const account = await Account.findOne({ accountNumber: req.params.accountNumber });
        if (!account) return res.status(404).json({ error: 'Cuenta no encontrada' });
        if (account.userId.toString() !== req.user._id.toString()) return res.status(403).json({ error: 'No tienes acceso' });

        const { dailyLimit, weeklyLimit } = req.body;

        if (dailyLimit !== undefined) {
            account.dailyTransferLimit = dailyLimit === null ? null : Math.max(0, Number(dailyLimit));
        }
        if (weeklyLimit !== undefined) {
            account.weeklyTransferLimit = weeklyLimit === null ? null : Math.max(0, Number(weeklyLimit));
        }

        await account.save();

        res.json({
            message: 'Limites actualizados',
            daily: account.dailyTransferLimit,
            weekly: account.weeklyTransferLimit
        });
    } catch (error) {
        res.status(500).json({ error: 'Error al actualizar limites' });
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

export async function getMonthlySummary(req: AuthRequest, res: Response) {
    try {
        const account = await Account.findOne({ accountNumber: req.params.accountNumber });
        if (!account) return res.status(404).json({ error: 'Cuenta no encontrada' });
        if (account.userId.toString() !== req.user._id.toString()) return res.status(403).json({ error: 'No tienes acceso a esta cuenta' });

        const months = parseInt(req.query.months as string) || 6;
        const fromDate = new Date();
        fromDate.setMonth(fromDate.getMonth() - months);
        fromDate.setHours(0, 0, 0, 0);

        const transactions = await Transaction.find({
            accountId: account._id,
            createdAt: { $gte: fromDate }
        }).sort({ createdAt: 1 });

        const monthlyData: Record<string, { deposits: number; withdrawals: number; transferIn: number; transferOut: number }> = {};

        const now = new Date();
        for (let i = months - 1; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            monthlyData[key] = { deposits: 0, withdrawals: 0, transferIn: 0, transferOut: 0 };
        }

        for (const tx of transactions) {
            const d = new Date(tx.createdAt);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            if (!monthlyData[key]) continue;

            switch (tx.type) {
                case 'deposit': monthlyData[key].deposits += tx.amount; break;
                case 'withdrawal': monthlyData[key].withdrawals += tx.amount; break;
                case 'transfer_in': monthlyData[key].transferIn += tx.amount; break;
                case 'transfer_out': monthlyData[key].transferOut += tx.amount; break;
            }
        }

        const summary = Object.entries(monthlyData).map(([month, data]) => ({
            month,
            ...data,
            net: (data.deposits + data.transferIn) - (data.withdrawals + data.transferOut)
        }));

        const totalByType = transactions.reduce((acc, tx) => {
            switch (tx.type) {
                case 'deposit': acc.deposits += tx.amount; break;
                case 'withdrawal': acc.withdrawals += tx.amount; break;
                case 'transfer_in': acc.transferIn += tx.amount; break;
                case 'transfer_out': acc.transferOut += tx.amount; break;
            }
            return acc;
        }, { deposits: 0, withdrawals: 0, transferIn: 0, transferOut: 0 });

        res.json({ summary, totals: totalByType });
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener resumen mensual' });
    }
}

const TYPE_LABELS: Record<string, string> = {
    deposit: 'Deposito',
    withdrawal: 'Retiro',
    transfer_in: 'Transferencia recibida',
    transfer_out: 'Transferencia enviada',
};

export async function exportStatement(req: AuthRequest, res: Response) {
    try {
        const account = await Account.findOne({ accountNumber: req.params.accountNumber });
        if (!account) return res.status(404).json({ error: 'Cuenta no encontrada' });
        if (account.userId.toString() !== req.user._id.toString()) return res.status(403).json({ error: 'No tienes acceso a esta cuenta' });

        const from = req.query.from as string;
        const to = req.query.to as string;
        const format = (req.query.format as string) || 'csv';

        const filter: any = { accountId: account._id };
        if (from || to) {
            filter.createdAt = {};
            if (from) filter.createdAt.$gte = new Date(from);
            if (to) filter.createdAt.$lte = new Date(to + 'T23:59:59.999Z');
        }

        const transactions = await Transaction.find(filter).sort({ createdAt: 1 }).populate('relatedAccount', 'accountNumber');

        const user = await User.findById(req.user._id);

        if (format === 'pdf') {
            const doc = new PDFDocument({ margin: 40, size: 'A4' });
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="estado_cuenta_${account.accountNumber}.pdf"`);
            doc.pipe(res);

            doc.fontSize(20).font('Helvetica-Bold').fillColor('#1e40af').text('VectorBank', { align: 'center' });
            doc.moveDown(0.3);
            doc.fontSize(11).font('Helvetica').fillColor('#64748b').text('Estado de Cuenta', { align: 'center' });
            doc.moveDown(1);

            doc.fontSize(10).fillColor('#1e293b');
            doc.font('Helvetica-Bold').text('Cliente: ');
            doc.font('Helvetica').text(user?.name || 'N/A');
            doc.font('Helvetica-Bold').text('Cuenta: ');
            doc.font('Helvetica').text(account.accountNumber);
            doc.font('Helvetica-Bold').text('Tipo: ');
            doc.font('Helvetica').text(account.type === 'savings' ? 'Ahorros' : 'Corriente');
            doc.font('Helvetica-Bold').text('Moneda: ');
            doc.font('Helvetica').text(account.currency);
            doc.font('Helvetica-Bold').text('Saldo actual: ');
            doc.font('Helvetica').fillColor(account.balance >= 0 ? '#16a34a' : '#dc2626').text(`Q${account.balance.toFixed(2)}`);
            doc.font('Helvetica').fillColor('#1e293b');

            if (from || to) {
                doc.font('Helvetica-Bold').text('Periodo: ');
                doc.font('Helvetica').text(`${from || 'inicio'} al ${to || 'hoy'}`);
            }

            doc.moveDown(1);
            doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke('#e2e8f0');
            doc.moveDown(0.5);

            doc.fontSize(12).font('Helvetica-Bold').fillColor('#1e293b').text('Transacciones');
            doc.moveDown(0.5);

            const tableTop = doc.y;
            const cols = [40, 90, 220, 340, 430, 500];
            doc.fontSize(8).font('Helvetica-Bold').fillColor('#64748b');
            doc.text('Fecha', cols[0], tableTop);
            doc.text('Tipo', cols[1], tableTop);
            doc.text('Descripcion', cols[2], tableTop);
            doc.text('Monto', cols[3], tableTop);
            doc.text('Saldo', cols[4], tableTop);

            doc.moveTo(40, tableTop + 12).lineTo(555, tableTop + 12).stroke('#e2e8f0');

            let y = tableTop + 18;
            doc.font('Helvetica').fontSize(8).fillColor('#1e293b');

            for (const tx of transactions) {
                if (y > 750) {
                    doc.addPage();
                    y = 40;
                }

                const date = new Date(tx.createdAt).toLocaleDateString('es-GT');
                const label = TYPE_LABELS[tx.type] || tx.type;
                const sign = tx.type === 'deposit' || tx.type === 'transfer_in' ? '+' : '-';
                const color = tx.type === 'deposit' || tx.type === 'transfer_in' ? '#16a34a' : '#dc2626';

                doc.fillColor('#1e293b').text(date, cols[0], y, { width: 45 });
                doc.text(label, cols[1], y, { width: 120 });
                doc.text(tx.description || '-', cols[2], y, { width: 110 });
                doc.fillColor(color).text(`${sign}Q${tx.amount.toFixed(2)}`, cols[3], y, { width: 80 });
                doc.fillColor('#1e293b').text(`Q${tx.balanceAfter.toFixed(2)}`, cols[4], y, { width: 70 });

                y += 16;
                doc.moveTo(40, y - 4).lineTo(555, y - 4).stroke('#f1f5f9');
            }

            doc.moveDown(2);
            doc.fontSize(8).font('Helvetica').fillColor('#94a3b8').text(`Documento generado el ${new Date().toLocaleDateString('es-GT')} a las ${new Date().toLocaleTimeString('es-GT')}`, { align: 'center' });

            doc.end();
        } else {
            const rows = transactions.map(tx => ({
                Fecha: new Date(tx.createdAt).toISOString(),
                Tipo: TYPE_LABELS[tx.type] || tx.type,
                Descripcion: tx.description || '',
                Monto: tx.type === 'deposit' || tx.type === 'transfer_in' ? tx.amount : -tx.amount,
                'Saldo antes': tx.balanceBefore,
                'Saldo despues': tx.balanceAfter,
            }));

            const { Parser } = await import('json2csv');
            const parser = new Parser({ fields: ['Fecha', 'Tipo', 'Descripcion', 'Monto', 'Saldo antes', 'Saldo despues'] });
            const csv = parser.parse(rows);

            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename="estado_cuenta_${account.accountNumber}.csv"`);
            res.send(csv);
        }
    } catch (error) {
        res.status(500).json({ error: 'Error al exportar estado de cuenta' });
    }
}

const CATEGORY_LABELS: Record<string, string> = {
    food: 'Alimentos',
    transport: 'Transporte',
    services: 'Servicios',
    entertainment: 'Entretenimiento',
    health: 'Salud',
    education: 'Educacion',
    shopping: 'Compras',
    salary: 'Salario',
    transfer: 'Transferencia',
    general: 'General'
};

export async function getSpendingSummary(req: AuthRequest, res: Response) {
    try {
        const account = await Account.findOne({ accountNumber: req.params.accountNumber });
        if (!account) return res.status(404).json({ error: 'Cuenta no encontrada' });
        if (account.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: 'No tienes acceso a esta cuenta' });
        }

        const months = parseInt(req.query.months as string) || 3;
        const fromDate = new Date();
        fromDate.setMonth(fromDate.getMonth() - months);
        fromDate.setHours(0, 0, 0, 0);

        const transactions = await Transaction.find({
            accountId: account._id,
            createdAt: { $gte: fromDate },
            type: { $in: ['withdrawal', 'transfer_out'] }
        });

        const categoryTotals: Record<string, number> = {};
        let totalSpent = 0;

        for (const tx of transactions) {
            const cat = tx.category || 'general';
            categoryTotals[cat] = (categoryTotals[cat] || 0) + tx.amount;
            totalSpent += tx.amount;
        }

        const categories = Object.entries(categoryTotals)
            .map(([key, total]) => ({
                category: key,
                label: CATEGORY_LABELS[key] || key,
                total,
                percentage: totalSpent > 0 ? Math.round((total / totalSpent) * 100) : 0
            }))
            .sort((a, b) => b.total - a.total);

        res.json({ categories, totalSpent, months });
    } catch {
        res.status(500).json({ error: 'Error al obtener resumen de gastos' });
    }
}
