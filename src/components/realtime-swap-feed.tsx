'use client';

import { useRealtimeSwaps } from '@/hooks/use-realtime-pool';
import { useEffect, useRef } from 'react';

export function RealtimeSwapFeed({ poolId }: { poolId?: number }) {
    const { swaps, isConnected } = useRealtimeSwaps(poolId);
    const feedRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to top on new swap
    useEffect(() => {
        if (feedRef.current && swaps.length > 0) {
            feedRef.current.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }, [swaps]);

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    Live Swap Feed
                </h3>
                <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
                    <span className={`text-xs font-medium ${isConnected ? 'text-green-600 dark:text-green-400' : 'text-gray-500'}`}>
                        {isConnected ? 'Live' : 'Offline'}
                    </span>
                    {swaps.length > 0 && (
                        <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                            {swaps.length} {swaps.length === 1 ? 'swap' : 'swaps'}
                        </span>
                    )}
                </div>
            </div>

            {/* Swap List */}
            <div
                ref={feedRef}
                className="space-y-2 max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600"
            >
                {swaps.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                        <p className="text-sm">Waiting for swaps...</p>
                        <p className="text-xs mt-1">Execute a swap to see live updates!</p>
                    </div>
                ) : (
                    swaps.map((swap, index) => (
                        <div
                            key={`${swap.timestamp}-${index}`}
                            className="p-3 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg border border-blue-200 dark:border-blue-800 animate-fadeIn"
                        >
                            <div className="flex justify-between items-start mb-2">
                                <div className="flex-1">
                                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                                        Pool #{swap.pool_id}
                                    </p>
                                    <p className="font-mono text-xs text-gray-700 dark:text-gray-300">
                                        {swap.trader.slice(0, 8)}...{swap.trader.slice(-6)}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-gray-500">
                                        {new Date(swap.timestamp).toLocaleTimeString()}
                                    </p>
                                </div>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <div>
                                    <span className="text-red-600 dark:text-red-400">-{swap.amount_in}</span>
                                </div>
                                <div className="text-xs text-gray-400">→</div>
                                <div>
                                    <span className="text-green-600 dark:text-green-400">+{swap.amount_out}</span>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
