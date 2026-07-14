import { Router, Request, Response } from 'express';

const router = Router();
const PYTHON_URL = process.env.FINGERPRINT_SERVER_URL || 'http://127.0.0.1:5000';

async function proxy(path: string, method: string): Promise<any> {
    const res = await fetch(`${PYTHON_URL}${path}`, { method });
    const data = await res.json();
    if (!res.ok) throw { status: res.status, ...data };
    return data;
}

/**
 * @swagger
 * /api/sensor/status:
 *   get:
 *     tags: [Sensor]
 *     summary: Verificar conexion del sensor AS608
 *     responses:
 *       200:
 *         description: Estado del sensor
 *       503:
 *         description: Sensor no disponible
 */
router.get('/status', async (_req: Request, res: Response) => {
    try {
        res.json(await proxy('/status', 'GET'));
    } catch (e: any) {
        res.status(e.status || 503).json({ connected: false, error: e.error || 'Sensor no disponible' });
    }
});

/**
 * @swagger
 * /api/sensor/identify:
 *   post:
 *     tags: [Sensor]
 *     summary: Escanear huella y buscar coincidencia en la base
 *     responses:
 *       200:
 *         description: Huella identificada (fingerprintId, userId, matchPercentage)
 *       404:
 *         description: Sin coincidencia
 *       500:
 *         description: Error al escanear
 */
router.post('/identify', async (_req: Request, res: Response) => {
    try {
        res.json(await proxy('/identify', 'POST'));
    } catch (e: any) {
        res.status(e.status || 500).json({ error: e.error || 'Error al identificar' });
    }
});

/**
 * @swagger
 * /api/sensor/register-scan:
 *   post:
 *     tags: [Sensor]
 *     summary: Primer escaneo para registro de huella
 *     responses:
 *       200:
 *         description: Hash SHA-256 de la huella escaneada
 *       500:
 *         description: Error al escanear
 */
router.post('/register-scan', async (_req: Request, res: Response) => {
    try {
        res.json(await proxy('/register-scan', 'POST'));
    } catch (e: any) {
        res.status(e.status || 500).json({ error: e.error || 'Error al escanear' });
    }
});

/**
 * @swagger
 * /api/sensor/register-confirm:
 *   post:
 *     tags: [Sensor]
 *     summary: Segundo escaneo para confirmar huella
 *     responses:
 *       200:
 *         description: Hash SHA-256 confirmado
 *       500:
 *         description: Error al escanear
 */
router.post('/register-confirm', async (_req: Request, res: Response) => {
    try {
        res.json(await proxy('/register-confirm', 'POST'));
    } catch (e: any) {
        res.status(e.status || 500).json({ error: e.error || 'Error al confirmar' });
    }
});

export default router;
