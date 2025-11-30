'use client';

import { RealtimePoolCard } from '@/components/realtime-pool-card';
import { RealtimeSwapFeed } from '@/components/realtime-swap-feed';
import { WalletButton } from '@/components/wallet-button';
import { useRealtimeAllPools } from '@/hooks/use-realtime-pool';
import { useState, useEffect } from 'react';

export default function RealTimeDemoPage() {
    const { pools, isConnected } = useRealtimeAllPools();
    const [wsStats, setWsStats] = useState<any>(null);

    useEffect(() => {
        // Fetch WebSocket stats
        const fetchStats = async () => {
            try {
                const res = await fetch('/api/ws-stats');
                const data = await res.json();
                setWsStats(data.stats);
            } catch (error) {
                console.error('Failed to fetch WS stats:', error);
            }
        };

        fetchStats();
        const interval = setInterval(fetchStats, 5000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
            <div className="container mx-auto px-4 py-8">
                {/* Header */}
                <div className="mb-8 text-center">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                SuiSwap India - Live Crypto Exchange
                            </h1>
                            <p className="text-gray-600 dark:text-gray-400 mt-2">
                                Trade cryptocurrencies with INR • Real-time updates • Secure transactions
                            </p>
                        </div>
                        <WalletButton />
                    </div>

                    {/* Connection Status Banner */}
                    <div className={`inline-flex items-center gap-3 px-6 py-3 rounded-full ${isConnected
                        ? 'bg-green-100 dark:bg-green-900/30 border-2 border-green-500'
                        : 'bg-red-100 dark:bg-red-900/30 border-2 border-red-500'
                        }`}>
                        <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                        <span className={`font-semibold ${isConnected ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
                            {isConnected ? '🟢 WebSocket Connected' : '🔴 WebSocket Disconnected'}
                        </span>
                        {wsStats && (
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                                ({wsStats.connected_clients} clients, {wsStats.active_rooms} rooms)
                            </span>
                        )}
                    </div>
                </div>

                {/* Feature Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
                        <div className="text-3xl mb-2">⚡</div>
                        <h3 className="font-bold text-lg mb-1">Instant Updates</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            Real-time price updates powered by WebSocket technology
                        </p>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
                        <div className="text-3xl mb-2">🇮🇳</div>
                        <h3 className="font-bold text-lg mb-1">INR Trading Pairs</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            Trade major cryptocurrencies directly with Indian Rupee
                        </p>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
                        <div className="text-3xl mb-2">🔒</div>
                        <h3 className="font-bold text-lg mb-1">Secure Wallet</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            Connect your Sui wallet for secure and fast transactions
                        </p>
                    </div>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Live Pools */}
                    <div className="lg:col-span-2">
                        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                            <span className="text-2xl">📊</span>
                            Live Pools
                            <span className="text-sm font-normal text-gray-500">({pools.length} active)</span>
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {pools.length > 0 ? (
                                pools.map((pool) => (
                                    <RealtimePoolCard key={pool.pool_id} poolId={pool.pool_id} />
                                ))
                            ) : (
                                <div className="col-span-2 bg-white dark:bg-gray-800 rounded-xl p-8 text-center text-gray-500">
                                    No pools available. Start the server to see live pools!
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Live Swap Feed */}
                    <div>
                        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                            <span className="text-2xl">💱</span>
                            Live Swaps
                        </h2>
                        <RealtimeSwapFeed />
                    </div>
                </div>

                {/* SSE Information Section */}
                <div className="mt-8 bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
                    <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                        <span className="text-2xl">📡</span>
                        Real-Time Technology
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                        Our platform uses cutting-edge WebSocket and Server-Sent Events (SSE) for instant price updates:
                    </p>
                    <div className="bg-gray-100 dark:bg-gray-900 rounded p-4 font-mono text-sm">
                        <code className="text-blue-600 dark:text-blue-400">
                            ✓ WebSocket for bi-directional real-time communication
                        </code>
                        <br />
                        <code className="text-green-600 dark:text-green-400">
                            ✓ SSE for continuous data streaming
                        </code>
                    </div>
                </div>

                {/* Footer Stats */}
                <div className="mt-8 text-center text-sm text-gray-500">
                    <p>⚡ All price updates happen in <strong>real-time</strong> with zero delay</p>
                    <p className="mt-1">Built with Next.js 15 • Socket.IO • Sui Blockchain</p>
                </div>
            </div>
        </div>
    );
}
