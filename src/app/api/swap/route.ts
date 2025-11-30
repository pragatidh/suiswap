import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { swaps, pools, tokens } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      poolId,
      userAddress,
      tokenInId,
      tokenOutId,
      amountIn,
      amountOut,
      fee,
      priceImpact,
      txDigest
    } = body;

    // Validate all required fields
    if (!poolId) {
      return NextResponse.json({
        error: 'poolId is required',
        code: 'MISSING_POOL_ID'
      }, { status: 400 });
    }

    if (!userAddress || typeof userAddress !== 'string' || userAddress.trim() === '') {
      return NextResponse.json({
        error: 'userAddress is required',
        code: 'MISSING_USER_ADDRESS'
      }, { status: 400 });
    }

    if (!tokenInId) {
      return NextResponse.json({
        error: 'tokenInId is required',
        code: 'MISSING_TOKEN_IN_ID'
      }, { status: 400 });
    }

    if (!tokenOutId) {
      return NextResponse.json({
        error: 'tokenOutId is required',
        code: 'MISSING_TOKEN_OUT_ID'
      }, { status: 400 });
    }

    if (!amountIn || typeof amountIn !== 'string' || amountIn.trim() === '') {
      return NextResponse.json({
        error: 'amountIn is required',
        code: 'MISSING_AMOUNT_IN'
      }, { status: 400 });
    }

    if (!amountOut || typeof amountOut !== 'string' || amountOut.trim() === '') {
      return NextResponse.json({
        error: 'amountOut is required',
        code: 'MISSING_AMOUNT_OUT'
      }, { status: 400 });
    }

    if (!fee || typeof fee !== 'string' || fee.trim() === '') {
      return NextResponse.json({
        error: 'fee is required',
        code: 'MISSING_FEE'
      }, { status: 400 });
    }

    if (priceImpact === undefined || priceImpact === null) {
      return NextResponse.json({
        error: 'priceImpact is required',
        code: 'MISSING_PRICE_IMPACT'
      }, { status: 400 });
    }

    if (!txDigest || typeof txDigest !== 'string' || txDigest.trim() === '') {
      return NextResponse.json({
        error: 'txDigest is required',
        code: 'MISSING_TX_DIGEST'
      }, { status: 400 });
    }

    // Validate ID types
    const poolIdInt = parseInt(poolId);
    if (isNaN(poolIdInt)) {
      return NextResponse.json({
        error: 'poolId must be a valid integer',
        code: 'INVALID_POOL_ID'
      }, { status: 400 });
    }

    const tokenInIdInt = parseInt(tokenInId);
    if (isNaN(tokenInIdInt)) {
      return NextResponse.json({
        error: 'tokenInId must be a valid integer',
        code: 'INVALID_TOKEN_IN_ID'
      }, { status: 400 });
    }

    const tokenOutIdInt = parseInt(tokenOutId);
    if (isNaN(tokenOutIdInt)) {
      return NextResponse.json({
        error: 'tokenOutId must be a valid integer',
        code: 'INVALID_TOKEN_OUT_ID'
      }, { status: 400 });
    }

    // Validate priceImpact is a number
    const priceImpactFloat = parseFloat(priceImpact);
    if (isNaN(priceImpactFloat)) {
      return NextResponse.json({
        error: 'priceImpact must be a valid number',
        code: 'INVALID_PRICE_IMPACT'
      }, { status: 400 });
    }

    // Check if pool exists
    const poolExists = await db.select()
      .from(pools)
      .where(eq(pools.id, poolIdInt))
      .limit(1);

    if (poolExists.length === 0) {
      return NextResponse.json({
        error: 'Pool not found',
        code: 'POOL_NOT_FOUND'
      }, { status: 400 });
    }

    // Check if tokenIn exists
    const tokenInExists = await db.select()
      .from(tokens)
      .where(eq(tokens.id, tokenInIdInt))
      .limit(1);

    if (tokenInExists.length === 0) {
      return NextResponse.json({
        error: 'Token in not found',
        code: 'TOKEN_IN_NOT_FOUND'
      }, { status: 400 });
    }

    // Check if tokenOut exists
    const tokenOutExists = await db.select()
      .from(tokens)
      .where(eq(tokens.id, tokenOutIdInt))
      .limit(1);

    if (tokenOutExists.length === 0) {
      return NextResponse.json({
        error: 'Token out not found',
        code: 'TOKEN_OUT_NOT_FOUND'
      }, { status: 400 });
    }

    // Check if txDigest is unique
    const existingTx = await db.select()
      .from(swaps)
      .where(eq(swaps.txDigest, txDigest.trim()))
      .limit(1);

    if (existingTx.length > 0) {
      return NextResponse.json({
        error: 'Transaction digest already exists',
        code: 'DUPLICATE_TX_DIGEST'
      }, { status: 400 });
    }

    // Insert swap transaction
    const newSwap = await db.insert(swaps)
      .values({
        poolId: poolIdInt,
        userAddress: userAddress.trim(),
        tokenInId: tokenInIdInt,
        tokenOutId: tokenOutIdInt,
        amountIn: amountIn.trim(),
        amountOut: amountOut.trim(),
        fee: fee.trim(),
        priceImpact: priceImpactFloat,
        txDigest: txDigest.trim(),
        createdAt: new Date().toISOString()
      })
      .returning();

    return NextResponse.json(newSwap[0], { status: 201 });

  } catch (error: any) {
    console.error('POST error:', error);

    // Handle unique constraint violation for txDigest
    if (error.message && error.message.includes('UNIQUE constraint failed')) {
      return NextResponse.json({
        error: 'Transaction digest already exists',
        code: 'DUPLICATE_TX_DIGEST'
      }, { status: 400 });
    }

    // Handle foreign key constraint violations
    if (error.message && error.message.includes('FOREIGN KEY constraint failed')) {
      return NextResponse.json({
        error: 'Invalid pool, token in, or token out reference',
        code: 'INVALID_FOREIGN_KEY'
      }, { status: 400 });
    }

    return NextResponse.json({
      error: 'Internal server error: ' + error.message
    }, { status: 500 });
  }
}