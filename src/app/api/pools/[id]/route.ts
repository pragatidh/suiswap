import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { pools, tokens } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Validate ID parameter
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { 
          error: 'Valid pool ID is required',
          code: 'INVALID_ID' 
        },
        { status: 400 }
      );
    }

    const poolId = parseInt(id);

    // Query pool with joined token details
    const poolWithTokens = await db
      .select({
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
        createdAt: pools.createdAt,
        updatedAt: pools.updatedAt,
        tokenA: {
          id: tokens.id,
          symbol: tokens.symbol,
          name: tokens.name,
          decimals: tokens.decimals,
          address: tokens.address,
          logoUrl: tokens.logoUrl,
          createdAt: tokens.createdAt,
        },
      })
      .from(pools)
      .leftJoin(tokens, eq(pools.tokenAId, tokens.id))
      .where(eq(pools.id, poolId))
      .limit(1);

    // Check if pool exists
    if (poolWithTokens.length === 0) {
      return NextResponse.json(
        { 
          error: 'Pool not found',
          code: 'POOL_NOT_FOUND' 
        },
        { status: 404 }
      );
    }

    const poolData = poolWithTokens[0];

    // Get tokenB details separately
    const tokenBData = await db
      .select({
        id: tokens.id,
        symbol: tokens.symbol,
        name: tokens.name,
        decimals: tokens.decimals,
        address: tokens.address,
        logoUrl: tokens.logoUrl,
        createdAt: tokens.createdAt,
      })
      .from(tokens)
      .where(eq(tokens.id, poolData.tokenBId))
      .limit(1);

    // Construct final response with both token details
    const pool = {
      id: poolData.id,
      tokenAId: poolData.tokenAId,
      tokenBId: poolData.tokenBId,
      reserveA: poolData.reserveA,
      reserveB: poolData.reserveB,
      feeTier: poolData.feeTier,
      totalSupply: poolData.totalSupply,
      tvl: poolData.tvl,
      volume24h: poolData.volume24h,
      apy: poolData.apy,
      createdAt: poolData.createdAt,
      updatedAt: poolData.updatedAt,
      tokenA: poolData.tokenA,
      tokenB: tokenBData.length > 0 ? tokenBData[0] : null,
    };

    return NextResponse.json(pool, { status: 200 });
  } catch (error) {
    console.error('GET pool by ID error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error: ' + (error as Error).message,
        code: 'INTERNAL_ERROR' 
      },
      { status: 500 }
    );
  }
}