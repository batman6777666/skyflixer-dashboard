import RPMShareAPI from '../api/RPMShareAPI.js';
import StreamP2PAPI from '../api/StreamP2PAPI.js';
import SeekStreamingAPI from '../api/SeekStreamingAPI.js';
import UPnShareAPI from '../api/UPnShareAPI.js';

/**
 * Fetch files from all platforms in parallel
 * @param {Object} apiKeys - Object containing all API keys
 * @returns {Promise<Array>} - Array of unique files with platform information
 */
export async function fetchFilesFromAllPlatforms(apiKeys) {
    // Initialize API clients
    const rpmClient = new RPMShareAPI(apiKeys.rpmshare[0]);
    const streamClient = new StreamP2PAPI(apiKeys.streamp2p[0]);
    const seekClient = new SeekStreamingAPI(apiKeys.seekstreaming[0]);
    const upnClient = new UPnShareAPI(apiKeys.upnshare[0]);

    console.log('🔄 Fetching files from all platforms...');

    try {
        // Fetch from all platforms in parallel
        const [rpmFiles, streamFiles, seekFiles, upnFiles] = await Promise.allSettled([
            rpmClient.listFiles(),
            streamClient.listFiles(),
            seekClient.listFiles(),
            upnClient.listFiles()
        ]);

        // Extract successful results
        const rpmFilesData = rpmFiles.status === 'fulfilled' ? rpmFiles.value : [];
        const streamFilesData = streamFiles.status === 'fulfilled' ? streamFiles.value : [];
        const seekFilesData = seekFiles.status === 'fulfilled' ? seekFiles.value : [];
        const upnFilesData = upnFiles.status === 'fulfilled' ? upnFiles.value : [];

        console.log(`📊 Fetched: RPMShare=${rpmFilesData.length}, StreamP2P=${streamFilesData.length}, SeekStreaming=${seekFilesData.length}, UPnShare=${upnFilesData.length}`);

        // 🚫 FILTER OUT FILES ENDING WITH "SKYFLIX"
        // User requirement: Do not fetch files whose name ends with "SKYFLIX"
        const filterSkyflix = (files) => {
            return files.filter(file => {
                const name = file.name || '';
                const endsWithSkyflix = name.trim().toLowerCase().endsWith('skyflix');
                if (endsWithSkyflix) {
                    console.log(`🚫 Filtered out SKYFLIX file: ${name}`);
                }
                return !endsWithSkyflix;
            });
        };

        const rpmFiltered = filterSkyflix(rpmFilesData);
        const streamFiltered = filterSkyflix(streamFilesData);
        const seekFiltered = filterSkyflix(seekFilesData);
        const upnFiltered = filterSkyflix(upnFilesData);

        console.log(`✅ After SKYFLIX filter: RPMShare=${rpmFiltered.length}, StreamP2P=${streamFiltered.length}, SeekStreaming=${seekFiltered.length}, UPnShare=${upnFiltered.length}`);

        // Match files across platforms
        const matchedFiles = matchFilesAcrossPlatforms(rpmFiltered, streamFiltered, seekFiltered, upnFiltered);

        console.log(`✅ Total unique files: ${matchedFiles.length}`);

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

    // Remove quality indicators, "SKYFLIX", and metadata
    const removePatterns = [
        /\s*SKYFLIX\s*/gi,
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
 * CRITICAL: Filters out files containing "SKYFLIX" in filename
 * @param {Array} rpmFiles - Files from RPMShare
 * @param {Array} streamFiles - Files from StreamP2P
 * @param {Array} seekFiles - Files from SeekStreaming
 * @param {Array} upnFiles - Files from UPnShare
 * @returns {Array} - Unique files with platform information
 */
function matchFilesAcrossPlatforms(rpmFiles, streamFiles, seekFiles, upnFiles) {
    const fileMap = new Map();

    // Process all platforms
    const allPlatformFiles = [
        { files: rpmFiles, platform: 'rpmshare' },
        { files: streamFiles, platform: 'streamp2p' },
        { files: seekFiles, platform: 'seekstreaming' },
        { files: upnFiles, platform: 'upnshare' }
    ];

    allPlatformFiles.forEach(({ files, platform }) => {
        files.forEach(file => {
            // 🎯 SMART FILENAME NORMALIZATION
            // Different platforms use different formats:
            // UPN: "It.Welcome.To.Derry.S01E01.1080P.Hindi.English.Msubs.MoviesMod.plus.mkv"
            // RPM: "It: Welcome to Derry S01E01 The Pilot SKYFLIX"
            // We extract: show name + episode number to create a normalized key

            const originalName = file.name;
            let normalizedKey = normalizeFilename(originalName);

            // Add or update file in map using normalized key
            if (!fileMap.has(normalizedKey)) {
                fileMap.set(normalizedKey, {
                    filename: originalName, // Use original name for display
                    platforms: [],
                    created_at: file.created_at,
                    size: file.size
                });
            }

            // Add platform information
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
