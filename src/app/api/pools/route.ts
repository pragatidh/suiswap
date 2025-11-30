import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { pools, tokens } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    // Fetch all pools with token details joined
    const allPools = await db
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
      .orderBy(desc(pools.tvl));

    // Fetch tokenB details separately for each pool
    const poolsWithTokens = await Promise.all(
      allPools.map(async (pool) => {
        const tokenB = await db
          .select()
          .from(tokens)
          .where(eq(tokens.id, pool.tokenBId))
          .limit(1);

        return {
          id: pool.id,
          tokenAId: pool.tokenAId,
          tokenBId: pool.tokenBId,
          reserveA: pool.reserveA,
          reserveB: pool.reserveB,
          feeTier: pool.feeTier,
          totalSupply: pool.totalSupply,
          tvl: pool.tvl,
          volume24h: pool.volume24h,
          apy: pool.apy,
          createdAt: pool.createdAt,
          updatedAt: pool.updatedAt,
          tokenA: pool.tokenA,
          tokenB: tokenB[0] || null,
        };
      })
    );

    return NextResponse.json(poolsWithTokens, { status: 200 });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error: ' + (error as Error).message,
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tokenAId, tokenBId, feeTier, reserveA, reserveB, tvl, apy } = body;

    // Validate required fields
    if (!tokenAId) {
      return NextResponse.json(
        {
          error: 'tokenAId is required',
          code: 'MISSING_TOKEN_A_ID',
        },
        { status: 400 }
      );
    }

    if (!tokenBId) {
      return NextResponse.json(
        {
          error: 'tokenBId is required',
          code: 'MISSING_TOKEN_B_ID',
        },
        { status: 400 }
      );
    }

    if (feeTier === undefined || feeTier === null) {
      return NextResponse.json(
        {
          error: 'feeTier is required',
          code: 'MISSING_FEE_TIER',
        },
        { status: 400 }
      );
    }

    if (!reserveA) {
      return NextResponse.json(
        {
          error: 'reserveA is required',
          code: 'MISSING_RESERVE_A',
        },
        { status: 400 }
      );
    }

    if (!reserveB) {
      return NextResponse.json(
        {
          error: 'reserveB is required',
          code: 'MISSING_RESERVE_B',
        },
        { status: 400 }
      );
    }

    if (tvl === undefined || tvl === null) {
      return NextResponse.json(
        {
          error: 'tvl is required',
          code: 'MISSING_TVL',
        },
        { status: 400 }
      );
    }

    if (apy === undefined || apy === null) {
      return NextResponse.json(
        {
          error: 'apy is required',
          code: 'MISSING_APY',
        },
        { status: 400 }
      );
    }

    // Validate tokenAId and tokenBId are integers
    const parsedTokenAId = parseInt(tokenAId);
    const parsedTokenBId = parseInt(tokenBId);

    if (isNaN(parsedTokenAId)) {
      return NextResponse.json(
        {
          error: 'tokenAId must be a valid integer',
          code: 'INVALID_TOKEN_A_ID',
        },
        { status: 400 }
      );
    }

    if (isNaN(parsedTokenBId)) {
      return NextResponse.json(
        {
          error: 'tokenBId must be a valid integer',
          code: 'INVALID_TOKEN_B_ID',
        },
        { status: 400 }
      );
    }

    // Validate that both tokens exist
    const tokenA = await db
      .select()
      .from(tokens)
      .where(eq(tokens.id, parsedTokenAId))
      .limit(1);

    if (tokenA.length === 0) {
      return NextResponse.json(
        {
          error: 'Token A not found',
          code: 'TOKEN_A_NOT_FOUND',
        },
        { status: 400 }
      );
    }

    const tokenB = await db
      .select()
      .from(tokens)
      .where(eq(tokens.id, parsedTokenBId))
      .limit(1);

    if (tokenB.length === 0) {
      return NextResponse.json(
        {
          error: 'Token B not found',
          code: 'TOKEN_B_NOT_FOUND',
        },
        { status: 400 }
      );
    }

    // Create new pool with auto-generated fields
    const timestamp = new Date().toISOString();
    const newPool = await db
      .insert(pools)
      .values({
        tokenAId: parsedTokenAId,
        tokenBId: parsedTokenBId,
        feeTier: parseInt(feeTier),
        reserveA: String(reserveA),
        reserveB: String(reserveB),
        tvl: parseFloat(tvl),
        apy: parseFloat(apy),
        totalSupply: '1000000',
        volume24h: 0,
        createdAt: timestamp,
        updatedAt: timestamp,
      })
      .returning();

    return NextResponse.json(newPool[0], { status: 201 });
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error: ' + (error as Error).message,
      },
      { status: 500 }
    );
  }
}