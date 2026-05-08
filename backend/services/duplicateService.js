/**
 * duplicateService.js — Smart Logic
 * ─────────────────────────────────────────────────────────────
 * Uses canonicalKey() normalization.
 * 
 * IMPORTANT: Uses only 1 API key per platform for scanning.
 * All keys access the same account data, so using multiple keys
 * would double-count files and produce false duplicates.
 */

import VidPlayAPI from '../api/VidPlayAPI.js';
import StreamP2PAPI from '../api/StreamP2PAPI.js';
import SeekStreamingAPI from '../api/SeekStreamingAPI.js';
import UPnShareAPI from '../api/UPnShareAPI.js';

const PLATFORMS = ['streamp2p', 'vidplay', 'seekstreaming', 'upnshare'];

// ─── Canonical key shared by all 3 functions ──────────────────
function canonicalKey(filename) {
    const clean = (filename || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\.(mkv|mp4|avi|mov|wmv)$/i, '')
        .replace(/\./g, ' ')
        .replace(/:/g, '')
        .replace(/\s+/g, ' ')
        .trim();

    // ── TV Episode: "ShowName S01E01 ..." ──
    const epMatch = clean.match(/^(.*?)\s+(S\d+)(E\d+)/i);
    if (epMatch) {
        const showName = epMatch[1].replace(/\s+/g, ' ').trim().toLowerCase();
        const season   = epMatch[2].toUpperCase();
        const episode  = epMatch[3].toUpperCase();
        return `${showName}|${season}|${episode}`;
    }

    // ── Movie: extract "Title (Year)" ──
    const stripped = clean
        .replace(/\{[^}]*\}/g, '')
        .replace(/\[[^\]]*\]/g, '')
        .replace(/\b(1080p|720p|2160p|4k|bluray|blu ray|web dl|webrip|hdcam|hdrip|esub|msub|dubbed|hindi|english|tamil|telugu|kannada|malayalam|korean|chinese|french|spanish|arabic|malay|thai|japanese|multi|skyflixer|bollyflix|moviesmod|msubs)\b/gi, '')
        .replace(/\s+/g, ' ')
        .trim()
        .toLowerCase();

    const yearMatch = stripped.match(/^(.+?)\s*\((\d{4})\)/);
    if (yearMatch) {
        return `${yearMatch[1].trim()} (${yearMatch[2]})`;
    }

    return stripped;
}

function getId(file) {
    return file.fileId || file.id;
}

/**
 * Create ONE client per platform using the FIRST API key only.
 * Only creates clients for the enabled platforms.
 */
function getClients(apiKeys, activePlatforms) {
    const clientMap = {
        streamp2p: (key) => new StreamP2PAPI(key),
        vidplay: (key) => new VidPlayAPI(key),
        seekstreaming: (key) => new SeekStreamingAPI(key),
        upnshare: (key) => new UPnShareAPI(key)
    };
    const clients = {};
    for (const p of activePlatforms) {
        if (apiKeys[p]?.[0] && clientMap[p]) {
            clients[p] = clientMap[p](apiKeys[p][0]);
        }
    }
    return clients;
}

/**
 * Fetch ALL files from enabled platforms in parallel WITH progress.
 * @param {Object} apiKeys
 * @param {Function} onProgress - optional({ platform, pagesCompleted, totalPages, overallPercent })
 * @param {string[]} activePlatforms - which platforms to scan
 */
async function fetchRaw(apiKeys, onProgress, activePlatforms) {
    const clients = getClients(apiKeys, activePlatforms);

    // Track progress per platform
    const progress = {};
    activePlatforms.forEach(p => { progress[p] = { pagesCompleted: 0, totalPages: 1 }; });

    const emitProgress = (platform, data) => {
        progress[platform] = data;
        if (onProgress) {
            const totalPages = Object.values(progress).reduce((s, p) => s + p.totalPages, 0);
            const completedPages = Object.values(progress).reduce((s, p) => s + p.pagesCompleted, 0);
            const overallPercent = totalPages > 0 ? Math.round((completedPages / totalPages) * 100) : 0;
            onProgress({ platform, ...data, overallPercent, allProgress: { ...progress } });
        }
    };

    const results = await Promise.allSettled(
        activePlatforms.map(p => clients[p].listAllFiles((pg) => emitProgress(p, pg)))
    );

    const raw = {};
    for (let i = 0; i < activePlatforms.length; i++) {
        const p = activePlatforms[i];
        raw[p] = results[i].status === 'fulfilled' ? results[i].value : [];
        console.log(`  [${p}] ${raw[p].length} files`);
    }
    return { raw, clients };
}


// ══════════════════════════════════════════════════════════════
// 1. FIND DUPLICATES — within each platform
// ══════════════════════════════════════════════════════════════
export async function findDuplicates(apiKeys, onProgress, enabledPlatforms) {
    const activePlatforms = enabledPlatforms || PLATFORMS;
    console.log(`\n🔍 FIND DUPLICATES: scanning ${activePlatforms.join(', ')} for same-content files...`);
    const { raw } = await fetchRaw(apiKeys, onProgress, activePlatforms);

    const result = {};
    let totalDuplicates = 0;

    for (const platform of activePlatforms) {
        const files = raw[platform];

        const keyMap = new Map();
        for (const file of files) {
            const key = canonicalKey(file.name);
            if (!keyMap.has(key)) keyMap.set(key, []);
            keyMap.get(key).push({ fileId: getId(file), name: file.name });
        }

        const platformDups = [];
        for (const [key, group] of keyMap.entries()) {
            if (group.length > 1) {
                const skyflixerIdx = group.findIndex(f => f.name.toLowerCase().includes('skyflixer'));
                const keepIdx = skyflixerIdx >= 0 ? skyflixerIdx : 0;
                const keep = group[keepIdx];
                const remove = group.filter((_, i) => i !== keepIdx);
                platformDups.push({ normalizedName: key, count: group.length, keep, remove });
                totalDuplicates += remove.length;
            }
        }

        result[platform] = platformDups;
        if (platformDups.length === 0) {
            console.log(`  [${platform}] ✅ No duplicates`);
        } else {
            console.log(`  [${platform}] ⚠️ ${platformDups.length} group(s), ${platformDups.reduce((s, d) => s + d.remove.length, 0)} to delete`);
        }
    }

    console.log(`\n✅ Total extra copies to delete: ${totalDuplicates}`);
    return { duplicates: result, totalDuplicates };
}

// ══════════════════════════════════════════════════════════════
// 2. DELETE DUPLICATES
// ══════════════════════════════════════════════════════════════
export async function deleteDuplicates(apiKeys, onProgress, onDeleteProgress, enabledPlatforms) {
    const activePlatforms = enabledPlatforms || PLATFORMS;
    console.log(`\n🗑️  DELETE DUPLICATES — scanning ${activePlatforms.join(', ')} then delete...`);
    const { raw, clients } = await fetchRaw(apiKeys, onProgress, activePlatforms);

    // Collect all items to delete
    const allToDelete = [];
    for (const platform of activePlatforms) {
        const files = raw[platform];
        const keyMap = new Map();
        for (const file of files) {
            const key = canonicalKey(file.name);
            if (!keyMap.has(key)) keyMap.set(key, []);
            keyMap.get(key).push({ fileId: getId(file), name: file.name });
        }
        for (const [, group] of keyMap.entries()) {
            if (group.length > 1) {
                const skyflixerIdx = group.findIndex(f => f.name.toLowerCase().includes('skyflixer'));
                const keepIdx = skyflixerIdx >= 0 ? skyflixerIdx : 0;
                for (let i = 0; i < group.length; i++) {
                    if (i !== keepIdx) allToDelete.push({ ...group[i], platform });
                }
            }
        }
    }

    let totalDeleted = 0;
    let totalFailed = 0;
    const results = [];
    const total = allToDelete.length;

    if (total === 0) {
        console.log('  ✅ No duplicates to delete');
        if (onDeleteProgress) onDeleteProgress({ deleted: 0, total: 0, percent: 100 });
        return { results, totalDeleted: 0, totalFailed: 0 };
    }

    console.log(`  Deleting ${total} duplicate(s)...`);

    for (let i = 0; i < allToDelete.length; i++) {
        const entry = allToDelete[i];
        const client = clients[entry.platform];
        const res = await client.deleteFile(entry.fileId);
        const ok = res?.success === true;
        if (ok) {
            totalDeleted++;
            results.push({ success: true, platform: entry.platform, fileId: entry.fileId, name: entry.name });
        } else {
            totalFailed++;
            results.push({ success: false, platform: entry.platform, fileId: entry.fileId, name: entry.name, error: res?.error || 'Unknown error' });
        }

        if (onDeleteProgress) {
            const percent = Math.round(((i + 1) / total) * 100);
            onDeleteProgress({ deleted: totalDeleted, failed: totalFailed, current: i + 1, total, percent, name: entry.name });
        }
    }

    console.log(`\n✅ Done. Deleted: ${totalDeleted}  |  Failed: ${totalFailed}`);
    return { results, totalDeleted, totalFailed };
}

// ══════════════════════════════════════════════════════════════
// 3. FIND MISSING FILES — across platforms
// ══════════════════════════════════════════════════════════════
export async function findMissingFiles(apiKeys, onProgress, enabledPlatforms) {
    const activePlatforms = enabledPlatforms || PLATFORMS;
    console.log(`\n📋 FIND MISSING FILES: comparing ${activePlatforms.join(', ')}...`);
    const { raw } = await fetchRaw(apiKeys, onProgress, activePlatforms);

    const platformCounts = {};
    const nameSets = {};
    const uniqueCounts = {};

    for (const platform of activePlatforms) {
        platformCounts[platform] = raw[platform].length;
        nameSets[platform] = new Map();

        for (const file of raw[platform]) {
            const key = canonicalKey(file.name);
            const existing = nameSets[platform].get(key);
            if (!existing || file.name.toLowerCase().includes('skyflixer')) {
                nameSets[platform].set(key, file.name);
            }
        }
        uniqueCounts[platform] = nameSets[platform].size;
        console.log(`  [${platform}] ${raw[platform].length} files → ${nameSets[platform].size} unique titles`);
    }

    const master = new Map();
    for (const platform of activePlatforms) {
        for (const [key, name] of nameSets[platform]) {
            if (!master.has(key)) master.set(key, name);
            else if (name.toLowerCase().includes('skyflixer')) master.set(key, name);
        }
    }

    console.log(`  Total unique titles across all platforms: ${master.size}`);

    const missingFiles = [];
    const syncedCount = { all4: 0 };

    for (const [key, rawFilename] of master) {
        const presentIn = activePlatforms.filter(p => nameSets[p].has(key));
        const missingIn = activePlatforms.filter(p => !nameSets[p].has(key));

        let displayTitle;
        if (key.includes('|')) {
            const [show, season, episode] = key.split('|');
            const showTitled = show.replace(/\b\w/g, c => c.toUpperCase());
            displayTitle = `${showTitled} ${season}${episode}`;
        } else {
            displayTitle = rawFilename;
        }

        if (missingIn.length === 0) {
            syncedCount.all4++;
        } else if (presentIn.length > 0) {
            missingFiles.push({ filename: displayTitle, presentIn, missingIn });
        }
    }

    missingFiles.sort((a, b) => a.filename.localeCompare(b.filename));

    console.log(`\n✅ In sync on all ${activePlatforms.length} platforms: ${syncedCount.all4}`);
    console.log(`⚠️  Missing from at least 1 platform: ${missingFiles.length}`);

    return {
        missingFiles,
        totalMissing: missingFiles.length,
        platformCounts,
        uniqueCounts,
        syncedCount: syncedCount.all4,
        totalUnique: master.size
    };
}
