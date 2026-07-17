import { Router } from 'express';
import * as accountController from '../controllers/account.controller';
import { validate } from '../middleware/validate';
import { createAccountSchema } from '../validations/account.validation';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();
router.use(authMiddleware);

/**
 * @swagger
 * /api/accounts:
 *   post:
 *     tags: [Accounts]
 *     summary: Crear nueva cuenta
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [savings, checking]
 *                 default: savings
 *               currency:
 *                 type: string
 *                 default: GTQ
 *     responses:
 *       201:
 *         description: Cuenta creada
 *       400:
 *         description: Ya tienes una cuenta de este tipo activa
 */
router.post('/', validate(createAccountSchema), accountController.createAccount);

/**
 * @swagger
 * /api/accounts/{accountNumber}:
 *   get:
 *     tags: [Accounts]
 *     summary: Obtener datos de una cuenta
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: accountNumber
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Datos de la cuenta
 *       404:
 *         description: Cuenta no encontrada
 */
router.get('/:accountNumber', accountController.getAccount);

/**
 * @swagger
 * /api/accounts/{accountNumber}/transfer-limits:
 *   get:
 *     tags: [Accounts]
 *     summary: Obtener limites de transferencia y uso actual
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: accountNumber
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Limites y uso actual
 */
router.get('/:accountNumber/transfer-limits', accountController.getTransferLimits);

/**
 * @swagger
 * /api/accounts/{accountNumber}/transfer-limits:
 *   put:
 *     tags: [Accounts]
 *     summary: Configurar limites de transferencia
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: accountNumber
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               dailyLimit:
 *                 type: number
 *                 nullable: true
 *                 description: Limite diario en Q (null para sin limite)
 *               weeklyLimit:
 *                 type: number
 *                 nullable: true
 *                 description: Limite semanal en Q (null para sin limite)
 *     responses:
 *       200:
 *         description: Limites actualizados
 */
router.put('/:accountNumber/transfer-limits', accountController.setTransferLimits);

/**
 * @swagger
 * /api/accounts/{accountNumber}/transactions:
 *   get:
 *     tags: [Accounts]
 *     summary: Obtener transacciones de una cuenta (paginado)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: accountNumber
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Lista de transacciones con paginacion
 */
router.get('/:accountNumber/transactions', accountController.getTransactions);

/**
 * @swagger
 * /api/accounts/{accountNumber}/transactions/search:
 *   get:
 *     tags: [Accounts]
 *     summary: Buscar transacciones con filtros avanzados
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: accountNumber
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [deposit, withdrawal, transfer_in, transfer_out]
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: minAmount
 *         schema:
 *           type: number
 *       - in: query
 *         name: maxAmount
 *         schema:
 *           type: number
 *       - in: query
 *         name: description
 *         schema:
 *           type: string
 *         description: Busqueda por descripcion (case-insensitive)
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [createdAt, amount]
 *           default: createdAt
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Transacciones filtradas con paginacion
 */
router.get('/:accountNumber/transactions/search', accountController.searchTransactions);

/**
 * @swagger
 * /api/accounts/transaction/{id}:
 *   get:
 *     tags: [Accounts]
 *     summary: Obtener una transaccion por ID
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
 *         description: Transaccion encontrada
 *       404:
 *         description: Transaccion no encontrada
 */
router.get('/transaction/:id', accountController.getTransactionById);

/**
 * @swagger
 * /api/accounts/transaction/{id}/receipt:
 *   get:
 *     tags: [Accounts]
 *     summary: Descargar recibo PDF de una transaccion
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
 *         description: Archivo PDF del recibo
 *       404:
 *         description: Transaccion no encontrada
 */
router.get('/transaction/:id/receipt', accountController.downloadReceipt);

/**
 * @swagger
 * /api/accounts/{accountNumber}/export:
 *   get:
 *     tags: [Accounts]
 *     summary: Exportar estado de cuenta (PDF o CSV)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: accountNumber
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [csv, pdf]
 *           default: csv
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Archivo descargable
 */
router.get('/:accountNumber/export', accountController.exportStatement);

/**
 * @swagger
 * /api/accounts/{accountNumber}/monthly-summary:
 *   get:
 *     tags: [Accounts]
 *     summary: Resumen mensual de transacciones (para graficos)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: accountNumber
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: months
 *         schema:
 *           type: integer
 *           default: 6
 *     responses:
 *       200:
 *         description: Resumen mensual con totales por tipo
 */
router.get('/:accountNumber/monthly-summary', accountController.getMonthlySummary);

/**
 * @swagger
 * /api/accounts/{accountNumber}:
 *   delete:
 *     tags: [Accounts]
 *     summary: Desactivar cuenta
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: accountNumber
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Cuenta desactivada
 *       400:
 *         description: Debe retirar todo el saldo antes
 */
router.delete('/:accountNumber', accountController.deactivateAccount);

router.get('/:accountNumber/spending-summary', accountController.getSpendingSummary);

export default router;
