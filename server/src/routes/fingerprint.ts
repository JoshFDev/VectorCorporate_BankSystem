import { Router } from 'express';
import * as fingerprintController from '../controllers/fingerprint.controller';
import { validate } from '../middleware/validate';
import { registerFingerprintSchema, compareFingerprintsSchema, verifyFingerprintSchema } from '../validations/fingerprint.validation';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

/**
 * @swagger
 * /api/fingerprint/status:
 *   get:
 *     tags: [Fingerprint]
 *     summary: Verificar estado del sensor y huellas registradas
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Estado del sensor y conteo de huellas
 */
router.get('/status', authMiddleware, fingerprintController.getFingerprintStatus);

/**
 * @swagger
 * /api/fingerprint/compare:
 *   post:
 *     tags: [Fingerprint]
 *     summary: Comparar dos escaneos de huella (Hamming distance)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [hash1, hash2]
 *             properties:
 *               hash1:
 *                 type: string
 *               hash2:
 *                 type: string
 *     responses:
 *       200:
 *         description: Resultado de la comparacion (match, hammingDistance, matchPercentage)
 */
router.post('/compare', authMiddleware, validate(compareFingerprintsSchema), fingerprintController.compareFingerprints);

/**
 * @swagger
 * /api/fingerprint/register:
 *   post:
 *     tags: [Fingerprint]
 *     summary: Registrar huella digital del usuario
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [fingerprintHash, position]
 *             properties:
 *               fingerprintHash:
 *                 type: string
 *                 description: SHA-256 hash de la huella
 *               position:
 *                 type: integer
 *                 description: Posicion del dedo en el sensor
 *     responses:
 *       201:
 *         description: Huella registrada exitosamente
 *       400:
 *         description: Ya tienes una huella registrada en esa posicion
 *       409:
 *         description: Esta huella ya esta registrada por otro usuario
 */
router.post('/register', authMiddleware, validate(registerFingerprintSchema), fingerprintController.registerFingerprint);

/**
 * @swagger
 * /api/fingerprint/remove:
 *   delete:
 *     tags: [Fingerprint]
 *     summary: Eliminar huella digital
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Huella eliminada
 *       404:
 *         description: No tienes huellas registradas
 */
router.delete('/remove', authMiddleware, fingerprintController.removeFingerprint);

/**
 * @swagger
 * /api/fingerprint/verify:
 *   post:
 *     tags: [Fingerprint]
 *     summary: Verificar huella digital (login por huella)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [fingerprintHash]
 *             properties:
 *               fingerprintHash:
 *                 type: string
 *               sensorPosition:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Verificacion exitosa (tokens + datos de usuario)
 *       401:
 *         description: Huella no reconocida
 */
router.post('/verify', validate(verifyFingerprintSchema), fingerprintController.verifyFingerprint);

export default router;
