import { Router } from 'express';
import * as adminController from '../controllers/admin.controller';
import { validate } from '../middleware/validate';
import { changeRoleSchema } from '../validations/admin.validation';
import { authMiddleware, requireRole } from '../middleware/auth.middleware';

const router = Router();
router.use(authMiddleware);
router.use(requireRole('admin', 'supervisor'));

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     tags: [Admin]
 *     summary: Listar todos los usuarios
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de usuarios
 */
router.get('/users', adminController.getUsers);

/**
 * @swagger
 * /api/admin/users/{id}:
 *   get:
 *     tags: [Admin]
 *     summary: Obtener usuario por ID
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
 *         description: Datos del usuario
 *       404:
 *         description: Usuario no encontrado
 */
router.get('/users/:id', adminController.getUser);

/**
 * @swagger
 * /api/admin/users/{id}/verify:
 *   patch:
 *     tags: [Admin]
 *     summary: Verificar usuario
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
 *         description: Usuario verificado
 *       404:
 *         description: Usuario no encontrado
 */
router.patch('/users/:id/verify', adminController.verifyUser);

/**
 * @swagger
 * /api/admin/users/{id}/role:
 *   patch:
 *     tags: [Admin]
 *     summary: Cambiar rol de usuario
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [role]
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [user, admin, supervisor]
 *     responses:
 *       200:
 *         description: Rol actualizado
 *       403:
 *         description: No puedes asignar un rol superior al tuyo
 */
router.patch('/users/:id/role', validate(changeRoleSchema), adminController.changeRole);

/**
 * @swagger
 * /api/admin/users/{id}/toggle-active:
 *   patch:
 *     tags: [Admin]
 *     summary: Activar/desactivar usuario
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
 *         description: Estado actualizado
 *       403:
 *         description: No puedes desactivar a un administrador
 */
router.patch('/users/:id/toggle-active', adminController.toggleActive);

/**
 * @swagger
 * /api/admin/accounts:
 *   get:
 *     tags: [Admin]
 *     summary: Listar todas las cuentas
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de cuentas
 */
router.get('/accounts', adminController.getAccounts);

/**
 * @swagger
 * /api/admin/audit-logs:
 *   get:
 *     tags: [Admin]
 *     summary: Obtener logs de auditoria
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de logs de auditoria
 */
router.get('/audit-logs', adminController.getAuditLogs);

/**
 * @swagger
 * /api/admin/stats:
 *   get:
 *     tags: [Admin]
 *     summary: Obtener estadisticas del sistema
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Estadisticas generales
 */
router.get('/stats', adminController.getStats);

export default router;
