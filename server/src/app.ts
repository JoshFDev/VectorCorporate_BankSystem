import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import authRoutes from './routes/auth';
import transactionRoutes from './routes/transactions';
import { errorHandler } from './middleware/error.middleware';
import accountRoutes from './routes/accounts';
import userRoutes from './routes/users';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';

const app = express();

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { error: 'Demasiadas peticiones, intenta de nuevo mas tarde' }
});

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(limiter);

app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);

app.use('/api/accounts', accountRoutes);
app.use('/api/users', userRoutes);

app.get('/', (_req, res) => {
    res.json({ message: 'VectorBank API running' });
});

app.use(errorHandler);

export default app;