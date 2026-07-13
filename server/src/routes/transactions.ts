import { Router } from 'express';
import * as transactionController from '../controllers/transaction.controller';
import { validate } from '../middleware/validate';
import { depositSchema, withdrawSchema, transferSchema } from '../validations/transaction.validation';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();
router.use(authMiddleware);

router.post('/deposit', validate(depositSchema), transactionController.deposit);
router.post('/withdraw', validate(withdrawSchema), transactionController.withdraw);
router.post('/transfer', validate(transferSchema), transactionController.transfer);
router.patch('/:id/cancel', transactionController.cancel);

export default router;
