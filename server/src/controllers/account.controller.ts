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
