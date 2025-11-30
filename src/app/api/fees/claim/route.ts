import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { positions } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { positionId, feesA, feesB } = body;

    // Validate required fields
    if (!positionId) {
      return NextResponse.json(
        {
          error: 'Position ID is required',
          code: 'MISSING_POSITION_ID',
        },
        { status: 400 }
      );
    }

    // Validate positionId is a valid integer
    const parsedPositionId = parseInt(positionId);
    if (isNaN(parsedPositionId)) {
      return NextResponse.json(
        {
          error: 'Valid position ID is required',
          code: 'INVALID_POSITION_ID',
        },
        { status: 400 }
      );
    }

    // Validate feesA is provided
    if (!feesA) {
      return NextResponse.json(
        {
          error: 'Fees A amount is required',
          code: 'MISSING_FEES_A',
        },
        { status: 400 }
      );
    }

    // Validate feesB is provided
    if (!feesB) {
      return NextResponse.json(
        {
          error: 'Fees B amount is required',
          code: 'MISSING_FEES_B',
        },
        { status: 400 }
      );
    }

    // Check if position exists
    const existingPosition = await db
      .select()
      .from(positions)
      .where(eq(positions.id, parsedPositionId))
      .limit(1);

    if (existingPosition.length === 0) {
      return NextResponse.json(
        {
          error: 'Position not found',
          code: 'POSITION_NOT_FOUND',
        },
        { status: 404 }
      );
    }

    // Update position: reset fees and update lastFeeClaim
    const updatedPosition = await db
      .update(positions)
      .set({
        accumulatedFeesA: '0',
        accumulatedFeesB: '0',
        lastFeeClaim: new Date().toISOString(),
      })
      .where(eq(positions.id, parsedPositionId))
      .returning();

    if (updatedPosition.length === 0) {
      return NextResponse.json(
        {
          error: 'Failed to update position',
          code: 'UPDATE_FAILED',
        },
        { status: 500 }
      );
    }

    // Return success with claimed fees information
    return NextResponse.json(
      {
        success: true,
        message: 'Fees claimed successfully',
        claimedFees: {
          feesA,
          feesB,
        },
        position: updatedPosition[0],
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error'),
      },
      { status: 500 }
    );
  }
}