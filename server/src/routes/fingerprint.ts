import { Router } from 'express';
import * as fingerprintController from '../controllers/fingerprint.controller';
import { validate } from '../middleware/validate';
import { registerFingerprintSchema, verifyFingerprintSchema } from '../validations/fingerprint.validation';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.post('/register', authMiddleware, validate(registerFingerprintSchema), fingerprintController.registerFingerprint);
router.post('/verify', validate(verifyFingerprintSchema), fingerprintController.verifyFingerprint);

export default router;
