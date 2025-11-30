import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { positions, pools, tokens } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;

    // Validate ID parameter
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { 
          error: 'Valid position ID is required',
          code: 'INVALID_ID' 
        },
        { status: 400 }
      );
    }

    const positionId = parseInt(id);

    // Query position by ID
    const [positionData] = await db
      .select()
      .from(positions)
      .where(eq(positions.id, positionId))
      .limit(1);

    // Check if position exists
    if (!positionData) {
      return NextResponse.json(
        { 
          error: 'Position not found',
          code: 'POSITION_NOT_FOUND' 
        },
        { status: 404 }
      );
    }

    // Get pool details
    const [poolData] = await db
      .select()
      .from(pools)
      .where(eq(pools.id, positionData.poolId))
      .limit(1);

    if (!poolData) {
      return NextResponse.json(
        { 
          error: 'Pool not found for position',
          code: 'POOL_NOT_FOUND' 
        },
        { status: 500 }
      );
    }

    // Get Token A details
    const [tokenAData] = await db
      .select()
      .from(tokens)
      .where(eq(tokens.id, poolData.tokenAId))
      .limit(1);

    // Get Token B details
    const [tokenBData] = await db
      .select()
      .from(tokens)
      .where(eq(tokens.id, poolData.tokenBId))
      .limit(1);

    // Construct the complete response object
    const position = {
      ...positionData,
      pool: {
        ...poolData,
        tokenA: tokenAData || null,
        tokenB: tokenBData || null,
      },
    };

    return NextResponse.json(position, { status: 200 });

  } catch (error) {
    console.error('GET position by ID error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error'),
        code: 'INTERNAL_ERROR' 
      },
      { status: 500 }
    );
  }
}