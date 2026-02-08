import express from 'express';
import { fetchFilesFromAllPlatforms } from '../services/fileService.js';
import { processBatchRename } from '../services/renameService.js';
import { getSessionStats } from '../services/sessionStats.js';

// ... existing fetch-files route ...

/**
 * POST /api/rename-batch
 * Batch rename files across platforms
 */
router.post('/rename-batch', async (req, res) => {
    try {
        const { files, newNames } = req.body;

        if (!files || !newNames || files.length !== newNames.length) {
            return res.status(400).json({
                success: false,
                error: 'Invalid request: files and newNames arrays must have the same length'
            });
        }

        console.log(`\n📡 API: Batch rename request for ${files.length} files`);

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

        // Process batch rename (results tracked in sessionStats automatically)
        const results = await processBatchRename(files, newNames, apiKeys);

        res.json({
            success: true,
            results: results
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
import { getTodayStats, get24HourStats, getRecentActivity, getSuccessRate } from '../services/statsService.js';

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

/**
 * POST /api/rename-batch
 * Process batch rename with progress updates
 */
router.post('/rename-batch', async (req, res) => {
    try {
        const { files, newNames } = req.body;

        if (!files || !newNames || files.length !== newNames.length) {
            return res.status(400).json({
                success: false,
                error: 'Invalid request: files and newNames arrays must have the same length'
            });
        }

        console.log(`\n📡 API: Batch rename request for ${files.length} files`);

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

        // Process batch rename (no progress callback for HTTP response)
        const results = await processBatchRename(files, newNames, apiKeys);

        res.json({
            success: true,
            results: results
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
 * GET /api/stats
 * Get current statistics (DISPLAY-ONLY, NOT SAVED TO DATABASE)
 * User requirement: Stats should be display-only, files with SKYFLIX = renamed successfully
 */
router.get('/stats', async (req, res) => {
    try {
        // 📊 DISPLAY-ONLY STATS (No database tracking)
        // Philosophy: Files ending with SKYFLIX have been successfully renamed
        // Success rate is always 100% since all visible files are already renamed

        const displayStats = {
            today: {
                date: new Date().toISOString().split('T')[0],
                count: 0,
                successful: 0,
                failed: 0
            },
            last24h: {
                count: 0,
                successful: 0,
                failed: 0
            },
            successRate: 100, // Always 100% - files with SKYFLIX = successfully renamed
            recentActivity: [] // Empty - no tracking needed
        };

        res.json({
            success: true,
            stats: displayStats
        });

    } catch (error) {
        console.error('❌ API Error:', error.message);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

export default router;
