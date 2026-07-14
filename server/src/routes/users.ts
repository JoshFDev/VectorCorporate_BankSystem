import { Router } from 'express';
import * as userController from '../controllers/user.controller';
import { validate } from '../middleware/validate';
import { updateProfileSchema, photoSchema } from '../validations/user.validation';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();
router.use(authMiddleware);

/**
 * @swagger
 * /api/users/me:
 *   get:
 *     tags: [Users]
 *     summary: Obtener perfil del usuario autenticado
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Perfil del usuario
 */
router.get('/me', userController.getMe);

/**
 * @swagger
 * /api/users/me/accounts:
 *   get:
 *     tags: [Users]
 *     summary: Obtener cuentas del usuario autenticado
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de cuentas
 */
router.get('/me/accounts', userController.getMyAccounts);

/**
 * @swagger
 * /api/users/me:
 *   put:
 *     tags: [Users]
 *     summary: Actualizar perfil del usuario
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               phone:
 *                 type: string
 *               address:
 *                 type: string
 *               occupation:
 *                 type: string
 *     responses:
 *       200:
 *         description: Perfil actualizado
 */
router.put('/me', validate(updateProfileSchema), userController.updateMe);

/**
 * @swagger
 * /api/users/me/deactivate:
 *   patch:
 *     tags: [Users]
 *     summary: Desactivar cuenta de usuario
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Usuario desactivado
 *       400:
 *         description: Debe cerrar todas sus cuentas activas primero
 */
router.patch('/me/deactivate', userController.deactivateMe);

/**
 * @swagger
 * /api/users/me/photo:
 *   put:
 *     tags: [Users]
 *     summary: Subir foto de perfil
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [photo]
 *             properties:
 *               photo:
 *                 type: string
 *                 description: Imagen en base64
 *     responses:
 *       200:
 *         description: Foto actualizada
 */
router.put('/me/photo', validate(photoSchema), userController.uploadPhoto);

/**
 * @swagger
 * /api/users/me/notifications:
 *   patch:
 *     tags: [Users]
 *     summary: Actualizar preferencias de notificacion
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               emailNotifications:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Preferencias actualizadas
 */
router.patch('/me/notifications', userController.updateNotificationPreferences);

/**
 * @swagger
 * /api/users/{id}/photo:
 *   get:
 *     tags: [Users]
 *     summary: Obtener foto de perfil de un usuario
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Imagen JPEG
 *       404:
 *         description: Foto no encontrada
 */
router.get('/:id/photo', userController.getPhoto);

export default router;
