import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { pools, tokens } from '@/db/schema';
import { eq, and, or } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tokenASymbol, tokenBSymbol } = body;

    // Validate required parameters
    if (!tokenASymbol) {
      return NextResponse.json(
        { 
          error: 'tokenASymbol is required',
          code: 'MISSING_TOKEN_A_SYMBOL' 
        },
        { status: 400 }
      );
    }

    if (!tokenBSymbol) {
      return NextResponse.json(
        { 
          error: 'tokenBSymbol is required',
          code: 'MISSING_TOKEN_B_SYMBOL' 
        },
        { status: 400 }
      );
    }

    // Normalize token symbols
    const normalizedTokenASymbol = tokenASymbol.trim().toUpperCase();
    const normalizedTokenBSymbol = tokenBSymbol.trim().toUpperCase();

    // Find token IDs for both symbols
    const tokenAResult = await db
      .select()
      .from(tokens)
      .where(eq(tokens.symbol, normalizedTokenASymbol))
      .limit(1);

    if (tokenAResult.length === 0) {
      return NextResponse.json(
        { 
          error: `Token with symbol ${normalizedTokenASymbol} not found`,
          code: 'TOKEN_A_NOT_FOUND' 
        },
        { status: 404 }
      );
    }

    const tokenBResult = await db
      .select()
      .from(tokens)
      .where(eq(tokens.symbol, normalizedTokenBSymbol))
      .limit(1);

    if (tokenBResult.length === 0) {
      return NextResponse.json(
        { 
          error: `Token with symbol ${normalizedTokenBSymbol} not found`,
          code: 'TOKEN_B_NOT_FOUND' 
        },
        { status: 404 }
      );
    }

    const tokenA = tokenAResult[0];
    const tokenB = tokenBResult[0];

    // Search for pool with matching token pair (check both directions)
    const poolResult = await db
      .select({
        pool: pools,
        tokenA: tokens,
        tokenB: tokens,
      })
      .from(pools)
      .leftJoin(tokens, eq(pools.tokenAId, tokens.id))
      .where(
        or(
          and(
            eq(pools.tokenAId, tokenA.id),
            eq(pools.tokenBId, tokenB.id)
          ),
          and(
            eq(pools.tokenAId, tokenB.id),
            eq(pools.tokenBId, tokenA.id)
          )
        )
      )
      .limit(1);

    if (poolResult.length === 0) {
      return NextResponse.json(
        { 
          error: `No pool found for token pair ${normalizedTokenASymbol}/${normalizedTokenBSymbol}`,
          code: 'POOL_NOT_FOUND' 
        },
        { status: 404 }
      );
    }

    // Get full token details for both tokens in the pool
    const pool = poolResult[0].pool;
    
    const tokenADetails = await db
      .select()
      .from(tokens)
      .where(eq(tokens.id, pool.tokenAId))
      .limit(1);

    const tokenBDetails = await db
      .select()
      .from(tokens)
      .where(eq(tokens.id, pool.tokenBId))
      .limit(1);

    // Construct response with full pool and token details
    const poolWithTokens = {
      ...pool,
      tokenA: tokenADetails[0],
      tokenB: tokenBDetails[0],
    };

    return NextResponse.json(poolWithTokens, { status: 200 });

  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
      },
      { status: 500 }
    );
  }
}