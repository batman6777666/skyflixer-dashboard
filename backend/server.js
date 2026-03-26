import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cron from 'node-cron';
import apiRoutes from './routes/api.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// CORS
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging (skip noisy polling endpoints)
app.use((req, res, next) => {
    // Don't log stats/health polls — they're called every 30s and clutter the terminal
    const silentPaths = ['/api/stats', '/health', '/api/upload-history'];
    if (!silentPaths.includes(req.url)) {
        console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    }
    next();
});

// API Routes
app.use('/api', apiRoutes);

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', message: 'Video Rename Server is running' });
});

// Root
app.get('/', (req, res) => {
    res.json({
        name: 'Multi-Platform Video Hosting File Rename API',
        version: '2.0.0',
        endpoints: {
            fetchFiles: 'GET /api/fetch-files',
            fetchFilesStream: 'GET /api/fetch-files-stream (SSE)',
            findDuplicatesStream: 'GET /api/find-duplicates-stream (SSE)',
            deleteDuplicatesStream: 'GET /api/delete-duplicates-stream (SSE)',
            missingFilesStream: 'GET /api/missing-files-stream (SSE)',
            renameBatch: 'POST /api/rename-batch',
            stats: 'GET /api/stats'
        }
    });
});

// Error handling middleware — catch-all for unhandled errors
app.use((err, req, res, next) => {
    console.error('Server error:', err.message);
    res.status(500).json({ success: false, error: 'Internal server error' });
});

// Schedule cleanup — wrapped in try/catch so it never crashes the server
cron.schedule('0 2 * * *', () => {
    try {
        console.log('🧹 Running scheduled cleanup...');
        // statsService cleanup is optional; if DB is unavailable, skip silently
        import('./services/statsService.js')
            .then(mod => mod.cleanupOldRecords())
            .catch(() => { /* DB unavailable, skip */ });
    } catch (e) {
        // Never crash from cron
    }
});

// Start server
app.listen(PORT, () => {
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║  🎬 Multi-Platform Video Hosting File Rename Server v2    ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
    console.log(`\n✅ Server running on http://localhost:${PORT}`);
    console.log(`\n📡 API Endpoints:`);
    console.log(`   GET  /api/fetch-files-stream      → Fetch files (SSE + progress)`);
    console.log(`   GET  /api/find-duplicates-stream   → Find duplicates (SSE + progress)`);
    console.log(`   GET  /api/delete-duplicates-stream → Delete duplicates (SSE + progress)`);
    console.log(`   GET  /api/missing-files-stream     → Missing files (SSE + progress)`);
    console.log(`   POST /api/rename-batch             → Batch rename files`);
    console.log(`   GET  /api/stats                    → Get statistics`);
    console.log(`\n🔐 API Keys configured (3 per provider):`);
    console.log(`   RPMShare:       ${process.env.RPMSHARE_API_KEY_1 ? '✓' : '✗'}, ${process.env.RPMSHARE_API_KEY_2 ? '✓' : '✗'}, ${process.env.RPMSHARE_API_KEY_3 ? '✓' : '✗'}`);
    console.log(`   StreamP2P:      ${process.env.STREAMP2P_API_KEY_1 ? '✓' : '✗'}, ${process.env.STREAMP2P_API_KEY_2 ? '✓' : '✗'}, ${process.env.STREAMP2P_API_KEY_3 ? '✓' : '✗'}`);
    console.log(`   SeekStreaming:   ${process.env.SEEKSTREAMING_API_KEY_1 ? '✓' : '✗'}, ${process.env.SEEKSTREAMING_API_KEY_2 ? '✓' : '✗'}, ${process.env.SEEKSTREAMING_API_KEY_3 ? '✓' : '✗'}`);
    console.log(`   UPnShare:       ${process.env.UPNSHARE_API_KEY_1 ? '✓' : '✗'}, ${process.env.UPNSHARE_API_KEY_2 ? '✓' : '✗'}, ${process.env.UPNSHARE_API_KEY_3 ? '✓' : '✗'}`);
    console.log(`\n⚡ Rate limit: 5 requests/second per API key (with exponential backoff on 429)`);
    console.log('════════════════════════════════════════════════════════════\n');
});

export default app;
