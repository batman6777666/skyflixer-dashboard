import dotenv from 'dotenv';
import { fetchFilesFromAllPlatforms } from './services/fileService.js';
import fs from 'fs';

if (fs.existsSync('.env')) dotenv.config();

async function debugPlatforms() {
    console.log('\n🔍 DEBUGGING PLATFORM BADGE ISSUE\n');
    console.log('='.repeat(70));

    const apiKeys = {
        rpmshare: [process.env.RPMSHARE_API_KEY_1, process.env.RPMSHARE_API_KEY_2],
        streamp2p: [process.env.STREAMP2P_API_KEY_1, process.env.STREAMP2P_API_KEY_2],
        seekstreaming: [process.env.SEEKSTREAMING_API_KEY_1, process.env.SEEKSTREAMING_API_KEY_2],
        upnshare: [process.env.UPNSHARE_API_KEY_1, process.env.UPNSHARE_API_KEY_2]
    };

    try {
        console.log('\n📡 Fetching files from all platforms...\n');
        const files = await fetchFilesFromAllPlatforms(apiKeys);

        console.log(`\n📊 Total Files Returned: ${files.length}\n`);

        if (files.length > 0) {
            console.log('🔎 DETAILED FILE INSPECTION:\n');

            // Show first 5 files with full platform details
            const samplesToShow = Math.min(5, files.length);

            for (let i = 0; i < samplesToShow; i++) {
                const file = files[i];
                console.log(`\n${i + 1}. "${file.filename}"`);
                console.log(`   Platforms (${file.platforms.length}):`);

                file.platforms.forEach(p => {
                    console.log(`      • ${p.platform.toUpperCase()} (ID: ${p.fileId})`);
                });
            }

            // Summary statistics
            console.log('\n' + '='.repeat(70));
            console.log('📈 PLATFORM STATISTICS:\n');

            const platformCount = {
                rpmshare: 0,
                streamp2p: 0,
                seekstreaming: 0,
                upnshare: 0
            };

            const filesPerPlatformCount = {
                1: 0,
                2: 0,
                3: 0,
                4: 0
            };

            files.forEach(file => {
                const numPlatforms = file.platforms.length;
                filesPerPlatformCount[numPlatforms] = (filesPerPlatformCount[numPlatforms] || 0) + 1;

                file.platforms.forEach(p => {
                    platformCount[p.platform]++;
                });
            });

            console.log('Platform Occurrences:');
            console.log(`   RPMShare:      ${platformCount.rpmshare} files`);
            console.log(`   StreamP2P:     ${platformCount.streamp2p} files`);
            console.log(`   SeekStreaming: ${platformCount.seekstreaming} files`);
            console.log(`   UPnShare:      ${platformCount.upnshare} files`);

            console.log('\nFiles by Platform Count:');
            console.log(`   On 1 platform:  ${filesPerPlatformCount[1] || 0} files`);
            console.log(`   On 2 platforms: ${filesPerPlatformCount[2] || 0} files`);
            console.log(`   On 3 platforms: ${filesPerPlatformCount[3] || 0} files`);
            console.log(`   On 4 platforms: ${filesPerPlatformCount[4] || 0} files`);

            // Check if there's a problem
            const allFilesHaveMultiplePlatforms = files.every(f => f.platforms && f.platforms.length > 0);

            if (allFilesHaveMultiplePlatforms) {
                console.log('\n✅ All files have platform information!');
            } else {
                console.log('\n❌ Some files are missing platform information!');
            }

        } else {
            console.log('❌ No files returned! Check API connections.');
        }

        console.log('\n' + '='.repeat(70));
        console.log('✅ DEBUG COMPLETE\n');

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        console.error(error.stack);
    }
}

debugPlatforms();
