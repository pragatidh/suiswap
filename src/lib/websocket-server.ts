import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';

let io: SocketIOServer | null = null;

export function initializeWebSocket(server: HTTPServer) {
    if (io) return io;

    io = new SocketIOServer(server, {
        cors: {
            origin: '*',
            methods: ['GET', 'POST']
        },
        transports: ['websocket', 'polling']
    });

    io.on('connection', (socket) => {
        console.log('✅ Client connected:', socket.id);

        // Subscribe to specific pool updates
        socket.on('subscribe:pool', (poolId: number) => {
            const room = `pool:${poolId}`;
            socket.join(room);
            console.log(`📊 Client ${socket.id} subscribed to pool ${poolId}`);
        });

        // Unsubscribe from pool
        socket.on('unsubscribe:pool', (poolId: number) => {
            const room = `pool:${poolId}`;
            socket.leave(room);
            console.log(`📊 Client ${socket.id} unsubscribed from pool ${poolId}`);
        });

        // Subscribe to all pools
        socket.on('subscribe:all-pools', () => {
            socket.join('all-pools');
            console.log(`📊 Client ${socket.id} subscribed to all pools`);
        });

        socket.on('disconnect', () => {
            console.log('❌ Client disconnected:', socket.id);
        });
    });

    return io;
}

export function getSocketIO(): SocketIOServer | null {
    return io;
}

/**
 * Broadcast pool update to all subscribed clients
 */
export function broadcastPoolUpdate(poolId: number, data: any) {
    if (!io) {
        console.warn('⚠️ WebSocket server not initialized');
        return;
    }

    const room = `pool:${poolId}`;
    io.to(room).emit('pool:updated', {
        pool_id: poolId,
        ...data,
        timestamp: Date.now()
    });

    // Also broadcast to "all pools" subscribers
    io.to('all-pools').emit('pool:updated', {
        pool_id: poolId,
        ...data,
        timestamp: Date.now()
    });

    console.log(`📡 Broadcasted update for pool ${poolId}`);
}

/**
 * Broadcast new swap event
 */
export function broadcastSwapEvent(poolId: number, swapData: any) {
    if (!io) return;

    io.to(`pool:${poolId}`).emit('swap:executed', {
        pool_id: poolId,
        ...swapData,
        timestamp: Date.now()
    });

    io.to('all-pools').emit('swap:executed', {
        pool_id: poolId,
        ...swapData,
        timestamp: Date.now()
    });

    console.log(`💱 Broadcasted swap event for pool ${poolId}`);
}

/**
 * Get connection stats
 */
export function getConnectionStats() {
    if (!io) return { connected: 0, rooms: [] };

    const sockets = io.sockets.sockets;
    const rooms = Array.from(io.sockets.adapter.rooms.keys());

    return {
        connected: sockets.size,
        rooms: rooms.filter(room => !room.startsWith('/')), // Filter out socket IDs
    };
}
