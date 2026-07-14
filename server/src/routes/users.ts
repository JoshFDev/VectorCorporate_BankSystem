import { Router } from 'express';
import * as userController from '../controllers/user.controller';
import { validate } from '../middleware/validate';
import { updateProfileSchema, photoSchema } from '../validations/user.validation';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();
router.use(authMiddleware);

router.get('/me', userController.getMe);
router.get('/me/accounts', userController.getMyAccounts);
router.put('/me', validate(updateProfileSchema), userController.updateMe);
router.patch('/me/deactivate', userController.deactivateMe);
router.put('/me/photo', validate(photoSchema), userController.uploadPhoto);
router.patch('/me/notifications', userController.updateNotificationPreferences);
router.get('/:id/photo', userController.getPhoto);

export default router;
