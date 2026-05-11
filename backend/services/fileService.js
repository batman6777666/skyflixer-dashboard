import VidPlayAPI from '../api/VidPlayAPI.js';
import StreamP2PAPI from '../api/StreamP2PAPI.js';
import SeekStreamingAPI from '../api/SeekStreamingAPI.js';
import UPnShareAPI from '../api/UPnShareAPI.js';

/**
 * Fetch ALL files from all platforms using deep scan (all pages)
 * @param {Object} apiKeys - Object containing all API keys
 * @param {Function} onProgress - Optional callback({ platform, pagesCompleted, totalPages })
 * @returns {Promise<Array>} - Array of unique files with platform information
 */
export async function fetchFilesFromAllPlatforms(apiKeys, onProgress) {
    // Use first key per platform for fetching (all keys access same account data)
    const vidplayClient = new VidPlayAPI(apiKeys.vidplay[0]);
    const streamClient = new StreamP2PAPI(apiKeys.streamp2p[0]);
    const seekClient = new SeekStreamingAPI(apiKeys.seekstreaming[0]);
    const upnClient = new UPnShareAPI(apiKeys.upnshare[0]);

    console.log('\n🔍 DEEP SCAN: Fetching ALL files from ALL pages on all platforms...\n');

    // Track progress per platform
    const progress = {
        vidplay: { pagesCompleted: 0, totalPages: 1 },
        streamp2p: { pagesCompleted: 0, totalPages: 1 },
        seekstreaming: { pagesCompleted: 0, totalPages: 1 },
        upnshare: { pagesCompleted: 0, totalPages: 1 }
    };

    const emitProgress = (platform, data) => {
        progress[platform] = data;
        if (onProgress) {
            // Calculate overall percentage
            const totalPages = Object.values(progress).reduce((s, p) => s + p.totalPages, 0);
            const completedPages = Object.values(progress).reduce((s, p) => s + p.pagesCompleted, 0);
            const overallPercent = totalPages > 0 ? Math.round((completedPages / totalPages) * 100) : 0;
            onProgress({ platform, ...data, overallPercent, allProgress: { ...progress } });
        }
    };

    try {
        // Deep scan all 4 platforms in parallel — each fetches every page
        const [vidplayFiles, streamFiles, seekFiles, upnFiles] = await Promise.allSettled([
            vidplayClient.listAllFiles((p) => emitProgress('vidplay', p)),
            streamClient.listAllFiles((p) => emitProgress('streamp2p', p)),
            seekClient.listAllFiles((p) => emitProgress('seekstreaming', p)),
            upnClient.listAllFiles((p) => emitProgress('upnshare', p))
        ]);

        // Extract successful results
        const vidplayFilesData = vidplayFiles.status === 'fulfilled' ? vidplayFiles.value : [];
        const streamFilesData = streamFiles.status === 'fulfilled' ? streamFiles.value : [];
        const seekFilesData = seekFiles.status === 'fulfilled' ? seekFiles.value : [];
        const upnFilesData = upnFiles.status === 'fulfilled' ? upnFiles.value : [];

        console.log(`\n📊 Deep scan complete:`);
        console.log(`   VidPlay     = ${vidplayFilesData.length} files`);
        console.log(`   StreamP2P   = ${streamFilesData.length} files`);
        console.log(`   SeekStreaming = ${seekFilesData.length} files`);
        console.log(`   UPnShare    = ${upnFilesData.length} files`);
        console.log(`   TOTAL       = ${vidplayFilesData.length + streamFilesData.length + seekFilesData.length + upnFilesData.length} files\n`);

        // Match files across platforms using smart normalization
        const matchedFiles = matchFilesAcrossPlatforms(vidplayFilesData, streamFilesData, seekFilesData, upnFilesData);

        console.log(`✅ Total unique groups: ${matchedFiles.length}`);

        return matchedFiles;
    } catch (error) {
        console.error('❌ Error fetching files:', error.message);
        throw error;
    }
}

/**
 * canonicalKey — Same logic as duplicateService so fetch + duplicate + missing all agree.
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
function matchFilesAcrossPlatforms(vidplayFiles, streamFiles, seekFiles, upnFiles) {
    const fileMap = new Map();

    const allPlatformFiles = [
        { files: vidplayFiles, platform: 'vidplay' },
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

            // Prefer SKYFLIXER-named file as display name
            if (originalName.toLowerCase().includes('skyflixer')) {
                entry.filename = originalName;
            }

            // Avoid adding the same platform twice
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
