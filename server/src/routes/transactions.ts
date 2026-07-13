import { Router, Response } from 'express';
import Account from '../models/Account';
import Transaction from '../models/Transaction';
import { logAudit } from '../services/audit.service';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware';
import { notifyUser } from '../services/socket.service';

const router = Router();
router.use(authMiddleware);

/**
 * @openapi
 * /api/transactions/deposit:
 *   post:
 *     tags: [Transactions]
 *     summary: Depositar dinero a una cuenta
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [accountNumber, amount]
 *             properties:
 *               accountNumber: { type: string, example: "1000001" }
 *               amount: { type: number, example: 500 }
 *               description: { type: string, example: "Deposito inicial" }
 *     responses:
 *       200:
 *         description: Deposito exitoso
 *       401:
 *         description: No autorizado
 *       404:
 *         description: Cuenta no encontrada
 *       422:
 *         description: Datos invalidos
 */
router.post('/deposit', async (req: AuthRequest, res: Response) => {
    try {
        const { accountNumber, amount, description } = req.body;
        if (!accountNumber) return res.status(422).json({ error: 'Numero de cuenta requerido' });
        if (!amount || amount <= 0) return res.status(422).json({ error: 'El monto debe ser mayor a 0' });

        const account = await Account.findOne({ accountNumber });
        if (!account) return res.status(404).json({ error: 'Cuenta no encontrada' });

        const balanceBefore = account.balance;
        account.balance += amount;
        await account.save();

        const transaction = new Transaction({
            accountId: account._id, type: 'deposit', amount,
            description: description || 'Deposito', balanceBefore, balanceAfter: account.balance
        });
        await transaction.save();

        await logAudit({
            userId: account.userId.toString(), action: 'deposit',
            detail: `Deposito de Q${amount} a cuenta ${accountNumber}`,
            ipAddress: req.ip, userAgent: req.headers['user-agent'],
            metadata: { accountNumber, amount, balanceAfter: account.balance }
        });

        res.json({
            message: 'Deposito exitoso',
            account: { number: account.accountNumber, balance: account.balance },
            transaction: { id: transaction._id, type: transaction.type, amount: transaction.amount, balanceBefore: transaction.balanceBefore, balanceAfter: transaction.balanceAfter }
        });
    } catch (error) {
        res.status(500).json({ error: 'Error al realizar deposito' });
    }
});

/**
 * @openapi
 * /api/transactions/withdraw:
 *   post:
 *     tags: [Transactions]
 *     summary: Retirar dinero de una cuenta
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [accountNumber, amount]
 *             properties:
 *               accountNumber: { type: string, example: "1000001" }
 *               amount: { type: number, example: 200 }
 *               description: { type: string, example: "Retiro cajero" }
 *     responses:
 *       200:
 *         description: Retiro exitoso
 *       400:
 *         description: Saldo insuficiente
 *       401:
 *         description: No autorizado
 *       404:
 *         description: Cuenta no encontrada
 *       422:
 *         description: Datos invalidos
 */
router.post('/withdraw', async (req: AuthRequest, res: Response) => {
    try {
        const { accountNumber, amount, description } = req.body;
        if (!accountNumber) return res.status(422).json({ error: 'Numero de cuenta requerido' });
        if (!amount || amount <= 0) return res.status(422).json({ error: 'El monto debe ser mayor a 0' });

        const account = await Account.findOne({ accountNumber });
        if (!account) return res.status(404).json({ error: 'Cuenta no encontrada' });
        if (account.balance < amount) return res.status(400).json({ error: 'Saldo insuficiente' });

        const balanceBefore = account.balance;
        account.balance -= amount;
        await account.save();

        const transaction = new Transaction({
            accountId: account._id, type: 'withdrawal', amount,
            description: description || 'Retiro', balanceBefore, balanceAfter: account.balance
        });
        await transaction.save();

        await logAudit({
            userId: account.userId.toString(), action: 'withdrawal',
            detail: `Retiro de Q${amount} de cuenta ${accountNumber}`,
            ipAddress: req.ip, userAgent: req.headers['user-agent'],
            metadata: { accountNumber, amount, balanceAfter: account.balance }
        });

        res.json({
            message: 'Retiro exitoso',
            account: { number: account.accountNumber, balance: account.balance },
            transaction: { id: transaction._id, type: transaction.type, amount: transaction.amount, balanceBefore: transaction.balanceBefore, balanceAfter: transaction.balanceAfter }
        });
    } catch (error) {
        res.status(500).json({ error: 'Error al realizar retiro' });
    }
});

/**
 * @openapi
 * /api/transactions/transfer:
 *   post:
 *     tags: [Transactions]
 *     summary: Transferir dinero entre cuentas
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [fromAccount, toAccount, amount]
 *             properties:
 *               fromAccount: { type: string, example: "1000001" }
 *               toAccount: { type: string, example: "1000002" }
 *               amount: { type: number, example: 300 }
 *               description: { type: string, example: "Transferencia" }
 *     responses:
 *       200:
 *         description: Transferencia exitosa
 *       400:
 *         description: Saldo insuficiente
 *       401:
 *         description: No autorizado
 *       404:
 *         description: Cuenta no encontrada
 *       422:
 *         description: Datos invalidos
 */
router.post('/transfer', async (req: AuthRequest, res: Response) => {
    try {
        const { fromAccount, toAccount, amount, description } = req.body;
        if (!fromAccount || !toAccount) return res.status(422).json({ error: 'Cuenta origen y destino requeridas' });
        if (!amount || amount <= 0) return res.status(422).json({ error: 'El monto debe ser mayor a 0' });

        const source = await Account.findOne({ accountNumber: fromAccount });
        if (!source) return res.status(404).json({ error: 'Cuenta origen no encontrada' });
        if (source.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: 'No tienes permiso para usar esta cuenta' });
        }
        const destination = await Account.findOne({ accountNumber: toAccount });
        if (!destination) return res.status(404).json({ error: 'Cuenta destino no encontrada' });
        if (source.balance < amount) return res.status(400).json({ error: 'Saldo insuficiente' });

        const sourceBalanceBefore = source.balance;
        source.balance -= amount;
        await source.save();

        const destBalanceBefore = destination.balance;
        destination.balance += amount;
        await destination.save();

        const transactionOut = new Transaction({
            accountId: source._id, type: 'transfer_out', amount,
            description: description || 'Transferencia enviada',
            relatedAccount: destination._id, balanceBefore: sourceBalanceBefore, balanceAfter: source.balance
        });
        await transactionOut.save();

        const transactionIn = new Transaction({
            accountId: destination._id, type: 'transfer_in', amount,
            description: description || 'Transferencia recibida',
            relatedAccount: source._id, balanceBefore: destBalanceBefore, balanceAfter: destination.balance
        });
        await transactionIn.save();

        await logAudit({
            userId: source.userId.toString(), action: 'transfer',
            detail: `Transferencia de Q${amount} de ${fromAccount} a ${toAccount}`,
            ipAddress: req.ip, userAgent: req.headers['user-agent'],
            metadata: { fromAccount, toAccount, amount, sourceBalanceAfter: source.balance, destBalanceAfter: destination.balance }
        });

        notifyUser(destination.userId.toString(), 'transfer_received', {
            fromAccount: source.accountNumber,
            amount,
            description: description || 'Transferencia recibida',
            sourceBalance: destination.balance
        });

        res.json({
            message: 'Transferencia exitosa',
            source: { number: source.accountNumber, balance: source.balance },
            destination: { number: destination.accountNumber, balance: destination.balance }
        });
    } catch (error) {
        res.status(500).json({ error: 'Error al realizar transferencia' });
    }
});

/**
 * @openapi
 * /api/transactions/{id}/cancel:
 *   patch:
 *     tags: [Transactions]
 *     summary: Cancelar o reversar una transaccion
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: ID de la transaccion a reversar
 *     responses:
 *       200:
 *         description: Transaccion reversada exitosamente
 *       400:
 *         description: No se puede reversar o saldo insuficiente
 *       401:
 *         description: No autorizado
 *       404:
 *         description: Transaccion no encontrada
 */
router.patch('/:id/cancel', async (req: AuthRequest, res: Response) => {
    try {
        const transaction = await Transaction.findById(req.params.id);
        if (!transaction) return res.status(404).json({ error: 'Transaccion no encontrada' });

        if (transaction.type === 'transfer_in' || transaction.type === 'transfer_out') {
            return res.status(400).json({ error: 'Cancela la transferencia original desde la cuenta origen' });
        }

        const account = await Account.findById(transaction.accountId);
        if (!account) return res.status(404).json({ error: 'Cuenta no encontrada' });

        const reversalAmount = transaction.type === 'deposit' ? -transaction.amount : transaction.amount;

        if (account.balance + reversalAmount < 0) {
            return res.status(400).json({ error: 'Saldo insuficiente para reversar' });
        }

        const balanceBefore = account.balance;
        account.balance += reversalAmount;
        await account.save();

        const reversal = new Transaction({
            accountId: account._id,
            type: transaction.type === 'deposit' ? 'withdrawal' : 'deposit',
            amount: transaction.amount,
            description: `REVERSION: ${transaction.description || transaction.type}`,
            balanceBefore, balanceAfter: account.balance
        });
        await reversal.save();

        await logAudit({
            userId: account.userId.toString(), action: 'withdrawal',
            detail: `Reversion de ${transaction.type} por Q${transaction.amount}`,
            ipAddress: req.ip, userAgent: req.headers['user-agent'],
            metadata: { originalTransaction: transaction._id, reversalId: reversal._id }
        });

        res.json({
            message: 'Transaccion reversada exitosamente',
            reversal: { id: reversal._id, type: reversal.type, amount: reversal.amount, balanceBefore: reversal.balanceBefore, balanceAfter: reversal.balanceAfter }
        });
    } catch (error) {
        res.status(500).json({ error: 'Error al reversar transaccion' });
    }
});

export default router;