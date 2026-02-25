/**
 * duplicateService.js — Correct Logic
 * ─────────────────────────────────────────────────────────────
 * Each platform has ONE account (KEY1).  KEY2 is the same account.
 * 
 * DUPLICATE (within a platform):
 *   Same filename appears MORE THAN ONCE on the same platform.
 *   Identified by exact name (lowercase + trim + accent-normalized).
 *   Keep 1, delete the rest.
 *
 * MISSING (across platforms):
 *   A file that exists on ≥2 platforms but is NOT on ≥2 other platforms.
 *   (User requirement: only show if truly unbalanced — on some but not most)
 */

import RPMShareAPI from '../api/RPMShareAPI.js';
import StreamP2PAPI from '../api/StreamP2PAPI.js';
import SeekStreamingAPI from '../api/SeekStreamingAPI.js';
import UPnShareAPI from '../api/UPnShareAPI.js';

const PLATFORMS = ['streamp2p', 'rpmshare', 'seekstreaming', 'upnshare'];

// ─── Helpers ──────────────────────────────────────────────

/**
 * nameKey — strict, used for DUPLICATE detection within a platform.
 * Lowercase + trim + remove accents only.
 */
function nameKey(filename) {
    return (filename || '')
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
}

/**
 * missingKey — looser, used for MISSING FILE detection across platforms.
 * Also strips:
 *   • file extensions (.mkv, .mp4, .avi, .mov)
 *   • parenthetical qualifiers inside language tags like (Clear), (Dubbed), (HQ)
 *   • collapses multiple spaces
 *
 * Examples:
 *   "Shambhala (2025) {Hindi (Clear)-Telugu} SKYFLIXER"
 *     → "shambhala (2025) {hindi-telugu} skyflixer"
 *   "Santhana Prapthirasthu (2025) {Hindi-Telugu} SKYFLIXER.mkv"
 *     → "santhana prapthirasthu (2025) {hindi-telugu} skyflixer"
 */
function missingKey(filename) {
    return (filename || '')
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')           // remove accents
        .replace(/\.(mkv|mp4|avi|mov|wmv)$/i, '')  // strip video extension
        .replace(/\s*\(clear\)\s*/gi, '')           // strip (Clear)
        .replace(/\s*\(dubbed\)\s*/gi, '')          // strip (Dubbed)
        .replace(/\s*\(hq\)\s*/gi, '')              // strip (HQ)
        .replace(/\s*\(cam\)\s*/gi, '')             // strip (Cam)
        .replace(/\s+/g, ' ')                       // collapse spaces
        .trim();
}

function getId(file) {
    return file.fileId || file.id;
}

/** Create API clients using only KEY1 per platform */
function getClients(apiKeys) {
    return {
        streamp2p: new StreamP2PAPI(apiKeys.streamp2p[0]),
        rpmshare: new RPMShareAPI(apiKeys.rpmshare[0]),
        seekstreaming: new SeekStreamingAPI(apiKeys.seekstreaming[0]),
        upnshare: new UPnShareAPI(apiKeys.upnshare[0])
    };
}

/** Fetch files from all 4 platforms in parallel.
 *  Each platform's listAllFiles() fetches pages SEQUENTIALLY internally,
 *  so this is safe from rate-limiting while staying fast (~3s total). */
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
// 1. FIND DUPLICATES — within each platform (KEY1 account)
// ══════════════════════════════════════════════════════════════
export async function findDuplicates(apiKeys) {
    console.log('\n🔍 FIND DUPLICATES: scanning each platform for same-named files...');
    const { raw } = await fetchRaw(apiKeys);

    const result = {};
    let totalDuplicates = 0;

    for (const platform of PLATFORMS) {
        const files = raw[platform];

        // Group files by normalized name
        const nameMap = new Map(); // nameKey → [{ fileId, name }, ...]
        for (const file of files) {
            const key = nameKey(file.name);
            if (!nameMap.has(key)) nameMap.set(key, []);
            nameMap.get(key).push({ fileId: getId(file), name: file.name });
        }

        const platformDups = [];
        for (const [key, group] of nameMap.entries()) {
            if (group.length > 1) {
                const keep = group[0];
                const remove = group.slice(1);
                platformDups.push({
                    normalizedName: key,
                    count: group.length,
                    keep,
                    remove
                });
                totalDuplicates += remove.length;
                console.log(`  [${platform}] DUP x${group.length}: "${keep.name}"`);
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

    // Single scan — reuse the same data for both finding and deleting
    const { raw, clients } = await fetchRaw(apiKeys);

    let totalDeleted = 0;
    let totalFailed = 0;
    const results = [];

    for (const platform of PLATFORMS) {
        const files = raw[platform];

        // Group by normalized name to find duplicates
        const nameMap = new Map();
        for (const file of files) {
            const key = nameKey(file.name);
            if (!nameMap.has(key)) nameMap.set(key, []);
            nameMap.get(key).push({ fileId: getId(file), name: file.name });
        }

        const toDelete = [];
        for (const [, group] of nameMap.entries()) {
            if (group.length > 1) {
                // Keep first, delete the rest
                for (const extra of group.slice(1)) {
                    toDelete.push({ ...extra, platform });
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
                const errMsg = res?.error || 'Unknown error';
                results.push({ success: false, platform, fileId: entry.fileId, name: entry.name, error: errMsg });
                console.log(`    ❌ Failed: "${entry.name}" — ${errMsg}`);
            }
            // Small delay between deletes to avoid rate limiting
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
 * MISSING = a file exists on some platforms but NOT all 4.
 *
 * Uses missingKey() for comparison so minor naming differences
 * (e.g. .mkv extension, "(Clear)" audio qualifier) don't cause false mismatches.
 *
 * Shows ALL missing cases — clearly stating which platform each file is missing from.
 */
export async function findMissingFiles(apiKeys) {
    console.log('\n📋 FIND MISSING FILES: comparing across all platforms...');
    const { raw } = await fetchRaw(apiKeys);

    const platformCounts = {};
    const nameSets = {};

    for (const platform of PLATFORMS) {
        platformCounts[platform] = raw[platform].length;

        nameSets[platform] = new Map(); // missingKey → original filename
        for (const file of raw[platform]) {
            const key = missingKey(file.name);
            if (!nameSets[platform].has(key)) {
                nameSets[platform].set(key, file.name);
            }
        }
        console.log(`  [${platform}] ${raw[platform].length} files → ${nameSets[platform].size} unique (after normalization)`);
    }

    // Master union of all unique filenames across all platforms
    const master = new Map(); // missingKey → best display name (from first platform that has it)
    for (const platform of PLATFORMS) {
        for (const [key, name] of nameSets[platform]) {
            if (!master.has(key)) master.set(key, name);
        }
    }

    console.log(`  Total unique files across all platforms: ${master.size}`);

    const missingFiles = [];

    for (const [key, filename] of master) {
        const presentIn = PLATFORMS.filter(p => nameSets[p].has(key));
        const missingIn = PLATFORMS.filter(p => !nameSets[p].has(key));

        // Report if missing from at least 1 platform (present on at least 1)
        if (missingIn.length > 0 && presentIn.length > 0) {
            missingFiles.push({ filename, presentIn, missingIn });
        }
    }

    missingFiles.sort((a, b) => a.filename.localeCompare(b.filename));

    console.log(`\n✅ Missing file report: ${missingFiles.length} file(s) missing from at least 1 platform`);
    for (const m of missingFiles) {
        console.log(`   "${m.filename}"`);
        console.log(`     ✅ Present: [${m.presentIn.join(', ')}]`);
        console.log(`     ❌ Missing: [${m.missingIn.join(', ')}]`);
    }

    return { missingFiles, totalMissing: missingFiles.length, platformCounts };
}

