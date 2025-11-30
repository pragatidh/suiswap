import { getSocketIO } from '@/lib/websocket-server';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
    const io = getSocketIO();

    if (!io) {
        return NextResponse.json({
            error: 'WebSocket server not initialized',
            stats: null,
        }, { status: 503 });
    }

    const sockets = io.sockets.sockets;
    const rooms = Array.from(io.sockets.adapter.rooms.keys());

    // Filter out socket IDs (they start with socket ID format)
    const actualRooms = rooms.filter(room =>
        room.startsWith('pool:') || room === 'all-pools'
    );

    const roomStats = actualRooms.map(room => ({
        name: room,
        clients: io.sockets.adapter.rooms.get(room)?.size || 0,
    }));

    return NextResponse.json({
        stats: {
            connected_clients: sockets.size,
            active_rooms: actualRooms.length,
            rooms: roomStats,
        },
        timestamp: Date.now(),
    });
}
