import { db } from '@/db';
import { tokens } from '@/db/schema';

async function main() {
    const sampleTokens = [
        {
            symbol: 'INR',
            name: 'Indian Rupee',
            decimals: 2,
            address: '0xinr::rupee::INR',
            logoUrl: 'https://flagcdn.com/w40/in.png',
            createdAt: new Date('2024-01-15T10:00:00.000Z').toISOString(),
        },
        {
            symbol: 'USDT',
            name: 'Tether USD',
            decimals: 6,
            address: '0xdac17f958d2ee523a2206206994597c13d831ec7',
            logoUrl: 'https://cryptologos.cc/logos/tether-usdt-logo.png',
            createdAt: new Date('2024-01-15T10:05:00.000Z').toISOString(),
        },
        {
            symbol: 'BTC',
            name: 'Bitcoin',
            decimals: 8,
            address: '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599',
            logoUrl: 'https://cryptologos.cc/logos/bitcoin-btc-logo.png',
            createdAt: new Date('2024-01-15T10:10:00.000Z').toISOString(),
        },
        {
            symbol: 'ETH',
            name: 'Ethereum',
            decimals: 18,
            address: '0x0000000000000000000000000000000000000000',
            logoUrl: 'https://cryptologos.cc/logos/ethereum-eth-logo.png',
            createdAt: new Date('2024-01-15T10:15:00.000Z').toISOString(),
        },
        {
            symbol: 'SUI',
            name: 'Sui',
            decimals: 9,
            address: '0x2::sui::SUI',
            logoUrl: 'https://cryptologos.cc/logos/sui-sui-logo.png',
            createdAt: new Date('2024-01-15T10:20:00.000Z').toISOString(),
        },
    ];

    await db.insert(tokens).values(sampleTokens);

    console.log('✅ Tokens seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});