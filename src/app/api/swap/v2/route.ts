import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { pools, swaps, tokens, priceFeeds } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { DecimalMath } from "@/lib/decimal-math";
import { IdempotencyHandler } from "@/lib/idempotency";
import Decimal from "decimal.js";

/**
 * Production-ready atomic swap endpoint
 * Features:
 * - Optimistic locking (version control)
 * - Idempotency support
 * - Deadline validation
 * - Server-side slippage protection
 * - fee_per_share accounting
 * - TWAP price feed recording
 * - Retry logic for concurrent updates
 */

const MAX_RETRIES = 3;
const PROTOCOL_FEE_RATE = 0.1; // 10% of swap fees go to protocol

interface SwapRequest {
  pool_id: number;
  trader: string;
  token_in_id: number;
  amount_in: string;
  min_amount_out: string;
  deadline: number;
  idempotency_key?: string;
  signature?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: SwapRequest = await request.json();

    // Validate required fields
    if (!body.pool_id || !body.trader || !body.token_in_id || !body.amount_in || !body.min_amount_out) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate deadline
    if (body.deadline && body.deadline < Date.now()) {
      return NextResponse.json(
        { error: "Transaction deadline exceeded" },
        { status: 400 }
      );
    }

    // Check idempotency
    if (body.idempotency_key) {
      const cached = await IdempotencyHandler.check(
        body.idempotency_key,
        "/api/swap/v2"
      );
      if (cached) {
        return NextResponse.json(cached);
      }
    }

    // Execute swap with retry logic for optimistic locking
    let result;
    let attempts = 0;
    let lastError;

    while (attempts < MAX_RETRIES) {
      try {
        result = await executeAtomicSwap(body);
        break; // Success, exit retry loop
      } catch (error: any) {
        lastError = error;
        if (error.message === "OPTIMISTIC_LOCK_FAILED") {
          attempts++;
          // Exponential backoff
          await new Promise(resolve => setTimeout(resolve, 50 * Math.pow(2, attempts)));
          continue;
        }
        // Non-retryable error
        throw error;
      }
    }

    if (!result) {
      throw lastError || new Error("Swap failed after retries");
    }

    // Store idempotency record
    if (body.idempotency_key) {
      await IdempotencyHandler.store(
        body.idempotency_key,
        "/api/swap/v2",
        result
      );
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Swap error:", error);

    if (error.message === "SLIPPAGE_EXCEEDED") {
      return NextResponse.json(
        { error: "Slippage tolerance exceeded. Try increasing slippage or reducing amount." },
        { status: 400 }
      );
    }

    if (error.message === "INSUFFICIENT_LIQUIDITY") {
      return NextResponse.json(
        { error: "Insufficient liquidity in pool" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || "Swap failed" },
      { status: 500 }
    );
  }
}

/**
 * Execute atomic swap with optimistic locking
 */
async function executeAtomicSwap(request: SwapRequest) {
  return await db.transaction(async (tx) => {
    // 1. Fetch pool with current version (FOR UPDATE behavior via transaction)
    const poolRecords = await tx
      .select()
      .from(pools)
      .where(eq(pools.id, request.pool_id))
      .limit(1);

    if (poolRecords.length === 0) {
      throw new Error("Pool not found");
    }

    const pool = poolRecords[0];
    const currentVersion = pool.version || 1;

    // 2. Fetch tokens
    const tokenInRecords = await tx
      .select()
      .from(tokens)
      .where(eq(tokens.id, request.token_in_id))
      .limit(1);

    if (tokenInRecords.length === 0) {
      throw new Error("Token not found");
    }

    const tokenIn = tokenInRecords[0];
    const isTokenAIn = pool.tokenAId === request.token_in_id;
    const tokenOutId = isTokenAIn ? pool.tokenBId : pool.tokenAId;

    const tokenOutRecords = await tx
      .select()
      .from(tokens)
      .where(eq(tokens.id, tokenOutId))
      .limit(1);

    const tokenOut = tokenOutRecords[0];

    // 3. Determine reserves
    const reserveIn = isTokenAIn ? pool.reserveA : pool.reserveB;
    const reserveOut = isTokenAIn ? pool.reserveB : pool.reserveA;

    // 4. Calculate swap output using high-precision math
    const swapResult = DecimalMath.calculateSwapOutput(
      request.amount_in,
      reserveIn,
      reserveOut,
      pool.feeTier
    );

    // 5. Server-side slippage protection
    if (new Decimal(swapResult.amountOut).lt(new Decimal(request.min_amount_out))) {
      throw new Error("SLIPPAGE_EXCEEDED");
    }

    // 6. Validate reserves don't go negative
    if (new Decimal(swapResult.newReserveOut).lte(0)) {
      throw new Error("INSUFFICIENT_LIQUIDITY");
    }

    // 7. Calculate fee accumulation using fee_per_share pattern
    const feeAccumulation = DecimalMath.calculateFeeAccumulation(
      swapResult.fee,
      pool.totalShares?.toString() || "0",
      PROTOCOL_FEE_RATE
    );

    // 8. Calculate new fee_per_share
    const oldFeePerShare = new Decimal(pool.feePerShare || 0);
    const newFeePerShare = oldFeePerShare.add(
      new Decimal(feeAccumulation.feePerShareIncrement)
    );

    // 9. Calculate protocol fees (split between tokenA and tokenB based on which was traded)
    const protocolFeeA = isTokenAIn ? feeAccumulation.protocolFee : "0";
    const protocolFeeB = isTokenAIn ? "0" : feeAccumulation.protocolFee;
    const newProtocolFeesA = new Decimal(pool.protocolFeesA || 0).add(protocolFeeA);
    const newProtocolFeesB = new Decimal(pool.protocolFeesB || 0).add(protocolFeeB);

    // 10. Update pool with optimistic locking
    const updateResult = await tx
      .update(pools)
      .set({
        reserveA: isTokenAIn ? swapResult.newReserveIn : swapResult.newReserveOut,
        reserveB: isTokenAIn ? swapResult.newReserveOut : swapResult.newReserveIn,
        feePerShare: parseFloat(newFeePerShare.toFixed(20)),
        protocolFeesA: parseFloat(newProtocolFeesA.toFixed(2)),
        protocolFeesB: parseFloat(newProtocolFeesB.toFixed(2)),
        version: currentVersion + 1,
        volume24h: pool.volume24h + parseFloat(request.amount_in) / Math.pow(10, tokenIn.decimals) * 2,
        updatedAt: new Date().toISOString(),
      })
      .where(
        and(
          eq(pools.id, request.pool_id),
          eq(pools.version, currentVersion)
        )
      )
      .returning();

    // Check if update succeeded (optimistic lock check)
    if (updateResult.length === 0) {
      throw new Error("OPTIMISTIC_LOCK_FAILED");
    }

    // 11. Verify invariant (k should not decrease)
    const invariantValid = DecimalMath.verifyInvariant(
      reserveIn,
      reserveOut,
      swapResult.newReserveIn,
      swapResult.newReserveOut
    );

    if (!invariantValid) {
      throw new Error("Invariant violation detected");
    }

    // 12. Generate transaction digest
    const txDigest = `swap_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;

    // 13. Record swap
    await tx.insert(swaps).values({
      poolId: request.pool_id,
      userAddress: request.trader,
      tokenInId: request.token_in_id,
      tokenOutId: tokenOutId,
      amountIn: request.amount_in,
      amountOut: swapResult.amountOut,
      fee: swapResult.fee,
      priceImpact: parseFloat(swapResult.priceImpact),
      txDigest: txDigest,
      idempotencyKey: request.idempotency_key || null,
      deadline: request.deadline || null,
      minAmountOut: request.min_amount_out,
      actualPriceImpact: parseFloat(swapResult.priceImpact),
      signature: request.signature || null,
      createdAt: new Date().toISOString(),
    });

    // 14. Record price feed for TWAP oracle
    const price = new Decimal(swapResult.newReserveOut)
      .div(new Decimal(swapResult.newReserveIn))
      .toNumber();

    await tx.insert(priceFeeds).values({
      poolId: request.pool_id,
      price: price,
      reserveA: swapResult.newReserveIn,
      reserveB: swapResult.newReserveOut,
      timestamp: Date.now(),
    });

    // 15. Broadcast real-time update via WebSocket
    try {
      const { broadcastPoolUpdate, broadcastSwapEvent } = await import('@/lib/websocket-server');

      // Broadcast pool update
      broadcastPoolUpdate(request.pool_id, {
        reserve_a: swapResult.newReserveIn,
        reserve_b: swapResult.newReserveOut,
        fee_per_share: parseFloat(newFeePerShare.toFixed(20)),
      });

      // Broadcast swap event
      broadcastSwapEvent(request.pool_id, {
        amount_in: request.amount_in,
        amount_out: swapResult.amountOut,
        trader: request.trader,
      });
    } catch (error) {
      console.warn('WebSocket broadcast failed (non-critical):', error);
    }

    // 16. Return result
    return {
      success: true,
      swap_id: txDigest,
      amount_out: swapResult.amountOut,
      price_impact: swapResult.priceImpact,
      fee: swapResult.fee,
      execution_price: new Decimal(swapResult.amountOut)
        .div(new Decimal(request.amount_in))
        .toFixed(6),
      new_reserve_in: swapResult.newReserveIn,
      new_reserve_out: swapResult.newReserveOut,
      pool_version: currentVersion + 1,
      tx_digest: txDigest,
    };
  });
}
