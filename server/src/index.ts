import dotenv from 'dotenv';
dotenv.config();

import { initEnv } from './config/env';
initEnv();

import app from './app';
import { createServer } from 'http';
import { connectDB } from './database';
import { initSocket } from './services/socket.service';
import { processRecurringPayments } from './controllers/recurring.controller';
import { env } from './config/env';

connectDB().then(() => {
    const httpServer = createServer(app);
    initSocket(httpServer);

    httpServer.listen(env.PORT, () => {
        console.log(`Server on port ${env.PORT}`);
    });

    setInterval(() => {
        processRecurringPayments().catch(() => {});
    }, 60 * 1000);
});

