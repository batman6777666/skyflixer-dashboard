import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cron from 'node-cron';
import apiRoutes from './routes/api.js';
import { cleanupOldRecords } from './services/statsService.js';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// API Routes
app.use('/api', apiRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok', message: 'Video Rename Server is running' });
});

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        name: 'Multi-Platform Video Hosting File Rename API',
        version: '1.0.0',
        endpoints: {
            fetchFiles: 'GET /api/fetch-files',
            renameBatch: 'POST /api/rename-batch',
            stats: 'GET /api/stats',
            health: 'GET /health'
        }
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('❌ Server Error:', err.stack);
    res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: err.message
    });
});

// Schedule cleanup job - run every day at 2 AM
cron.schedule('0 2 * * *', () => {
    console.log('🧹 Running scheduled cleanup job...');
    cleanupOldRecords();
});

// Start server
app.listen(PORT, () => {
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║  🎬 Multi-Platform Video Hosting File Rename Server       ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
    console.log(`\n✅ Server running on http://localhost:${PORT}`);
    console.log(`\n📡 API Endpoints:`);
    console.log(`   GET  /api/fetch-files    - Fetch files from all platforms`);
    console.log(`   POST /api/rename-batch   - Batch rename files`);
    console.log(`   GET  /api/stats          - Get statistics`);
    console.log(`\n🔐 API Keys configured:`);
    console.log(`   RPMShare: ${process.env.RPMSHARE_API_KEY_1 ? '✓' : '✗'}, ${process.env.RPMSHARE_API_KEY_2 ? '✓' : '✗'}`);
    console.log(`   StreamP2P: ${process.env.STREAMP2P_API_KEY_1 ? '✓' : '✗'}, ${process.env.STREAMP2P_API_KEY_2 ? '✓' : '✗'}`);
    console.log(`   SeekStreaming: ${process.env.SEEKSTREAMING_API_KEY_1 ? '✓' : '✗'}, ${process.env.SEEKSTREAMING_API_KEY_2 ? '✓' : '✗'}`);
    console.log(`   UPnShare: ${process.env.UPNSHARE_API_KEY_1 ? '✓' : '✗'}, ${process.env.UPNSHARE_API_KEY_2 ? '✓' : '✗'}`);
    console.log(`\n🕒 Scheduled cleanup job: Every day at 2:00 AM`);
    console.log('════════════════════════════════════════════════════════════\n');
});

export default app;
