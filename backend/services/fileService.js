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
 * Normalize filename for smart grouping across platforms
 * Extracts show name + season/episode to create a common key
 * @param {string} filename - Original filename
 * @returns {string} - Normalized grouping key
 */
function normalizeFilename(filename) {
    // Remove file extension
    let name = filename.replace(/\.(mkv|mp4|avi|mov|wmv)$/i, '');

    // Remove quality indicators, "SKYFLIXER", and metadata
    const removePatterns = [
        /\s*SKYFLIXER\s*/gi,
        /\s*1080P\s*/gi,
        /\s*720P\s*/gi,
        /\s*2160P\s*/gi,
        /\s*Hindi\s*/gi,
        /\s*English\s*/gi,
        /\s*Msubs\s*/gi,
        /\s*MoviesMod\.plus\s*/gi,
        /\s*\d+GB\s*/gi
    ];

    for (const pattern of removePatterns) {
        name = name.replace(pattern, ' ');
    }

    // Replace dots with spaces (UPN uses dots, others use spaces)
    name = name.replace(/\./g, ' ');

    // Replace colons with nothing (RPM uses "It: Welcome", others "It Welcome")
    name = name.replace(/:/g, '');

    // Normalize multiple spaces to single space
    name = name.replace(/\s+/g, ' ').trim();

    // Convert to lowercase for case-insensitive matching
    name = name.toLowerCase();

    // Try to extract episode identifier (S01E01, etc.) and show name
    const episodeMatch = name.match(/^(.+?)\s+(s\d+e\d+)/i);
    if (episodeMatch) {
        const showName = episodeMatch[1].trim();
        const episode = episodeMatch[2].toLowerCase();
        return `${showName} ${episode}`;
    }

    // If no episode pattern, return the cleaned name
    return name;
}

/**
 * Match files across platforms and create unique list
 * @param {Array} rpmFiles - Files from RPMShare
 * @param {Array} streamFiles - Files from StreamP2P
 * @param {Array} seekFiles - Files from SeekStreaming
 * @param {Array} upnFiles - Files from UPnShare
 * @returns {Array} - Unique files with platform information
 */
function matchFilesAcrossPlatforms(rpmFiles, streamFiles, seekFiles, upnFiles) {
    const fileMap = new Map();

    const allPlatformFiles = [
        { files: rpmFiles, platform: 'rpmshare' },
        { files: streamFiles, platform: 'streamp2p' },
        { files: seekFiles, platform: 'seekstreaming' },
        { files: upnFiles, platform: 'upnshare' }
    ];

    allPlatformFiles.forEach(({ files, platform }) => {
        files.forEach(file => {
            const originalName = file.name;
            const normalizedKey = normalizeFilename(originalName);

            if (!fileMap.has(normalizedKey)) {
                fileMap.set(normalizedKey, {
                    filename: originalName,
                    platforms: [],
                    created_at: file.created_at,
                    size: file.size
                });
            }

            fileMap.get(normalizedKey).platforms.push({
                platform: platform,
                fileId: file.fileId
            });
        });
    });

    // Convert map to array and sort alphabetically
    return Array.from(fileMap.values()).sort((a, b) =>
        a.filename.localeCompare(b.filename)
    );
}
