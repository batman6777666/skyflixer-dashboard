/**
 * duplicateService.js — Smart Logic
 * ─────────────────────────────────────────────────────────────
 * Uses the same titleYearKey() normalization as fileService so that:
 *   • Duplicates: "Movie 2024 Hindi.mkv" and "Movie (2024) {Hindi} SKYFLIXER"
 *     on the same platform are correctly found as duplicates.
 *     The SKYFLIXER version is always KEPT, the old one deleted.
 *
 *   • Missing: same title+year on all 4 platforms matches even if
 *     one platform has the old name and another has the SKYFLIXER name.
 */

import RPMShareAPI from '../api/RPMShareAPI.js';
import StreamP2PAPI from '../api/StreamP2PAPI.js';
import SeekStreamingAPI from '../api/SeekStreamingAPI.js';
import UPnShareAPI from '../api/UPnShareAPI.js';

const PLATFORMS = ['streamp2p', 'rpmshare', 'seekstreaming', 'upnshare'];

// ─── Canonical key shared by all 3 functions ──────────────────
/**
 * canonicalKey — Smart key extraction for both TV episodes and movies.
 *
 * TV episodes  → "showname|S01|E01"
 *   Extracts everything BEFORE the SxxExx pattern as show name.
 *   Ignores everything after (episode title, language tags, SKYFLIXER).
 *   "A Dream of Splendor S01E01 Episode 1 SKYFLIXER"         → "a dream of splendor|S01|E01"
 *   "A Dream of Splendor S01E01 Waiting For My Love {Chinese}"→ "a dream of splendor|S01|E01"
 *
 * Movies → "title (year)"
 *   "The Dark Knight (2008) Hindi 1080p BluRay.mkv"          → "the dark knight (2008)"
 *   "The Dark Knight (2008) {Hindi-English} SKYFLIXER"       → "the dark knight (2008)"
 *
 * Everything after SxxExx or (year) is stripped: language tags,
 * quality specs, source tags, platform branding.
 */
function canonicalKey(filename) {
    const clean = (filename || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')      // strip accents
        .replace(/\.(mkv|mp4|avi|mov|wmv)$/i, '') // strip extension
        .replace(/\./g, ' ')                   // dots → spaces
        .replace(/:/g, '')                     // remove colons
        .replace(/\s+/g, ' ')
        .trim();

    // ── TV Episode: "ShowName S01E01 ..." ──
    // Regex: ^(.*?) (S\d+)(E\d+)  – greedy show name, then season, then episode
    const epMatch = clean.match(/^(.*?)\s+(S\d+)(E\d+)/i);
    if (epMatch) {
        const showName = epMatch[1].replace(/\s+/g, ' ').trim().toLowerCase();
        const season   = epMatch[2].toUpperCase(); // e.g. S01
        const episode  = epMatch[3].toUpperCase(); // e.g. E01
        return `${showName}|${season}|${episode}`;
    }

    // ── Movie: extract "Title (Year)" ──
    const stripped = clean
        .replace(/\{[^}]*\}/g, '')             // strip {lang tags}
        .replace(/\[[^\]]*\]/g, '')            // strip [source tags]
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

function getClients(apiKeys) {
    return {
        streamp2p: new StreamP2PAPI(apiKeys.streamp2p[0]),
        rpmshare: new RPMShareAPI(apiKeys.rpmshare[0]),
        seekstreaming: new SeekStreamingAPI(apiKeys.seekstreaming[0]),
        upnshare: new UPnShareAPI(apiKeys.upnshare[0])
    };
}

async function fetchRaw(apiKeys) {
    const clients = getClients(apiKeys);
    const results = await Promise.allSettled(
        PLATFORMS.map(p => clients[p].listAllFiles())
    );

    const raw = {};
    for (let i = 0; i < PLATFORMS.length; i++) {
        const p = PLATFORMS[i];
        raw[p] = results[i].status === 'fulfilled' ? results[i].value : [];
        console.log(`  [${p}] ${raw[p].length} files`);
    }
    return { raw, clients };
}


// ══════════════════════════════════════════════════════════════
// 1. FIND DUPLICATES — within each platform
// ══════════════════════════════════════════════════════════════
/**
 * Groups files by titleYearKey per platform.
 * If > 1 file maps to the same key, it's a duplicate set.
 * Keeps the SKYFLIXER-named file; marks the rest for deletion.
 */
export async function findDuplicates(apiKeys) {
    console.log('\n🔍 FIND DUPLICATES: scanning each platform for same-content files...');
    const { raw } = await fetchRaw(apiKeys);

    const result = {};
    let totalDuplicates = 0;

    for (const platform of PLATFORMS) {
        const files = raw[platform];

        // Group files by canonical title+year key
        const keyMap = new Map(); // canonicalKey → [{ fileId, name }, ...]
        for (const file of files) {
            const key = canonicalKey(file.name);
            if (!keyMap.has(key)) keyMap.set(key, []);
            keyMap.get(key).push({ fileId: getId(file), name: file.name });
        }

        const platformDups = [];
        for (const [key, group] of keyMap.entries()) {
            if (group.length > 1) {
                // Prefer the SKYFLIXER-named file as "keep"
                const skyflixerIdx = group.findIndex(f => f.name.toLowerCase().includes('skyflixer'));
                const keepIdx = skyflixerIdx >= 0 ? skyflixerIdx : 0;
                const keep = group[keepIdx];
                const remove = group.filter((_, i) => i !== keepIdx);

                platformDups.push({ normalizedName: key, count: group.length, keep, remove });
                totalDuplicates += remove.length;
                console.log(`  [${platform}] DUP x${group.length}: keep="${keep.name}"`);
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
export async function deleteDuplicates(apiKeys) {
    console.log('\n🗑️  DELETE DUPLICATES — single scan then delete...');
    const { raw, clients } = await fetchRaw(apiKeys);

    let totalDeleted = 0;
    let totalFailed = 0;
    const results = [];

    for (const platform of PLATFORMS) {
        const files = raw[platform];

        const keyMap = new Map();
        for (const file of files) {
            const key = canonicalKey(file.name);
            if (!keyMap.has(key)) keyMap.set(key, []);
            keyMap.get(key).push({ fileId: getId(file), name: file.name });
        }

        const toDelete = [];
        for (const [, group] of keyMap.entries()) {
            if (group.length > 1) {
                const skyflixerIdx = group.findIndex(f => f.name.toLowerCase().includes('skyflixer'));
                const keepIdx = skyflixerIdx >= 0 ? skyflixerIdx : 0;
                for (let i = 0; i < group.length; i++) {
                    if (i !== keepIdx) toDelete.push({ ...group[i], platform });
                }
            }
        }

        if (toDelete.length === 0) {
            console.log(`  [${platform}] ✅ No duplicates to delete`);
            continue;
        }

        console.log(`  [${platform}] Deleting ${toDelete.length} duplicate(s)...`);
        const client = clients[platform];

        for (const entry of toDelete) {
            const res = await client.deleteFile(entry.fileId);
            const ok = res?.success === true;
            if (ok) {
                totalDeleted++;
                results.push({ success: true, platform, fileId: entry.fileId, name: entry.name });
                console.log(`    ✅ Deleted: "${entry.name}" (${entry.fileId})`);
            } else {
                totalFailed++;
                results.push({ success: false, platform, fileId: entry.fileId, name: entry.name, error: res?.error || 'Unknown error' });
                console.log(`    ❌ Failed: "${entry.name}"`);
            }
            await new Promise(r => setTimeout(r, 300));
        }
    }

    console.log(`\n✅ Done. Deleted: ${totalDeleted}  |  Failed: ${totalFailed}`);
    return { results, totalDeleted, totalFailed };
}

// ══════════════════════════════════════════════════════════════
// 3. FIND MISSING FILES — across platforms
// ══════════════════════════════════════════════════════════════
/**
 * Uses canonicalKey() so TV episodes match even when episode titles differ,
 * and movies match even when naming formats differ across platforms.
 */
export async function findMissingFiles(apiKeys) {
    console.log('\n📋 FIND MISSING FILES: comparing across all platforms...');
    const { raw } = await fetchRaw(apiKeys);

    const platformCounts = {};
    const nameSets = {};     // platform → Map<canonicalKey, bestDisplayName>
    const uniqueCounts = {}; // platform → unique title count

    for (const platform of PLATFORMS) {
        platformCounts[platform] = raw[platform].length;
        nameSets[platform] = new Map();

        for (const file of raw[platform]) {
            const key = canonicalKey(file.name);
            const existing = nameSets[platform].get(key);
            // Prefer SKYFLIXER-named version as display name
            if (!existing || file.name.toLowerCase().includes('skyflixer')) {
                nameSets[platform].set(key, file.name);
            }
        }
        uniqueCounts[platform] = nameSets[platform].size;
        console.log(`  [${platform}] ${raw[platform].length} files → ${nameSets[platform].size} unique titles`);
    }

    // Master union of all unique titles across all platforms
    const master = new Map();
    for (const platform of PLATFORMS) {
        for (const [key, name] of nameSets[platform]) {
            if (!master.has(key)) master.set(key, name);
            else if (name.toLowerCase().includes('skyflixer')) master.set(key, name);
        }
    }

    console.log(`  Total unique titles across all platforms: ${master.size}`);

    const missingFiles = [];
    const syncedCount = { all4: 0 };

    for (const [key, rawFilename] of master) {
        const presentIn = PLATFORMS.filter(p => nameSets[p].has(key));
        const missingIn = PLATFORMS.filter(p => !nameSets[p].has(key));

        // Build clean display title from the key itself
        // Episode key format: "showname|S01|E01" → "Show Name S01E01"
        // Movie key format:   "title (year)"      → "Title (Year)" as-is
        let displayTitle;
        if (key.includes('|')) {
            const [show, season, episode] = key.split('|');
            // Title-case the show name
            const showTitled = show.replace(/\b\w/g, c => c.toUpperCase());
            displayTitle = `${showTitled} ${season}${episode}`;
        } else {
            displayTitle = rawFilename; // movie: use the actual (best) filename
        }

        if (missingIn.length === 0) {
            syncedCount.all4++;
        } else if (presentIn.length > 0) {
            missingFiles.push({ filename: displayTitle, presentIn, missingIn });
        }
    }

    missingFiles.sort((a, b) => a.filename.localeCompare(b.filename));

    console.log(`\n✅ In sync on all 4 platforms: ${syncedCount.all4}`);
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
