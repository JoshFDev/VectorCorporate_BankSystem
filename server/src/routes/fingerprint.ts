import { Router } from 'express';
import * as fingerprintController from '../controllers/fingerprint.controller';
import { validate } from '../middleware/validate';
import { registerFingerprintSchema, compareFingerprintsSchema, verifyFingerprintSchema } from '../validations/fingerprint.validation';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.get('/status', authMiddleware, fingerprintController.getFingerprintStatus);
router.post('/compare', authMiddleware, validate(compareFingerprintsSchema), fingerprintController.compareFingerprints);
router.post('/register', authMiddleware, validate(registerFingerprintSchema), fingerprintController.registerFingerprint);
router.delete('/remove', authMiddleware, fingerprintController.removeFingerprint);
router.post('/verify', validate(verifyFingerprintSchema), fingerprintController.verifyFingerprint);

export default router;
