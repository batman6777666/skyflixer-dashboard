import RPMShareAPI from '../api/RPMShareAPI.js';
import StreamP2PAPI from '../api/StreamP2PAPI.js';
import SeekStreamingAPI from '../api/SeekStreamingAPI.js';
import UPnShareAPI from '../api/UPnShareAPI.js';

/**
 * Fetch ALL files from all platforms using deep scan (all pages)
 * @param {Object} apiKeys - Object containing all API keys
 * @returns {Promise<Array>} - Array of unique files with platform information
 */
export async function fetchFilesFromAllPlatforms(apiKeys) {
    // Initialize API clients
    const rpmClient = new RPMShareAPI(apiKeys.rpmshare[0]);
    const streamClient = new StreamP2PAPI(apiKeys.streamp2p[0]);
    const seekClient = new SeekStreamingAPI(apiKeys.seekstreaming[0]);
    const upnClient = new UPnShareAPI(apiKeys.upnshare[0]);

    console.log('\n🔍 DEEP SCAN: Fetching ALL files from ALL pages on all platforms...\n');

    try {
        // Deep scan all platforms in parallel — each fetches every page
        const [rpmFiles, streamFiles, seekFiles, upnFiles] = await Promise.allSettled([
            rpmClient.listAllFiles(),
            streamClient.listAllFiles(),
            seekClient.listAllFiles(),
            upnClient.listAllFiles()
        ]);

        // Extract successful results
        const rpmFilesData = rpmFiles.status === 'fulfilled' ? rpmFiles.value : [];
        const streamFilesData = streamFiles.status === 'fulfilled' ? streamFiles.value : [];
        const seekFilesData = seekFiles.status === 'fulfilled' ? seekFiles.value : [];
        const upnFilesData = upnFiles.status === 'fulfilled' ? upnFiles.value : [];

        console.log(`\n📊 Deep scan complete:`);
        console.log(`   RPMShare    = ${rpmFilesData.length} files`);
        console.log(`   StreamP2P   = ${streamFilesData.length} files`);
        console.log(`   SeekStreaming = ${seekFilesData.length} files`);
        console.log(`   UPnShare    = ${upnFilesData.length} files`);
        console.log(`   TOTAL RAW   = ${rpmFilesData.length + streamFilesData.length + seekFilesData.length + upnFilesData.length} files\n`);

        // 🚫 FILTER OUT FILES CONTAINING "SKYFLIXER" ANYWHERE IN THE NAME
        // Show all files EXCEPT those that have "SKYFLIXER" branding
        const filterSkyflix = (files, platformName) => {
            const filtered = files.filter(file => {
                const name = file.name || '';
                const hasSkyflixer = name.toLowerCase().includes('skyflixer');
                if (hasSkyflixer) {
                    console.log(`🚫 [${platformName}] Filtered: ${name}`);
                }
                return !hasSkyflixer; // EXCLUDE SKYFLIXER files, show everything else
            });
            const removed = files.length - filtered.length;
            if (removed > 0) {
                console.log(`   ✂️  ${platformName}: removed ${removed} SKYFLIXER file(s), kept ${filtered.length}`);
            }
            return filtered;
        };

        const rpmFiltered = filterSkyflix(rpmFilesData, 'RPMShare');
        const streamFiltered = filterSkyflix(streamFilesData, 'StreamP2P');
        const seekFiltered = filterSkyflix(seekFilesData, 'SeekStreaming');
        const upnFiltered = filterSkyflix(upnFilesData, 'UPnShare');

        const totalAfterFilter = rpmFiltered.length + streamFiltered.length + seekFiltered.length + upnFiltered.length;
        console.log(`\n✅ SKYFLIXER-only filter: RPMShare=${rpmFiltered.length}, StreamP2P=${streamFiltered.length}, SeekStreaming=${seekFiltered.length}, UPnShare=${upnFiltered.length}`);
        console.log(`   TOTAL KEPT = ${totalAfterFilter} files\n`);

        // Match files across platforms using smart normalization
        const matchedFiles = matchFilesAcrossPlatforms(rpmFiltered, streamFiltered, seekFiltered, upnFiltered);

        console.log(`✅ Total unique groups: ${matchedFiles.length}`);

        return matchedFiles;
    } catch (error) {
        console.error('❌ Error fetching files:', error.message);
        throw error;
    }
}

/**
 * canonicalKey — Same logic as duplicateService so fetch + duplicate + missing all agree.
 *
 * TV episodes  → "showname|S01|E01"
 *   "A Dream of Splendor S01E01 Episode 1 SKYFLIXER"          → "a dream of splendor|S01|E01"
 *   "A Dream of Splendor S01E01 Waiting For My Love {Chinese}" → "a dream of splendor|S01|E01"
 *   Both produce the SAME key → merged into one entry.
 *
 * Movies → "title (year)"
 *   "The Dark Knight (2008) Hindi 1080p.mkv"                  → "the dark knight (2008)"
 *   "The Dark Knight (2008) {Hindi-English} SKYFLIXER"        → "the dark knight (2008)"
 */
function normalizeFilename(filename) {
    const clean = (filename || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\.(mkv|mp4|avi|mov|wmv)$/i, '')
        .replace(/\./g, ' ')
        .replace(/:/g, '')
        .replace(/\s+/g, ' ')
        .trim();

    // TV Episode: extract everything before SxxExx
    const epMatch = clean.match(/^(.*?)\s+(S\d+)(E\d+)/i);
    if (epMatch) {
        const showName = epMatch[1].replace(/\s+/g, ' ').trim().toLowerCase();
        const season   = epMatch[2].toUpperCase();
        const episode  = epMatch[3].toUpperCase();
        return `${showName}|${season}|${episode}`;
    }

    // Movie: extract "Title (Year)"
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

/**
 * Match files across platforms and create unique list.
 * Prefers SKYFLIXER-named files for the display filename.
 */
function matchFilesAcrossPlatforms(rpmFiles, streamFiles, seekFiles, upnFiles) {
    const fileMap = new Map(); // key → { filename, platforms, size, created_at }

    const allPlatformFiles = [
        { files: rpmFiles, platform: 'rpmshare' },
        { files: streamFiles, platform: 'streamp2p' },
        { files: seekFiles, platform: 'seekstreaming' },
        { files: upnFiles, platform: 'upnshare' }
    ];

    allPlatformFiles.forEach(({ files, platform }) => {
        files.forEach(file => {
            const originalName = file.name;
            const key = normalizeFilename(originalName);

            if (!fileMap.has(key)) {
                fileMap.set(key, {
                    filename: originalName,
                    platforms: [],
                    created_at: file.created_at,
                    size: file.size
                });
            }

            const entry = fileMap.get(key);

            // Prefer SKYFLIXER-named file as display name (it's the clean version)
            if (originalName.toLowerCase().includes('skyflixer')) {
                entry.filename = originalName;
            }

            // Avoid adding the same platform twice (e.g. original + skyflixer both on same platform)
            const alreadyAdded = entry.platforms.find(p => p.platform === platform);
            if (!alreadyAdded) {
                entry.platforms.push({ platform, fileId: file.fileId });
            }
        });
    });

    // Convert map to array and sort alphabetically
    return Array.from(fileMap.values()).sort((a, b) =>
        a.filename.localeCompare(b.filename)
    );
}
