import { Router } from 'express';
import * as forexController from '../controllers/forex.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.get('/rates', authMiddleware, forexController.getRates);
router.post('/convert', authMiddleware, forexController.convert);

export default router;
