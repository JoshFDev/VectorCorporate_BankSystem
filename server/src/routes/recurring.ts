import { Router } from 'express';
import * as recurringController from '../controllers/recurring.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();
router.use(authMiddleware);

router.get('/', recurringController.getRecurringPayments);
router.post('/', recurringController.createRecurringPayment);
router.put('/:id', recurringController.updateRecurringPayment);
router.delete('/:id', recurringController.deleteRecurringPayment);

export default router;
