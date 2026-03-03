import express from 'express';
import { fetchFilesFromAllPlatforms } from '../services/fileService.js';
import { processBatchRename } from '../services/renameService.js';
import { getSessionStats } from '../services/sessionStats.js';
import { findDuplicates, deleteDuplicates, findMissingFiles } from '../services/duplicateService.js';
import { submitToAllPlatforms, getPlatformStatus } from '../services/uploadService.js';

// ── In-memory upload history ──────────────────────────────────
const uploadHistory = [];


// Initialize router BEFORE using it
const router = express.Router();

/**
 * GET /api/fetch-files
 * Fetch files from all platforms with SKYFLIX filter
 */
router.get('/fetch-files', async (req, res) => {
    try {
        console.log('\n📡 API: Fetch files request received');

        const apiKeys = {
            rpmshare: [
                process.env.RPMSHARE_API_KEY_1,
                process.env.RPMSHARE_API_KEY_2
            ],
            streamp2p: [
                process.env.STREAMP2P_API_KEY_1,
                process.env.STREAMP2P_API_KEY_2
            ],
            seekstreaming: [
                process.env.SEEKSTREAMING_API_KEY_1,
                process.env.SEEKSTREAMING_API_KEY_2
            ],
            upnshare: [
                process.env.UPNSHARE_API_KEY_1,
                process.env.UPNSHARE_API_KEY_2
            ]
        };

        const files = await fetchFilesFromAllPlatforms(apiKeys);

        res.json({
            success: true,
            count: files.length,
            files: files
        });

    } catch (error) {
        console.error('❌ API Error:', error.message);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ── In-memory rename job store ─────────────────────────────────
const renameJobs = new Map();

/**
 * POST /api/rename-batch
 * Starts rename in background, responds IMMEDIATELY with jobId.
 * Frontend polls GET /api/rename-status/:jobId for progress.
 */
router.post('/rename-batch', async (req, res) => {
    const { files, newNames } = req.body;

    if (!files || !newNames || files.length !== newNames.length) {
        return res.status(400).json({
            success: false,
            error: 'Invalid request: files and newNames arrays must have the same length'
        });
    }

    console.log(`\n📡 API: Batch rename request for ${files.length} files`);

    const apiKeys = {
        rpmshare: [process.env.RPMSHARE_API_KEY_1, process.env.RPMSHARE_API_KEY_2],
        streamp2p: [process.env.STREAMP2P_API_KEY_1, process.env.STREAMP2P_API_KEY_2],
        seekstreaming: [process.env.SEEKSTREAMING_API_KEY_1, process.env.SEEKSTREAMING_API_KEY_2],
        upnshare: [process.env.UPNSHARE_API_KEY_1, process.env.UPNSHARE_API_KEY_2]
    };

    // Create job
    const jobId = Date.now().toString(36) + Math.random().toString(36).slice(2);
    renameJobs.set(jobId, {
        status: 'running',
        currentFile: 0,
        totalFiles: files.length,
        successful: 0,
        failed: 0,
        results: null,
        error: null,
        startedAt: new Date().toISOString()
    });

    // ✅ Respond immediately — no more timeout errors
    res.json({ success: true, jobId, totalFiles: files.length });

    // Run rename in background (does NOT block the response)
    processBatchRename(files, newNames, apiKeys, (progress) => {
        const job = renameJobs.get(jobId);
        if (job) {
            job.currentFile = progress.currentFile;
            job.totalFiles = progress.totalFiles;
            job.currentBatch = progress.currentBatch;
            job.totalBatches = progress.totalBatches;
        }
    })
        .then(results => {
            const job = renameJobs.get(jobId);
            if (job) {
                job.status = 'completed';
                job.results = results;
                job.successful = results.successful;
                job.failed = results.failed;
                job.currentFile = results.total;
            }
            console.log(`✅ Job ${jobId} complete: ${results.successful} ok, ${results.failed} failed`);
            // Clean up after 1 hour
            setTimeout(() => renameJobs.delete(jobId), 3600000);
        })
        .catch(err => {
            const job = renameJobs.get(jobId);
            if (job) { job.status = 'error'; job.error = err.message; }
            console.error(`❌ Job ${jobId} failed:`, err.message);
        });
});

/**
 * GET /api/rename-status/:jobId
 * Returns current job progress/result for polling.
 */
router.get('/rename-status/:jobId', (req, res) => {
    const job = renameJobs.get(req.params.jobId);
    if (!job) return res.status(404).json({ success: false, error: 'Job not found or expired' });
    res.json({ success: true, ...job });
});

/**
 * GET /api/stats
 * Get current statistics (IN-MEMORY, SESSION-ONLY)
 * Returns real success rate based on actual rename operations
 */
router.get('/stats', async (req, res) => {
    try {
        // 📊 SESSION STATS - Real rename results from current session
        // Success rate reflects actual rename operation outcomes
        // Resets when server restarts, keeps last 24 hours

        const stats = getSessionStats();

        res.json({
            success: true,
            stats
        });

    } catch (error) {
        console.error('❌ API Error:', error.message);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});



/**
 * Helper to build apiKeys from env vars (shared across duplicate routes)
 */
function buildApiKeys() {
    return {
        rpmshare: [
            process.env.RPMSHARE_API_KEY_1,
            process.env.RPMSHARE_API_KEY_2
        ],
        streamp2p: [
            process.env.STREAMP2P_API_KEY_1,
            process.env.STREAMP2P_API_KEY_2
        ],
        seekstreaming: [
            process.env.SEEKSTREAMING_API_KEY_1,
            process.env.SEEKSTREAMING_API_KEY_2
        ],
        upnshare: [
            process.env.UPNSHARE_API_KEY_1,
            process.env.UPNSHARE_API_KEY_2
        ]
    };
}

// ─────────────────────────────────────────────
// GET /api/find-duplicates
// Scan all platforms and return duplicate file lists
// ─────────────────────────────────────────────
router.get('/find-duplicates', async (req, res) => {
    try {
        console.log('\n📡 API: Find duplicates request received');
        const apiKeys = buildApiKeys();
        const result = await findDuplicates(apiKeys);
        res.json({ success: true, ...result });
    } catch (error) {
        console.error('❌ API Error (find-duplicates):', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ─────────────────────────────────────────────
// POST /api/delete-duplicates
// Delete duplicate files (keep 1 copy per name per platform)
// ─────────────────────────────────────────────
router.post('/delete-duplicates', async (req, res) => {
    try {
        console.log('\n📡 API: Delete duplicates request received');
        const apiKeys = buildApiKeys();
        const result = await deleteDuplicates(apiKeys);
        res.json({ success: true, ...result });
    } catch (error) {
        console.error('❌ API Error (delete-duplicates):', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ─────────────────────────────────────────────
// GET /api/missing-files
// Compare all platforms and report files missing from any one
// ─────────────────────────────────────────────
router.get('/missing-files', async (req, res) => {
    try {
        console.log('\n📡 API: Missing files request received');
        const apiKeys = buildApiKeys();
        const result = await findMissingFiles(apiKeys);
        res.json({ success: true, ...result });
    } catch (error) {
        console.error('❌ API Error (missing-files):', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ─────────────────────────────────────────────
// POST /api/upload-url
// Submit URL to all 4 platforms simultaneously.
// Returns immediately with each platform's taskId (or error).
// Body: { url: string, name: string }
// ─────────────────────────────────────────────
router.post('/upload-url', async (req, res) => {
    const { url, name } = req.body;
    if (!url || !name) {
        return res.status(400).json({ success: false, error: 'url and name are required' });
    }

    console.log(`\n📤 POST /api/upload-url  name="${name}"`);

    try {
        const submissions = await submitToAllPlatforms(url, name);

        // Save to history
        const entry = { url, name, timestamp: new Date().toISOString(), submissions };
        uploadHistory.push(entry);
        if (uploadHistory.length > 500) uploadHistory.shift();

        return res.json({ success: true, platforms: submissions });
    } catch (err) {
        console.error('❌ upload-url error:', err.message);
        return res.status(500).json({ success: false, error: err.message });
    }
});

// ─────────────────────────────────────────────
// GET /api/upload-status/:platform/:taskId
// Poll ONE platform task status.
// Returns { status, percent, videos, error }
// ─────────────────────────────────────────────
router.get('/upload-status/:platform/:taskId', async (req, res) => {
    const { platform, taskId } = req.params;
    try {
        const result = await getPlatformStatus(platform, taskId);
        return res.json({ success: true, ...result });
    } catch (err) {
        return res.json({ success: false, status: 'Error', percent: 0, error: err.message });
    }
});

// ─────────────────────────────────────────────
// GET /api/upload-history
// Returns today's upload count and recent uploads
// ─────────────────────────────────────────────
router.get('/upload-history', (req, res) => {
    const now = Date.now();
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    const last24h = uploadHistory.filter(e => now - new Date(e.timestamp).getTime() < 86400000);
    const today = uploadHistory.filter(e => new Date(e.timestamp) >= todayStart);
    res.json({
        success: true,
        uploadedToday: today.length,
        uploadedLast24h: last24h.length,
        totalUploads: uploadHistory.length,
        recentUploads: uploadHistory.slice(-20).reverse()
    });
});

export default router;
