'use client';

import { useSui } from '@/providers/SuiProvider';
import { useState } from 'react';

export function WalletButton() {
    const { account, connect, disconnect, isConnected, formatAddress } = useSui();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    if (isConnected && account) {
        return (
            <div className="relative">
                <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-medium hover:from-blue-600 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
                >
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                    <span className="font-mono text-sm">
                        {formatAddress(account.address)}
                    </span>
                </button>

                {isDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50">
                        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Connected Address</p>
                            <p className="font-mono text-xs break-all">{account.address}</p>
                        </div>
                        <button
                            onClick={() => {
                                disconnect();
                                setIsDropdownOpen(false);
                            }}
                            className="w-full px-4 py-3 text-left text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        >
                            Disconnect Wallet
                        </button>
                    </div>
                )}
            </div>
        );
    }

    return (
        <button
            onClick={() => connect()}
            className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-medium hover:from-blue-600 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl"
        >
            Connect Wallet
        </button>
    );
}
