import { db } from '@/db';
import { swaps } from '@/db/schema';

async function main() {
    const now = new Date();
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString();
    const threeHoursAgo = new Date(now.getTime() - 3 * 60 * 60 * 1000).toISOString();
    const fiveHoursAgo = new Date(now.getTime() - 5 * 60 * 60 * 1000).toISOString();
    const twelveHoursAgo = new Date(now.getTime() - 12 * 60 * 60 * 1000).toISOString();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

    const sampleSwaps = [
        {
            poolId: 1,
            userAddress: '0x742d35cc6634c0532925a3b844bc454e4438f44e',
            tokenInId: 1,
            tokenOutId: 2,
            amountIn: '1000000000000',
            amountOut: '1997000000',
            fee: '3000000',
            priceImpact: 0.15,
            txDigest: '0xabc123def456789012345678901234567890123456789012345678901234abcd',
            createdAt: twoHoursAgo,
        },
        {
            poolId: 2,
            userAddress: '0x8ba1f109551bd432803012645ac136ddd64dba72',
            tokenInId: 2,
            tokenOutId: 3,
            amountIn: '5000000000',
            amountOut: '4999750000',
            fee: '250000',
            priceImpact: 0.003,
            txDigest: '0xdef789abc123456789012345678901234567890123456789012345678901def7',
            createdAt: fiveHoursAgo,
        },
        {
            poolId: 3,
            userAddress: '0x742d35cc6634c0532925a3b844bc454e4438f44e',
            tokenInId: 4,
            tokenOutId: 2,
            amountIn: '5000000000000000000',
            amountOut: '9985000000',
            fee: '30000000',
            priceImpact: 0.08,
            txDigest: '0x123abc456def789012345678901234567890123456789012345678901234567a',
            createdAt: oneDayAgo,
        },
        {
            poolId: 4,
            userAddress: '0x3fc91a3afd70395cd496c647d5a6cc9d4b2b7fad',
            tokenInId: 5,
            tokenOutId: 2,
            amountIn: '50000000',
            amountOut: '24925000000',
            fee: '75000000',
            priceImpact: 0.05,
            txDigest: '0x456def789abc123456789012345678901234567890123456789012345678456d',
            createdAt: twelveHoursAgo,
        },
        {
            poolId: 1,
            userAddress: '0x8ba1f109551bd432803012645ac136ddd64dba72',
            tokenInId: 2,
            tokenOutId: 1,
            amountIn: '3000000000',
            amountOut: '1496010000000',
            fee: '4500000',
            priceImpact: 0.12,
            txDigest: '0x789def123abc456789012345678901234567890123456789012345678901789e',
            createdAt: threeHoursAgo,
        },
    ];

    await db.insert(swaps).values(sampleSwaps);
    
    console.log('✅ Swaps seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});