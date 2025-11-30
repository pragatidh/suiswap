import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { positions, pools } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { poolId, amountA, amountB, userAddress } = body;

        if (!poolId || !amountA || !amountB || !userAddress) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Get pool details to calculate values
        const [pool] = await db
            .select()
            .from(pools)
            .where(eq(pools.id, parseInt(poolId)))
            .limit(1);

        if (!pool) {
            return NextResponse.json(
                { error: 'Pool not found' },
                { status: 404 }
            );
        }

        // Simulate calculations
        // In a real AMM, this would be based on the pool's total supply and reserves
        const liquidity = (parseFloat(amountA) + parseFloat(amountB)).toString(); // Simplified
        const valueUsd = parseFloat(amountA) + parseFloat(amountB); // Simplified (assuming 1:1 for demo)
        const sharePercentage = 10.0; // Fixed for demo
        const shares = 100.0; // Fixed for demo

        // Insert new position
        const [newPosition] = await db
            .insert(positions)
            .values({
                poolId: parseInt(poolId),
                ownerAddress: userAddress,
                liquidity: liquidity,
                accumulatedFeesA: "0",
                accumulatedFeesB: "0",
                sharePercentage: sharePercentage,
                valueUsd: valueUsd,
                shares: shares,
                createdAt: new Date().toISOString(),
                lastFeeClaim: new Date().toISOString(),
                mintPending: false, // Simulated instant mint
            })
            .returning();

        return NextResponse.json(newPosition, { status: 201 });
    } catch (error) {
        console.error('Add liquidity error:', error);
        return NextResponse.json(
            {
                error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error'),
            },
            { status: 500 }
        );
    }
}
