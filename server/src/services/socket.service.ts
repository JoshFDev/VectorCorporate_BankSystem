import { Server as HttpServer } from 'http';
import { Server } from 'socket.io';
import { env } from '../config/env';

let io: Server;

export function initSocket(httpServer: HttpServer): Server {
    io = new Server(httpServer, {
        cors: {
            origin: env.CORS_ORIGINS,
            methods: ['GET', 'POST']
        }
    });

    io.on('connection', (socket) => {
        console.log(`[Socket] Client connected: ${socket.id}`);

        socket.on('register', (userId: string) => {
            socket.join(`user_${userId}`);
            console.log(`[Socket] User ${userId} joined room user_${userId}`);
        });

        socket.on('disconnect', () => {
            console.log(`[Socket] Client disconnected: ${socket.id}`);
        });
    });

    return io;
}

export function getIO(): Server {
    if (!io) throw new Error('Socket.io not initialized');
    return io;
}

export function notifyUser(userId: string, event: string, data: any): void {
    if (io) {
        io.to(`user_${userId}`).emit(event, data);
    }
}
