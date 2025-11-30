import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { positions, pools, tokens } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userAddress = searchParams.get('userAddress');
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '50'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');

    // Build the base query
    let query = db
      .select()
      .from(positions)
      .orderBy(desc(positions.createdAt))
      .limit(limit)
      .offset(offset);

    // Apply userAddress filter if provided
    if (userAddress) {
      query = query.where(eq(positions.ownerAddress, userAddress));
    }

    const positionsData = await query;

    // Enrich each position with pool and token details
    const enrichedPositions = await Promise.all(
      positionsData.map(async (position) => {
        // Get pool details
        const [poolData] = await db
          .select()
          .from(pools)
          .where(eq(pools.id, position.poolId))
          .limit(1);

        if (!poolData) {
          return {
            ...position,
            pool: null,
          };
        }

        // Get tokenA details
        const [tokenAData] = await db
          .select()
          .from(tokens)
          .where(eq(tokens.id, poolData.tokenAId))
          .limit(1);

        // Get tokenB details
        const [tokenBData] = await db
          .select()
          .from(tokens)
          .where(eq(tokens.id, poolData.tokenBId))
          .limit(1);

        return {
          id: position.id.toString(),
          poolId: position.poolId.toString(),
          pool: {
            ...poolData,
            id: poolData.id.toString(),
            tokenA: tokenAData || null,
            tokenB: tokenBData || null,
            createdAt: new Date(poolData.createdAt).getTime(),
          },
          liquidity: position.liquidity,
          owner: position.ownerAddress,
          createdAt: new Date(position.createdAt).getTime(),
          lastFeeClaim: new Date(position.lastFeeClaim).getTime(),
          accumulatedFeesA: position.accumulatedFeesA,
          accumulatedFeesB: position.accumulatedFeesB,
          sharePercentage: position.sharePercentage,
          valueUSD: position.valueUsd,
        };
      })
    );

    return NextResponse.json(enrichedPositions, { status: 200 });
  } catch (error) {
    console.error('GET positions error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error'),
        code: 'INTERNAL_SERVER_ERROR',
      },
      { status: 500 }
    );
  }
}