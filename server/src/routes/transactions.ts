import { Router } from 'express';
import * as transactionController from '../controllers/transaction.controller';
import { validate } from '../middleware/validate';
import { depositSchema, withdrawSchema, transferSchema } from '../validations/transaction.validation';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();
router.use(authMiddleware);

/**
 * @swagger
 * /api/transactions/deposit:
 *   post:
 *     tags: [Transactions]
 *     summary: Realizar deposito
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
 *               accountNumber:
 *                 type: string
 *               amount:
 *                 type: number
 *                 minimum: 0.01
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Deposito exitoso
 *       404:
 *         description: Cuenta no encontrada
 */
router.post('/deposit', validate(depositSchema), transactionController.deposit);

/**
 * @swagger
 * /api/transactions/withdraw:
 *   post:
 *     tags: [Transactions]
 *     summary: Realizar retiro
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
 *               accountNumber:
 *                 type: string
 *               amount:
 *                 type: number
 *                 minimum: 0.01
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Retiro exitoso
 *       400:
 *         description: Saldo insuficiente
 */
router.post('/withdraw', validate(withdrawSchema), transactionController.withdraw);

/**
 * @swagger
 * /api/transactions/transfer:
 *   post:
 *     tags: [Transactions]
 *     summary: Realizar transferencia entre cuentas
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
 *               fromAccount:
 *                 type: string
 *               toAccount:
 *                 type: string
 *               amount:
 *                 type: number
 *                 minimum: 0.01
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Transferencia exitosa
 *       400:
 *         description: Saldo insuficiente
 *       403:
 *         description: No tienes permiso para usar esta cuenta
 */
router.post('/transfer', validate(transferSchema), transactionController.transfer);

/**
 * @swagger
 * /api/transactions/{id}/cancel:
 *   patch:
 *     tags: [Transactions]
 *     summary: Cancelar/reversar una transaccion
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Transaccion reversada
 *       400:
 *         description: No se puede cancelar este tipo de transaccion
 *       404:
 *         description: Transaccion no encontrada
 */
router.patch('/:id/cancel', transactionController.cancel);

export default router;
