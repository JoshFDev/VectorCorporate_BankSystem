import express from 'express';
import mongoose from 'mongoose';
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
import sensorRoutes from './routes/sensor';
import notificationRoutes from './routes/notifications';
import forexRoutes from './routes/forex';
import recurringRoutes from './routes/recurring';
import beneficiaryRoutes from './routes/beneficiaries';
import { env } from './config/env';

const app = express();

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 500,
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
app.use('/api/sensor', sensorRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/forex', forexRoutes);
app.use('/api/recurring', recurringRoutes);
app.use('/api/beneficiaries', beneficiaryRoutes);

app.get('/', (_req, res) => {
    res.json({ message: 'VectorBank API running' });
});

app.get('/health', (_req, res) => {
    const dbState = mongoose.connection.readyState;
    const dbStatus = dbState === 1 ? 'connected' : dbState === 2 ? 'connecting' : 'disconnected';
    const status = dbState === 1 ? 200 : 503;

    res.status(status).json({
        status: status === 200 ? 'ok' : 'degraded',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        database: { status: dbStatus, name: mongoose.connection.name || 'unknown' },
        memory: { rss: Math.round(process.memoryUsage().rss / 1024 / 1024) + 'MB' },
    });
});

app.use(errorHandler);

export default app;