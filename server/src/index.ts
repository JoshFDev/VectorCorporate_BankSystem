import app from './app';
import { createServer } from 'http';
import { connectDB } from './database';
import { initSocket } from './services/socket.service';
import dotenv from 'dotenv';
dotenv.config();

const PORT = process.env.PORT || 3000;

connectDB().then(() => {
    const httpServer = createServer(app);
    initSocket(httpServer);

    httpServer.listen(PORT, () => {
        console.log(`Server on port ${PORT}`);
    });
});

