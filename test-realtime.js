#!/usr/bin/env node

/**
 * Real-Time Features Test Script
 * Tests WebSocket, SSE, and API endpoints
 */

const BASE_URL = 'http://localhost:3000';

async function testSSE() {
    console.log('\n📡 Testing Server-Sent Events (SSE)...\n');

    console.log('Opening SSE stream: /api/stream/pools');
    console.log('This will stream pool data every second.');
    console.log('Press Ctrl+C to stop.\n');

    const response = await fetch(`${BASE_URL}/api/stream/pools`);
    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    let eventCount = 0;
    const maxEvents = 5;

    while (eventCount < maxEvents) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n\n');

        for (const line of lines) {
            if (line.startsWith('data: ')) {
                eventCount++;
                const data = JSON.parse(line.slice(6));
                console.log(`[Event ${eventCount}] Received pool data:`, data.pools?.length, 'pools at', new Date(data.timestamp).toLocaleTimeString());
                if (eventCount >= maxEvents) break;
            }
        }
    }

    reader.cancel();
    console.log('\n✅ SSE test complete!\n');
}

async function testWebSocketStats() {
    console.log('\n📊 Testing WebSocket Stats...\n');

    const response = await fetch(`${BASE_URL}/api/ws-stats`);
    const data = await response.json();

    if (data.stats) {
        console.log('✅ WebSocket server is running!');
        console.log('  - Connected clients:', data.stats.connected_clients);
        console.log('  - Active rooms:', data.stats.active_rooms);
        console.log('  - Rooms:', data.stats.rooms.map(r => `${r.name} (${r.clients} clients)`).join(', ') || 'None');
    } else {
        console.log('⚠️  WebSocket server not initialized');
    }

    console.log('');
}

async function testSwapAPI() {
    console.log('\n💱 Testing Swap API with WebSocket Broadcasting...\n');

    const swapRequest = {
        pool_id: 1,
        trader: '0xtest' + Date.now(),
        token_in_id: 1,
        amount_in: '1000000000',
        min_amount_out: '995000000',
        deadline: Date.now() + 60000,
        idempotency_key: `test-swap-${Date.now()}`,
    };

    console.log('Executing swap...');

    try {
        const response = await fetch(`${BASE_URL}/api/swap/v2`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(swapRequest),
        });

        const data = await response.json();

        if (data.success) {
            console.log('✅ Swap successful!');
            console.log('  - Transaction:', data.tx_digest);
            console.log('  - Amount out:', data.amount_out);
            console.log('  - Price impact:', data.price_impact);
            console.log('  - WebSocket should have broadcasted this swap!');
        } else {
            console.log('❌ Swap failed:', data.error);
        }
    } catch (error) {
        console.log('❌ Request failed:', error.message);
    }

    console.log('');
}

async function runAllTests() {
    console.log('🚀 Real-Time Features Test Suite\n');
    console.log('Testing server at:', BASE_URL);
    console.log('Make sure your server is running: npm run dev\n');

    try {
        await testWebSocketStats();
        await testSSE();
        await testSwapAPI();

        console.log('\n✨ All tests complete!\n');
        console.log('💡 Next steps:');
        console.log('  1. Open http://localhost:3000/realtime-demo');
        console.log('  2. Open a second browser window');
        console.log('  3. Execute another swap and watch both windows update!');
        console.log('');
    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
        console.log('\n⚠️  Make sure your dev server is running: npm run dev\n');
    }
}

runAllTests();
