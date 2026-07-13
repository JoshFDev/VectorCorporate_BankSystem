import { Router } from 'express';
import * as adminController from '../controllers/admin.controller';
import { validate } from '../middleware/validate';
import { changeRoleSchema } from '../validations/admin.validation';
import { authMiddleware, requireRole } from '../middleware/auth.middleware';

const router = Router();
router.use(authMiddleware);
router.use(requireRole('admin', 'supervisor'));

router.get('/users', adminController.getUsers);
router.get('/users/:id', adminController.getUser);
router.patch('/users/:id/verify', adminController.verifyUser);
router.patch('/users/:id/role', validate(changeRoleSchema), adminController.changeRole);
router.patch('/users/:id/toggle-active', adminController.toggleActive);
router.get('/accounts', adminController.getAccounts);
router.get('/audit-logs', adminController.getAuditLogs);
router.get('/stats', adminController.getStats);

export default router;
