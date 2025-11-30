'use client';

import { useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

interface PoolUpdate {
    pool_id: number;
    reserve_a?: string;
    reserve_b?: string;
    fee_per_share?: number;
    timestamp: number;
}

interface SwapEvent {
    pool_id: number;
    amount_in: string;
    amount_out: string;
    trader: string;
    timestamp: number;
}

export function useRealtimePool(poolId: number) {
    const [pool, setPool] = useState<PoolUpdate | null>(null);
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [lastUpdate, setLastUpdate] = useState<number>(0);

    useEffect(() => {
        // Initialize socket connection
        const newSocket = io(process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3000', {
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionAttempts: 5,
        });

        newSocket.on('connect', () => {
            console.log('✅ WebSocket connected');
            setIsConnected(true);
            // Subscribe to pool updates
            newSocket.emit('subscribe:pool', poolId);
        });

        newSocket.on('disconnect', () => {
            console.log('❌ WebSocket disconnected');
            setIsConnected(false);
        });

        newSocket.on('pool:updated', (data: PoolUpdate) => {
            if (data.pool_id === poolId) {
                setPool(data);
                setLastUpdate(Date.now());
            }
        });

        setSocket(newSocket);

        return () => {
            if (newSocket) {
                newSocket.emit('unsubscribe:pool', poolId);
                newSocket.close();
            }
        };
    }, [poolId]);

    return { pool, isConnected, lastUpdate, socket };
}

export function useRealtimeSwaps(poolId?: number) {
    const [swaps, setSwaps] = useState<SwapEvent[]>([]);
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        const newSocket = io(process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3000', {
            transports: ['websocket', 'polling'],
        });

        newSocket.on('connect', () => {
            setIsConnected(true);
            if (poolId) {
                newSocket.emit('subscribe:pool', poolId);
            } else {
                newSocket.emit('subscribe:all-pools');
            }
        });

        newSocket.on('disconnect', () => {
            setIsConnected(false);
        });

        newSocket.on('swap:executed', (data: SwapEvent) => {
            if (!poolId || data.pool_id === poolId) {
                setSwaps(prev => [data, ...prev].slice(0, 50)); // Keep last 50 swaps
            }
        });

        setSocket(newSocket);

        return () => {
            if (newSocket) {
                if (poolId) {
                    newSocket.emit('unsubscribe:pool', poolId);
                }
                newSocket.close();
            }
        };
    }, [poolId]);

    const clearSwaps = useCallback(() => {
        setSwaps([]);
    }, []);

    return { swaps, isConnected, clearSwaps, socket };
}

export function useRealtimeAllPools() {
    const [pools, setPools] = useState<Map<number, PoolUpdate>>(new Map());
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        const newSocket = io(process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3000', {
            transports: ['websocket', 'polling'],
        });

        newSocket.on('connect', () => {
            setIsConnected(true);
            newSocket.emit('subscribe:all-pools');
        });

        newSocket.on('disconnect', () => {
            setIsConnected(false);
        });

        newSocket.on('pool:updated', (data: PoolUpdate) => {
            setPools(prev => {
                const updated = new Map(prev);
                updated.set(data.pool_id, data);
                return updated;
            });
        });

        setSocket(newSocket);

        return () => {
            if (newSocket) {
                newSocket.close();
            }
        };
    }, []);

    return {
        pools: Array.from(pools.values()),
        poolsMap: pools,
        isConnected,
        socket
    };
}
