import { db } from '@/db';
import { pools } from '@/db/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const poolId = searchParams.get('pool_id');

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
        async start(controller) {
            const sendUpdate = async () => {
                try {
                    let poolsData;

                    if (poolId) {
                        // Stream specific pool
                        const pool = await db.query.pools.findFirst({
                            where: eq(pools.id, parseInt(poolId)),
                            with: {
                                token_a: true,
                                token_b: true,
                            }
                        });
                        poolsData = pool ? [pool] : [];
                    } else {
                        // Stream all pools
                        poolsData = await db.query.pools.findMany({
                            with: {
                                token_a: true,
                                token_b: true,
                            }
                        });
                    }

                    const data = `data: ${JSON.stringify({
                        pools: poolsData,
                        timestamp: Date.now(),
                    })}\n\n`;

                    controller.enqueue(encoder.encode(data));
                } catch (error) {
                    console.error('SSE error:', error);
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: 'Failed to fetch pools' })}\n\n`));
                }
            };

            // Send initial data immediately
            await sendUpdate();

            // Update every 1 second
            const interval = setInterval(sendUpdate, 1000);

            // Cleanup on connection close
            request.signal.addEventListener('abort', () => {
                clearInterval(interval);
                controller.close();
            });
        }
    });

    return new Response(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache, no-transform',
            'Connection': 'keep-alive',
            'X-Accel-Buffering': 'no',
        },
    });
}
