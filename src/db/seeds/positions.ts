import { db } from '@/db';
import { positions } from '@/db/schema';

async function main() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const fifteenDaysAgo = new Date();
    fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);
    
    const now = new Date();

    const samplePositions = [
        {
            poolId: 1,
            ownerAddress: '0x7a250d5630b4cf539739df2c5dacb4c659f2488d',
            liquidity: '7071067811',
            accumulatedFeesA: '125000000000',
            accumulatedFeesB: '50000000',
            sharePercentage: 10.0,
            valueUsd: 20000000.0,
            createdAt: now.toISOString(),
            lastFeeClaim: thirtyDaysAgo.toISOString(),
        },
        {
            poolId: 3,
            ownerAddress: '0x3fc91a3afd70395cd496c647d5a6cc9d4b2b7fad',
            liquidity: '2121320343',
            accumulatedFeesA: '3000000000000000000',
            accumulatedFeesB: '6000000',
            sharePercentage: 5.0,
            valueUsd: 6000000.0,
            createdAt: now.toISOString(),
            lastFeeClaim: fifteenDaysAgo.toISOString(),
        },
    ];

    await db.insert(positions).values(samplePositions);
    
    console.log('✅ Positions seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});