import { db } from '@/db';
import { pools } from '@/db/schema';

async function main() {
    const samplePools = [
        {
            // INR/USDT Pool - Most liquid pair for Indian traders
            tokenAId: 1, // INR
            tokenBId: 2, // USDT
            reserveA: '8500000000', // 85 Crore INR (850 million with 2 decimals)
            reserveB: '10000000000000', // 10M USDT (with 6 decimals)
            feeTier: 5,
            totalSupply: '9219544457',
            tvl: 170000000.0, // 170 Crore INR
            volume24h: 25000000.0, // 25 Crore INR daily volume
            apy: 12.5,
            createdAt: new Date('2024-01-15T10:00:00Z').toISOString(),
            updatedAt: new Date('2024-01-15T10:00:00Z').toISOString(),
        },
        {
            // INR/BTC Pool - Premium cryptocurrency
            tokenAId: 1, // INR
            tokenBId: 3, // BTC
            reserveA: '50000000000', // 500 Crore INR
            reserveB: '6000000000', // 60 BTC (with 8 decimals, ~₹75L each)
            feeTier: 30,
            totalSupply: '17320508075',
            tvl: 1000000000.0, // 1000 Crore INR
            volume24h: 80000000.0, // 80 Crore INR daily volume
            apy: 18.7,
            createdAt: new Date('2024-01-16T12:00:00Z').toISOString(),
            updatedAt: new Date('2024-01-16T12:00:00Z').toISOString(),
        },
        {
            // INR/ETH Pool - Popular DeFi token
            tokenAId: 1, // INR
            tokenBId: 4, // ETH
            reserveA: '25000000000', // 250 Crore INR
            reserveB: '1000000000000000000000', // 1000 ETH (with 18 decimals, ~₹2.5L each)
            feeTier: 30,
            totalSupply: '15811388300',
            tvl: 500000000.0, // 500 Crore INR
            volume24h: 45000000.0, // 45 Crore INR daily volume
            apy: 22.3,
            createdAt: new Date('2024-01-17T14:00:00Z').toISOString(),
            updatedAt: new Date('2024-01-17T14:00:00Z').toISOString(),
        },
        {
            // INR/SUI Pool - Native Sui blockchain token
            tokenAId: 1, // INR
            tokenBId: 5, // SUI
            reserveA: '15000000000', // 150 Crore INR
            reserveB: '2000000000000000000', // 2B SUI (with 9 decimals, ~₹75 each)
            feeTier: 30,
            totalSupply: '17320508075',
            tvl: 300000000.0, // 300 Crore INR
            volume24h: 30000000.0, // 30 Crore INR daily volume
            apy: 25.5,
            createdAt: new Date('2024-01-18T16:00:00Z').toISOString(),
            updatedAt: new Date('2024-01-18T16:00:00Z').toISOString(),
        }
    ];

    await db.insert(pools).values(samplePools);

    console.log('✅ Pools seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});