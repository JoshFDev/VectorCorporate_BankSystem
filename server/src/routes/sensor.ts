import { Router, Request, Response } from 'express';

const router = Router();
const PYTHON_URL = process.env.FINGERPRINT_SERVER_URL || 'http://127.0.0.1:5000';

async function proxy(path: string, method: string): Promise<any> {
    const res = await fetch(`${PYTHON_URL}${path}`, { method });
    const data = await res.json();
    if (!res.ok) throw { status: res.status, ...data };
    return data;
}

router.get('/status', async (_req: Request, res: Response) => {
    try {
        res.json(await proxy('/status', 'GET'));
    } catch (e: any) {
        res.status(e.status || 503).json({ connected: false, error: e.error || 'Sensor no disponible' });
    }
});

router.post('/identify', async (_req: Request, res: Response) => {
    try {
        res.json(await proxy('/identify', 'POST'));
    } catch (e: any) {
        res.status(e.status || 500).json({ error: e.error || 'Error al identificar' });
    }
});

router.post('/register-scan', async (_req: Request, res: Response) => {
    try {
        res.json(await proxy('/register-scan', 'POST'));
    } catch (e: any) {
        res.status(e.status || 500).json({ error: e.error || 'Error al escanear' });
    }
});

router.post('/register-confirm', async (_req: Request, res: Response) => {
    try {
        res.json(await proxy('/register-confirm', 'POST'));
    } catch (e: any) {
        res.status(e.status || 500).json({ error: e.error || 'Error al confirmar' });
    }
});

export default router;
