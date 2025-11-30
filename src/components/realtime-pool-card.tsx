'use client';

import { useRealtimePool } from '@/hooks/use-realtime-pool';
import { useEffect, useState } from 'react';

interface Pool {
    id: number;
    token_a_id: number;
    token_b_id: number;
    reserve_a: string;
    reserve_b: string;
    total_shares: string;
    fee_percentage: string;
    fee_per_share: number;
    token_a?: { symbol: string; decimals: number };
    token_b?: { symbol: string; decimals: number };
}

export function RealtimePoolCard({ poolId }: { poolId: number }) {
    const { pool: realtimeUpdate, isConnected, lastUpdate } = useRealtimePool(poolId);
    const [pool, setPool] = useState<Pool | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Fetch initial pool data
    useEffect(() => {
        fetch(`/api/pools/${poolId}`)
            .then(res => res.json())
            .then(data => {
                setPool(data.pool);
                setIsLoading(false);
            })
            .catch(err => {
                console.error('Failed to fetch pool:', err);
                setIsLoading(false);
            });
    }, [poolId]);

    // Update pool when real-time data arrives
    useEffect(() => {
        if (realtimeUpdate && pool) {
            setPool(prev => ({
                ...prev!,
                reserve_a: realtimeUpdate.reserve_a || prev!.reserve_a,
                reserve_b: realtimeUpdate.reserve_b || prev!.reserve_b,
                fee_per_share: realtimeUpdate.fee_per_share ?? prev!.fee_per_share,
            }));
        }
    }, [realtimeUpdate, pool]);

    if (isLoading) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 animate-pulse">
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
            </div>
        );
    }

    if (!pool) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <p className="text-red-500">Pool not found</p>
            </div>
        );
    }

    const price = pool.reserve_b && pool.reserve_a
        ? (BigInt(pool.reserve_b) / BigInt(pool.reserve_a)).toString()
        : '0';

    const secondsSinceUpdate = lastUpdate
        ? Math.floor((Date.now() - lastUpdate) / 1000)
        : 0;

    return (
        <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    {pool.token_a?.symbol || 'Token A'} / {pool.token_b?.symbol || 'Token B'}
                </h3>
                <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
                    <span className={`text-xs font-medium ${isConnected ? 'text-green-600 dark:text-green-400' : 'text-gray-500'}`}>
                        {isConnected ? 'Live' : 'Offline'}
                    </span>
                </div>
            </div>

            {/* Pool Stats */}
            <div className="space-y-3">
                <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Reserve {pool.token_a?.symbol}</span>
                    <span className="font-mono text-sm font-medium">{pool.reserve_a}</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Reserve {pool.token_b?.symbol}</span>
                    <span className="font-mono text-sm font-medium">{pool.reserve_b}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-gray-200 dark:border-gray-700">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Price</span>
                    <span className="font-mono text-lg font-bold text-blue-600 dark:text-blue-400">
                        {price}
                    </span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Fee</span>
                    <span className="font-mono text-sm">{pool.fee_percentage}%</span>
                </div>
            </div>

            {/* Last Update Indicator */}
            {lastUpdate > 0 && (
                <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-xs text-gray-500 text-center">
                        Updated {secondsSinceUpdate}s ago
                    </p>
                </div>
            )}
        </div>
    );
}
