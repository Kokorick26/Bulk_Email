import { Server } from 'socket.io';

let io;

export const initSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: process.env.ALLOWED_ORIGINS
                ? process.env.ALLOWED_ORIGINS.split(',')
                : ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:5000', 'http://18.130.191.222:5000'],
            methods: ['GET', 'POST'],
            credentials: true
        }
    });

    io.on('connection', (socket) => {
        console.log('Client connected:', socket.id);

        socket.on('disconnect', () => {
            console.log('Client disconnected:', socket.id);
        });

        // Join user specific room
        socket.on('join_user', (userId) => {
            if (userId) {
                console.log(`Socket ${socket.id} joining room user_${userId}`);
                socket.join(`user_${userId}`);
            }
        });
    });

    console.log('Socket.IO initialized');
    return io;
};

export const getIO = () => {
    if (!io) {
        throw new Error('Socket.IO not initialized!');
    }
    return io;
};

export const emitToUser = (userId, event, data) => {
    if (!io) return;
    io.to(`user_${userId}`).emit(event, data);
};
