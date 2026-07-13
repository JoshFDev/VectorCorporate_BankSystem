import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { mongoSanitize } from './middleware/sanitize.middleware';
import authRoutes from './routes/auth';
import transactionRoutes from './routes/transactions';
import { errorHandler } from './middleware/error.middleware';
import accountRoutes from './routes/accounts';
import userRoutes from './routes/users';
import adminRoutes from './routes/admin';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';
import fingerprintRoutes from './routes/fingerprint';
import { env } from './config/env';

const app = express();

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { error: 'Demasiadas peticiones, intenta de nuevo mas tarde' }
});

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use(helmet());
app.use(cors({ origin: env.CORS_ORIGINS, credentials: true }));
app.use(mongoSanitize);
app.use(morgan('dev'));
app.use(express.json({ limit: '1mb' }));
app.use(limiter);

app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);

app.use('/api/accounts', accountRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/fingerprint', fingerprintRoutes);

app.get('/', (_req, res) => {
    res.json({ message: 'VectorBank API running' });
});

app.use(errorHandler);

export default app;