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

export default router;
