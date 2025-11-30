import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { priceFeeds } from "@/db/schema";
import { eq, and, gte, lte, desc } from "drizzle-orm";
import Decimal from "decimal.js";

/**
 * TWAP (Time-Weighted Average Price) Oracle Endpoint
 * Provides price data for slippage protection and analytics
 */

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const poolId = searchParams.get("pool_id");
    const period = searchParams.get("period") || "3600"; // Default 1 hour
    const limit = searchParams.get("limit") || "100";

    if (!poolId) {
      return NextResponse.json(
        { error: "Missing pool_id parameter" },
        { status: 400 }
      );
    }

    const poolIdNum = parseInt(poolId);
    const periodMs = parseInt(period) * 1000;
    const limitNum = parseInt(limit);

    // Get price feeds within the period
    const cutoffTime = Date.now() - periodMs;
    
    const feeds = await db
      .select()
      .from(priceFeeds)
      .where(
        and(
          eq(priceFeeds.poolId, poolIdNum),
          gte(priceFeeds.timestamp, cutoffTime)
        )
      )
      .orderBy(desc(priceFeeds.timestamp))
      .limit(limitNum);

    if (feeds.length === 0) {
      return NextResponse.json({
        pool_id: poolIdNum,
        twap: null,
        current_price: null,
        observations: 0,
        period_seconds: parseInt(period),
        message: "No price data available",
      });
    }

    // Calculate TWAP
    let totalWeightedPrice = new Decimal(0);
    let totalWeight = new Decimal(0);

    for (let i = 0; i < feeds.length - 1; i++) {
      const current = feeds[i];
      const next = feeds[i + 1];
      
      const timeDelta = current.timestamp - next.timestamp;
      const price = new Decimal(current.price);
      
      totalWeightedPrice = totalWeightedPrice.add(price.mul(timeDelta));
      totalWeight = totalWeight.add(timeDelta);
    }

    // Add the last observation (weighted to end of period)
    if (feeds.length > 0) {
      const last = feeds[feeds.length - 1];
      const timeDelta = last.timestamp - cutoffTime;
      const price = new Decimal(last.price);
      
      totalWeightedPrice = totalWeightedPrice.add(price.mul(timeDelta));
      totalWeight = totalWeight.add(timeDelta);
    }

    const twap = totalWeight.gt(0) 
      ? totalWeightedPrice.div(totalWeight).toNumber()
      : feeds[0].price;

    // Current price is the most recent observation
    const currentPrice = feeds[0].price;

    // Calculate price volatility (standard deviation)
    const prices = feeds.map(f => f.price);
    const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
    const variance = prices.reduce((sum, p) => sum + Math.pow(p - avgPrice, 2), 0) / prices.length;
    const volatility = Math.sqrt(variance);

    // Price change percentage
    const priceChange = feeds.length > 1
      ? ((currentPrice - feeds[feeds.length - 1].price) / feeds[feeds.length - 1].price) * 100
      : 0;

    return NextResponse.json({
      pool_id: poolIdNum,
      twap: parseFloat(twap.toFixed(18)),
      current_price: currentPrice,
      price_change_percent: parseFloat(priceChange.toFixed(4)),
      volatility: parseFloat(volatility.toFixed(18)),
      observations: feeds.length,
      period_seconds: parseInt(period),
      oldest_timestamp: feeds[feeds.length - 1].timestamp,
      newest_timestamp: feeds[0].timestamp,
      price_range: {
        min: Math.min(...prices),
        max: Math.max(...prices),
        avg: avgPrice,
      },
    });
  } catch (error: any) {
    console.error("TWAP oracle error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to calculate TWAP" },
      { status: 500 }
    );
  }
}

/**
 * POST: Record a manual price observation (for external integrations)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.pool_id || !body.price || !body.reserve_a || !body.reserve_b) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    await db.insert(priceFeeds).values({
      poolId: body.pool_id,
      price: body.price,
      reserveA: body.reserve_a,
      reserveB: body.reserve_b,
      timestamp: body.timestamp || Date.now(),
    });

    return NextResponse.json({
      success: true,
      message: "Price feed recorded",
    });
  } catch (error: any) {
    console.error("Price feed recording error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to record price feed" },
      { status: 500 }
    );
  }
}
