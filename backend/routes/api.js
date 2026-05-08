import express from 'express';
import { fetchFilesFromAllPlatforms } from '../services/fileService.js';
import { processBatchRename } from '../services/renameService.js';
import { getSessionStats } from '../services/sessionStats.js';
import { findDuplicates, deleteDuplicates, findMissingFiles } from '../services/duplicateService.js';
import { submitToAllPlatforms, getPlatformStatus } from '../services/uploadService.js';

// ── In-memory upload history ──────────────────────────────────
const uploadHistory = [];

const router = express.Router();

/**
 * Helper to build apiKeys from env vars (3 keys per provider)
 */
function buildApiKeys() {
    return {
        vidplay: [
            process.env.VIDPLAY_API_KEY_1,
            process.env.VIDPLAY_API_KEY_2,
            process.env.VIDPLAY_API_KEY_3
        ].filter(Boolean),
        streamp2p: [
            process.env.STREAMP2P_API_KEY_1,
            process.env.STREAMP2P_API_KEY_2,
            process.env.STREAMP2P_API_KEY_3
        ].filter(Boolean),
        seekstreaming: [
            process.env.SEEKSTREAMING_API_KEY_1,
            process.env.SEEKSTREAMING_API_KEY_2,
            process.env.SEEKSTREAMING_API_KEY_3
        ].filter(Boolean),
        upnshare: [
            process.env.UPNSHARE_API_KEY_1,
            process.env.UPNSHARE_API_KEY_2,
            process.env.UPNSHARE_API_KEY_3
        ].filter(Boolean)
    };
}

/**
 * Filter apiKeys to only include platforms specified in ?platforms= query param.
 * If no param is provided, all platforms are included.
 * @param {Object} req - Express request
 * @returns {{ apiKeys: Object, enabledPlatforms: string[] }}
 */
function getFilteredApiKeys(req) {
    const allKeys = buildApiKeys();
    const platformsParam = req.query.platforms;
    const allPlatforms = ['vidplay', 'streamp2p', 'seekstreaming', 'upnshare'];

    if (!platformsParam) {
        return { apiKeys: allKeys, enabledPlatforms: allPlatforms };
    }

    const enabledPlatforms = platformsParam.split(',').filter(p => allPlatforms.includes(p.trim()));
    const filteredKeys = {};
    for (const p of enabledPlatforms) {
        filteredKeys[p] = allKeys[p] || [];
    }

    console.log(`  🎛️  Platforms filter: ${enabledPlatforms.join(', ')}`);
    return { apiKeys: filteredKeys, enabledPlatforms };
}

/** Helper: setup SSE response headers */
function setupSSE(res) {
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no'
    });
}

/** Helper: safely write SSE data */
function sendSSE(res, data) {
    try { res.write(`data: ${JSON.stringify(data)}\n\n`); } catch (e) { /* client disconnected */ }
}

// ═══════════════════════════════════════════════
// FETCH FILES
// ═══════════════════════════════════════════════

/**
 * GET /api/fetch-files — classic (no progress)
 */
router.get('/fetch-files', async (req, res) => {
    try {
        console.log('\n📡 Fetch files request');
        const apiKeys = buildApiKeys();
        const files = await fetchFilesFromAllPlatforms(apiKeys);
        res.json({ success: true, count: files.length, files });
    } catch (error) {
        console.error('Fetch files error:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/fetch-files-stream — SSE with real-time progress
 */
router.get('/fetch-files-stream', async (req, res) => {
    setupSSE(res);
    sendSSE(res, { type: 'start', message: 'Starting deep scan...' });

    try {
        const apiKeys = buildApiKeys();
        const files = await fetchFilesFromAllPlatforms(apiKeys, (progress) => {
            sendSSE(res, { type: 'progress', ...progress });
        });
        sendSSE(res, { type: 'complete', count: files.length, files });
    } catch (error) {
        sendSSE(res, { type: 'error', error: error.message });
    }
    res.end();
});

// ═══════════════════════════════════════════════
// FIND DUPLICATES
// ═══════════════════════════════════════════════

/** GET /api/find-duplicates — classic */
router.get('/find-duplicates', async (req, res) => {
    try {
        console.log('\n📡 Find duplicates request');
        const apiKeys = buildApiKeys();
        const result = await findDuplicates(apiKeys);
        res.json({ success: true, ...result });
    } catch (error) {
        console.error('Find duplicates error:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

/** GET /api/find-duplicates-stream — SSE with progress */
router.get('/find-duplicates-stream', async (req, res) => {
    setupSSE(res);
    const { apiKeys, enabledPlatforms } = getFilteredApiKeys(req);
    sendSSE(res, { type: 'start', message: `Scanning for duplicates on ${enabledPlatforms.length} platform(s)...` });

    try {
        const result = await findDuplicates(apiKeys, (progress) => {
            sendSSE(res, { type: 'progress', phase: 'scanning', ...progress });
        }, enabledPlatforms);
        sendSSE(res, { type: 'complete', ...result });
    } catch (error) {
        sendSSE(res, { type: 'error', error: error.message });
    }
    res.end();
});

// ═══════════════════════════════════════════════
// DELETE DUPLICATES
// ═══════════════════════════════════════════════

/** POST /api/delete-duplicates — classic */
router.post('/delete-duplicates', async (req, res) => {
    try {
        console.log('\n📡 Delete duplicates request');
        const apiKeys = buildApiKeys();
        const result = await deleteDuplicates(apiKeys);
        res.json({ success: true, ...result });
    } catch (error) {
        console.error('Delete duplicates error:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

/** GET /api/delete-duplicates-stream — SSE with scanning + deletion progress */
router.get('/delete-duplicates-stream', async (req, res) => {
    setupSSE(res);
    const { apiKeys, enabledPlatforms } = getFilteredApiKeys(req);
    sendSSE(res, { type: 'start', message: `Scanning then deleting duplicates on ${enabledPlatforms.length} platform(s)...` });

    try {
        const result = await deleteDuplicates(
            apiKeys,
            // onProgress (scanning phase)
            (progress) => {
                sendSSE(res, { type: 'progress', phase: 'scanning', ...progress });
            },
            // onDeleteProgress (deletion phase)
            (delProgress) => {
                sendSSE(res, { type: 'progress', phase: 'deleting', ...delProgress });
            },
            enabledPlatforms
        );
        sendSSE(res, { type: 'complete', ...result });
    } catch (error) {
        sendSSE(res, { type: 'error', error: error.message });
    }
    res.end();
});

// ═══════════════════════════════════════════════
// MISSING FILES
// ═══════════════════════════════════════════════

/** GET /api/missing-files — classic */
router.get('/missing-files', async (req, res) => {
    try {
        console.log('\n📡 Missing files request');
        const apiKeys = buildApiKeys();
        const result = await findMissingFiles(apiKeys);
        res.json({ success: true, ...result });
    } catch (error) {
        console.error('Missing files error:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

/** GET /api/missing-files-stream — SSE with progress */
router.get('/missing-files-stream', async (req, res) => {
    setupSSE(res);
    const { apiKeys, enabledPlatforms } = getFilteredApiKeys(req);
    sendSSE(res, { type: 'start', message: `Comparing ${enabledPlatforms.length} platform(s)...` });

    try {
        const result = await findMissingFiles(apiKeys, (progress) => {
            sendSSE(res, { type: 'progress', phase: 'scanning', ...progress });
        }, enabledPlatforms);
        sendSSE(res, { type: 'complete', ...result });
    } catch (error) {
        sendSSE(res, { type: 'error', error: error.message });
    }
    res.end();
});

// ═══════════════════════════════════════════════
// RENAME
// ═══════════════════════════════════════════════

const renameJobs = new Map();

router.post('/rename-batch', async (req, res) => {
    const { files, newNames } = req.body;
    if (!files || !newNames || files.length !== newNames.length) {
        return res.status(400).json({ success: false, error: 'files and newNames must match in length' });
    }

    console.log(`\n📡 Batch rename: ${files.length} files`);
    const apiKeys = buildApiKeys();
    const jobId = Date.now().toString(36) + Math.random().toString(36).slice(2);
    renameJobs.set(jobId, {
        status: 'running', currentFile: 0, totalFiles: files.length,
        successful: 0, failed: 0, results: null, error: null, startedAt: new Date().toISOString()
    });

    res.json({ success: true, jobId, totalFiles: files.length });

    processBatchRename(files, newNames, apiKeys, (progress) => {
        const job = renameJobs.get(jobId);
        if (job) { job.currentFile = progress.currentFile; job.totalFiles = progress.totalFiles; job.currentBatch = progress.currentBatch; job.totalBatches = progress.totalBatches; }
    })
        .then(results => {
            const job = renameJobs.get(jobId);
            if (job) { job.status = 'completed'; job.results = results; job.successful = results.successful; job.failed = results.failed; job.currentFile = results.total; }
            console.log(`✅ Rename job ${jobId}: ${results.successful} ok, ${results.failed} failed`);
            setTimeout(() => renameJobs.delete(jobId), 3600000);
        })
        .catch(err => {
            const job = renameJobs.get(jobId);
            if (job) { job.status = 'error'; job.error = err.message; }
        });
});

router.get('/rename-status/:jobId', (req, res) => {
    const job = renameJobs.get(req.params.jobId);
    if (!job) return res.status(404).json({ success: false, error: 'Job not found' });
    res.json({ success: true, ...job });
});

// ═══════════════════════════════════════════════
// STATS
// ═══════════════════════════════════════════════

router.get('/stats', (req, res) => {
    try {
        const stats = getSessionStats();
        res.json({ success: true, stats });
    } catch (error) {
        // Return safe defaults — never throw on stats
        res.json({
            success: true,
            stats: {
                today: { count: 0, successful: 0, failed: 0 },
                last24h: { count: 0, successful: 0, failed: 0 },
                successRate: 100,
                recentActivity: []
            }
        });
    }
});

// ═══════════════════════════════════════════════
// UPLOAD
// ═══════════════════════════════════════════════

router.post('/upload-url', async (req, res) => {
    const { url, name } = req.body;
    if (!url || !name) return res.status(400).json({ success: false, error: 'url and name required' });

    try {
        const submissions = await submitToAllPlatforms(url, name);
        const entry = { url, name, timestamp: new Date().toISOString(), submissions };
        uploadHistory.push(entry);
        if (uploadHistory.length > 500) uploadHistory.shift();
        return res.json({ success: true, platforms: submissions });
    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
});

router.get('/upload-status/:platform/:taskId', async (req, res) => {
    const { platform, taskId } = req.params;
    try {
        const result = await getPlatformStatus(platform, taskId);
        return res.json({ success: true, ...result });
    } catch (err) {
        return res.json({ success: false, status: 'Error', percent: 0, error: err.message });
    }
});

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
