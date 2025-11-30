import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { pools } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function PATCH(
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

    // Parse request body
    let body;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json(
        { 
          error: 'Invalid JSON in request body',
          code: 'INVALID_JSON' 
        },
        { status: 400 }
      );
    }

    const { reserveA, reserveB, volume24h } = body;

    // Validate required fields
    if (!reserveA) {
      return NextResponse.json(
        { 
          error: 'reserveA is required',
          code: 'MISSING_RESERVE_A' 
        },
        { status: 400 }
      );
    }

    if (!reserveB) {
      return NextResponse.json(
        { 
          error: 'reserveB is required',
          code: 'MISSING_RESERVE_B' 
        },
        { status: 400 }
      );
    }

    if (volume24h === undefined || volume24h === null) {
      return NextResponse.json(
        { 
          error: 'volume24h is required',
          code: 'MISSING_VOLUME_24H' 
        },
        { status: 400 }
      );
    }

    // Validate reserveA and reserveB are strings
    if (typeof reserveA !== 'string') {
      return NextResponse.json(
        { 
          error: 'reserveA must be a string',
          code: 'INVALID_RESERVE_A_TYPE' 
        },
        { status: 400 }
      );
    }

    if (typeof reserveB !== 'string') {
      return NextResponse.json(
        { 
          error: 'reserveB must be a string',
          code: 'INVALID_RESERVE_B_TYPE' 
        },
        { status: 400 }
      );
    }

    // Validate volume24h is a number
    if (typeof volume24h !== 'number' || isNaN(volume24h)) {
      return NextResponse.json(
        { 
          error: 'volume24h must be a valid number',
          code: 'INVALID_VOLUME_24H_TYPE' 
        },
        { status: 400 }
      );
    }

    // Check if pool exists
    const existingPool = await db.select()
      .from(pools)
      .where(eq(pools.id, poolId))
      .limit(1);

    if (existingPool.length === 0) {
      return NextResponse.json(
        { 
          error: 'Pool not found',
          code: 'POOL_NOT_FOUND' 
        },
        { status: 404 }
      );
    }

    // Update pool with new reserves, volume, and timestamp
    const updatedPool = await db.update(pools)
      .set({
        reserveA: reserveA.trim(),
        reserveB: reserveB.trim(),
        volume24h,
        updatedAt: new Date().toISOString()
      })
      .where(eq(pools.id, poolId))
      .returning();

    if (updatedPool.length === 0) {
      return NextResponse.json(
        { 
          error: 'Failed to update pool',
          code: 'UPDATE_FAILED' 
        },
        { status: 500 }
      );
    }

    return NextResponse.json(updatedPool[0], { status: 200 });

  } catch (error) {
    console.error('PATCH /api/pools/[id]/reserves error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
      },
      { status: 500 }
    );
  }
}