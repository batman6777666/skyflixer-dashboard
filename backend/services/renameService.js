import RPMShareAPI from '../api/RPMShareAPI.js';
import StreamP2PAPI from '../api/StreamP2PAPI.js';
import SeekStreamingAPI from '../api/SeekStreamingAPI.js';
import UPnShareAPI from '../api/UPnShareAPI.js';
import { trackRename } from './sessionStats.js';

/**
 * Process batch rename with delays and API key rotation
 * @param {Array} files - Array of files to rename
 * @param {Array} newNames - Array of new filenames
 * @param {Object} apiKeys - All API keys
 * @param {Function} progressCallback - Callback for progress updates
 * @returns {Promise<Object>} - Rename results
 */
export async function processBatchRename(files, newNames, apiKeys, progressCallback) {
    const BATCH_SIZE = 20;
    const BATCH_DELAY = 2000; // 2 seconds

    const results = {
        total: files.length,
        successful: 0,
        failed: 0,
        details: []
    };

    // Split files into batches
    const batches = [];
    for (let i = 0; i < files.length; i += BATCH_SIZE) {
        batches.push({
            files: files.slice(i, i + BATCH_SIZE),
            names: newNames.slice(i, i + BATCH_SIZE),
            batchNumber: Math.floor(i / BATCH_SIZE) + 1
        });
    }

    console.log(`📦 Processing ${batches.length} batches (${BATCH_SIZE} files each)`);

    // Process each batch
    for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        const useKeySet = i % 2; // Alternate between key set 0 and 1

        console.log(`\n🔄 Processing batch ${batch.batchNumber}/${batches.length} with API key set ${useKeySet + 1}`);

        // Initialize API clients with rotated keys
        const rpmClient = new RPMShareAPI(apiKeys.rpmshare[useKeySet]);
        const streamClient = new StreamP2PAPI(apiKeys.streamp2p[useKeySet]);
        const seekClient = new SeekStreamingAPI(apiKeys.seekstreaming[useKeySet]);
        const upnClient = new UPnShareAPI(apiKeys.upnshare[useKeySet]);

        // Process files in current batch
        for (let j = 0; j < batch.files.length; j++) {
            const file = batch.files[j];
            const newName = batch.names[j];
            const fileIndex = i * BATCH_SIZE + j;

            console.log(`  📝 Renaming: "${file.filename}" → "${newName}"`);

            // Send progress update
            if (progressCallback) {
                progressCallback({
                    currentFile: fileIndex + 1,
                    totalFiles: files.length,
                    currentBatch: batch.batchNumber,
                    totalBatches: batches.length,
                    filename: file.filename
                });
            }

            // Rename on all platforms that have this file
            const renamePromises = file.platforms.map(platformInfo => {
                switch (platformInfo.platform) {
                    case 'rpmshare':
                        return rpmClient.renameFile(platformInfo.fileId, newName);
                    case 'streamp2p':
                        return streamClient.renameFile(platformInfo.fileId, newName);
                    case 'seekstreaming':
                        return seekClient.renameFile(platformInfo.fileId, newName);
                    case 'upnshare':
                        return upnClient.renameFile(platformInfo.fileId, newName);
                    default:
                        return Promise.resolve({ success: false, error: 'Unknown platform' });
                }
            });

            try {
                const renameResults = await Promise.all(renamePromises);

                const allSuccessful = renameResults.every(r => r.success);
                const platformNames = file.platforms.map(p => p.platform);

                if (allSuccessful) {
                    results.successful++;
                    console.log(`  ✅ Success on platforms: ${platformNames.join(', ')}`);
                } else {
                    results.failed++;
                    console.log(`  ❌ Failed on some platforms`);
                }

                results.details.push({
                    original: file.filename,
                    renamed: newName,
                    platforms: platformNames,
                    status: allSuccessful ? 'success' : 'partial',
                    results: renameResults
                });

                // Track in database
                await trackRename(file.filename, newName, platformNames, allSuccessful ? 'success' : 'failed');

            } catch (error) {
                results.failed++;
                console.log(`  ❌ Error: ${error.message}`);

                results.details.push({
                    original: file.filename,
                    renamed: newName,
                    platforms: file.platforms.map(p => p.platform),
                    status: 'failed',
                    error: error.message
                });

                await trackRename(file.filename, newName, [], 'failed', error.message);
            }
        }

        // Add delay between batches (except after last batch)
        if (i < batches.length - 1) {
            console.log(`⏳ Waiting ${BATCH_DELAY / 1000} seconds before next batch...`);
            await new Promise(resolve => setTimeout(resolve, BATCH_DELAY));
        }
    }

    console.log(`\n✅ Batch processing complete: ${results.successful} successful, ${results.failed} failed`);

    return results;
}
