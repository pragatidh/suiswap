import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { tokens } from '@/db/schema';
import { desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const allTokens = await db.select()
      .from(tokens)
      .orderBy(desc(tokens.createdAt));

    return NextResponse.json(allTokens, { status: 200 });
  } catch (error) {
    console.error('GET tokens error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
    }, { status: 500 });
  }
}