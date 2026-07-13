import { Router } from 'express';
import * as accountController from '../controllers/account.controller';
import { validate } from '../middleware/validate';
import { createAccountSchema } from '../validations/account.validation';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();
router.use(authMiddleware);

router.post('/', validate(createAccountSchema), accountController.createAccount);
router.get('/:accountNumber', accountController.getAccount);
router.get('/:accountNumber/transactions', accountController.getTransactions);
router.delete('/:accountNumber', accountController.deactivateAccount);

export default router;
