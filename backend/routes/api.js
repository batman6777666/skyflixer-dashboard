import express from 'express';
import { fetchFilesFromAllPlatforms } from '../services/fileService.js';
import { processBatchRename } from '../services/renameService.js';
import { getSessionStats } from '../services/sessionStats.js';

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

export default router;
