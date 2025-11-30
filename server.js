const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = 3000;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(async () => {
    const server = createServer(async (req, res) => {
        try {
            const parsedUrl = parse(req.url, true);
            await handle(req, res, parsedUrl);
        } catch (err) {
            console.error('Error occurred handling', req.url, err);
            res.statusCode = 500;
            res.end('internal server error');
        }
    });

    // Initialize WebSocket server using dynamic import
    try {
        const websocketModule = await import('./src/lib/websocket-server.ts');
        const io = websocketModule.initializeWebSocket(server);
        console.log('✅ WebSocket server initialized');

        // Make WebSocket available globally for API routes
        global.io = io;
    } catch (error) {
        console.warn('⚠️  WebSocket initialization skipped:', error.message);
        console.warn('   Real-time features will work via SSE fallback');
    }

    server.listen(port, (err) => {
        if (err) throw err;
        console.log('');
        console.log('🚀 Server ready on http://' + hostname + ':' + port);
        console.log('📡 Real-time features enabled');
        console.log('');
        console.log('Quick links:');
        console.log('  - Demo: http://' + hostname + ':' + port + '/realtime-demo');
        console.log('  - Stats: http://' + hostname + ':' + port + '/api/ws-stats');
        console.log('');
    });
});
