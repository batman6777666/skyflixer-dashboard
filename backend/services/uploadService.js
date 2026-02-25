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
    rpmshare: { baseURL: 'https://rpmshare.com/api/v1', label: 'RPMShare' }
};

function getApiKey(platform) {
    const map = {
        streamp2p: [process.env.STREAMP2P_API_KEY_1, process.env.STREAMP2P_API_KEY_2],
        seekstreaming: [process.env.SEEKSTREAMING_API_KEY_1, process.env.SEEKSTREAMING_API_KEY_2],
        upnshare: [process.env.UPNSHARE_API_KEY_1, process.env.UPNSHARE_API_KEY_2],
        rpmshare: [process.env.RPMSHARE_API_KEY_1, process.env.RPMSHARE_API_KEY_2]
    };
    return (map[platform] || []).find(k => k) || null;
}

function makeClient(platform) {
    const apiKey = getApiKey(platform);
    if (!apiKey) throw new Error(`No API key for ${platform}`);
    return axios.create({
        baseURL: PLATFORMS[platform].baseURL,
        headers: { 'api-token': apiKey, 'Content-Type': 'application/json' },
        timeout: 30000
    });
}

// ── Submit URL: first 2 platforms, then remaining 2 once both start ───────────
export async function submitToAllPlatforms(url, name) {
    console.log(`\n📤 Submitting to all platforms: ${name}`);

    const ids = Object.keys(PLATFORMS);  // ['streamp2p','seekstreaming','upnshare','rpmshare']
    const first2 = ids.slice(0, 2);         // streamp2p, seekstreaming
    const second2 = ids.slice(2);            // upnshare,  rpmshare

    // Shared closure so submitOne can access url/name
    const doSubmit = async (platform) => {
        try {
            const client = makeClient(platform);
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

    // Step 1: submit to first 2 simultaneously
    console.log('  → Wave 1: submitting to', first2.join(' + '));
    const wave1 = await Promise.allSettled(first2.map(doSubmit));

    // Step 2: as soon as wave1 responds (upload started on those 2), fire the remaining 2
    console.log('  → Wave 2: submitting to', second2.join(' + '));
    const wave2 = await Promise.allSettled(second2.map(doSubmit));

    // Merge into keyed result object
    const out = {};
    [...wave1, ...wave2].forEach(r => {
        const v = r.value || { platform: 'unknown', error: r.reason?.message || 'Unknown error' };
        out[v.platform] = v;
    });
    return out;
}

// ── Poll ONE platform task status ─────────────────────────────
export async function getPlatformStatus(platform, taskId) {
    const client = makeClient(platform);
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
