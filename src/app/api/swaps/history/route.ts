import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { swaps, tokens, pools } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '50'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const userAddress = searchParams.get('userAddress');

    // Build base query with joins
    let query = db
      .select({
        id: swaps.id,
        poolId: swaps.poolId,
        userAddress: swaps.userAddress,
        tokenInId: swaps.tokenInId,
        tokenOutId: swaps.tokenOutId,
        amountIn: swaps.amountIn,
        amountOut: swaps.amountOut,
        fee: swaps.fee,
        priceImpact: swaps.priceImpact,
        txDigest: swaps.txDigest,
        createdAt: swaps.createdAt,
        tokenIn: {
          id: tokens.id,
          symbol: tokens.symbol,
          name: tokens.name,
          decimals: tokens.decimals,
          address: tokens.address,
          logoUrl: tokens.logoUrl,
        },
        tokenOut: {
          id: tokens.id,
          symbol: tokens.symbol,
          name: tokens.name,
          decimals: tokens.decimals,
          address: tokens.address,
          logoUrl: tokens.logoUrl,
        },
        pool: {
          id: pools.id,
          tokenAId: pools.tokenAId,
          tokenBId: pools.tokenBId,
          reserveA: pools.reserveA,
          reserveB: pools.reserveB,
          feeTier: pools.feeTier,
          totalSupply: pools.totalSupply,
          tvl: pools.tvl,
          volume24h: pools.volume24h,
          apy: pools.apy,
        },
      })
      .from(swaps);

    // Manual joins using subqueries for tokenIn, tokenOut, and pool
    const swapRecords = await db
      .select()
      .from(swaps)
      .where(userAddress ? eq(swaps.userAddress, userAddress) : undefined)
      .orderBy(desc(swaps.createdAt))
      .limit(limit)
      .offset(offset);

    // Fetch related data for each swap
    const enrichedSwaps = await Promise.all(
      swapRecords.map(async (swap) => {
        // Get tokenIn details
        const tokenInResult = await db
          .select()
          .from(tokens)
          .where(eq(tokens.id, swap.tokenInId))
          .limit(1);
        
        // Get tokenOut details
        const tokenOutResult = await db
          .select()
          .from(tokens)
          .where(eq(tokens.id, swap.tokenOutId))
          .limit(1);
        
        // Get pool details
        const poolResult = await db
          .select()
          .from(pools)
          .where(eq(pools.id, swap.poolId))
          .limit(1);

        return {
          id: swap.id,
          poolId: swap.poolId,
          userAddress: swap.userAddress,
          tokenInId: swap.tokenInId,
          tokenOutId: swap.tokenOutId,
          amountIn: swap.amountIn,
          amountOut: swap.amountOut,
          fee: swap.fee,
          priceImpact: swap.priceImpact,
          txDigest: swap.txDigest,
          createdAt: swap.createdAt,
          tokenIn: tokenInResult[0] || null,
          tokenOut: tokenOutResult[0] || null,
          pool: poolResult[0] || null,
        };
      })
    );

    return NextResponse.json(enrichedSwaps, { status: 200 });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error'),
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    );
  }
}