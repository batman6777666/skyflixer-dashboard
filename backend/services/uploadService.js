/**
 * uploadService.js  —  Simple submit + poll approach
 *
 * submitToAllPlatforms(url, name)
 *   → submits to all 4 platforms simultaneously
 *   → returns { streamp2p: {taskId|error}, seekstreaming: {...}, ... }
 *
 * getPlatformStatus(platform, taskId, apiKey)
 *   → polls ONE platform task
 *   → returns { status, percent, videos }
 */

import axios from 'axios';

const PLATFORMS = {
    streamp2p: { baseURL: 'https://streamp2p.com/api/v1', label: 'StreamP2P' },
    seekstreaming: { baseURL: 'https://seekstreaming.com/api/v1', label: 'SeekStreaming' },
    upnshare: { baseURL: 'https://upnshare.com/api/v1', label: 'UPnShare' },
    vidplay: { baseURL: 'https://easyvidplay.com/api/v1', label: 'VidPlay' }
};

function getApiKey(platform) {
    const map = {
        streamp2p: [process.env.STREAMP2P_API_KEY_1, process.env.STREAMP2P_API_KEY_2, process.env.STREAMP2P_API_KEY_3],
        seekstreaming: [process.env.SEEKSTREAMING_API_KEY_1, process.env.SEEKSTREAMING_API_KEY_2, process.env.SEEKSTREAMING_API_KEY_3],
        upnshare: [process.env.UPNSHARE_API_KEY_1, process.env.UPNSHARE_API_KEY_2, process.env.UPNSHARE_API_KEY_3],
        vidplay: [process.env.VIDPLAY_API_KEY_1, process.env.VIDPLAY_API_KEY_2, process.env.VIDPLAY_API_KEY_3]
    };
    return (map[platform] || []).find(k => k) || null;
}

function makeClient(platform) {
    const apiKey = getApiKey(platform);
    if (!apiKey) throw new Error(`No API key for ${platform}`);
    return { client: axios.create({
        baseURL: PLATFORMS[platform].baseURL,
        headers: { 'api-token': apiKey, 'Content-Type': 'application/json' },
        timeout: 30000
    }), apiKey };
}

// ── Submit URL to all 4 platforms simultaneously ───────────
export async function submitToAllPlatforms(url, name) {
    console.log(`\n📤 Submitting to all platforms: ${name}`);

    const ids = Object.keys(PLATFORMS);

    const doSubmit = async (platform) => {
        try {
            const { client } = makeClient(platform);
            const response = await client.post('/video/advance-upload', { url, name });
            const taskId = response.data?.id || response.data?.data?.id;
            if (!taskId) throw new Error('No task ID in response');
            console.log(`  [${platform}] ✅ submitted → taskId: ${taskId}`);
            return { platform, taskId, submitted: true };
        } catch (err) {
            console.error(`  [${platform}] ❌ ${err.message}`);
            return { platform, error: err.message, submitted: false };
        }
    };

    // Submit to all 4 simultaneously
    console.log('  → Submitting to all 4 platforms simultaneously');
    const results = await Promise.allSettled(ids.map(doSubmit));

    // Merge into keyed result object
    const out = {};
    results.forEach(r => {
        const v = r.value || { platform: 'unknown', error: r.reason?.message || 'Unknown error' };
        out[v.platform] = v;
    });
    return out;
}

// ── Poll ONE platform task status ─────────────────────────────
export async function getPlatformStatus(platform, taskId) {
    const { client } = makeClient(platform);
    const response = await client.get(`/video/advance-upload/${taskId}`);
    const data = response.data?.data || response.data;
    const status = data?.status || 'Processing';
    return {
        status,
        videos: data?.videos || [],
        percent: status === 'Completed' ? 100
            : status === 'Queued' ? 10
                : status === 'Failed' ? 0
                    : 50
    };
}
