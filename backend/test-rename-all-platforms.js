import dotenv from 'dotenv';
import RPMShareAPI from './api/RPMShareAPI.js';
import StreamP2PAPI from './api/StreamP2PAPI.js';
import SeekStreamingAPI from './api/SeekStreamingAPI.js';
import UPnShareAPI from './api/UPnShareAPI.js';
import fs from 'fs';

if (fs.existsSync('.env')) dotenv.config();

async function testRename() {
    console.log('🧪 TESTING RENAME FUNCTIONALITY\n');
    console.log('='.repeat(70));

    const platforms = [
        {
            name: 'RPMShare',
            client: new RPMShareAPI(process.env.RPMSHARE_API_KEY_1),
            testFileId: null // Will need actual file ID from list
        },
        {
            name: 'StreamP2P',
            client: new StreamP2PAPI(process.env.STREAMP2P_API_KEY_1),
            testFileId: null
        },
        {
            name: 'SeekStreaming',
            client: new SeekStreamingAPI(process.env.SEEKSTREAMING_API_KEY_1),
            testFileId: null
        },
        {
            name: 'UPnShare',
            client: new UPnShareAPI(process.env.UPNSHARE_API_KEY_1),
            testFileId: null
        }
    ];

    for (const platform of platforms) {
        try {
            console.log(`\n📦 ${platform.name} - Testing Rename API`);

            // First, get list of files to find a test file ID
            const files = await platform.client.listFiles(1, 1);

            if (files.length === 0) {
                console.log(`   ⚠️  No files found - cannot test rename`);
                continue;
            }

            const testFile = files[0];
            const fileId = testFile.id || testFile.fileId;
            const originalName = testFile.name || testFile.title;

            console.log(`   📄 Test File: "${originalName}"`);
            console.log(`   🆔 File ID: ${fileId}`);

            // Test rename (using same name to avoid actual changes)
            console.log(`   🔄 Testing rename API call...`);
            const result = await platform.client.renameFile(fileId, originalName);

            if (result.success) {
                console.log(`   ✅ Rename API Working!`);
            } else {
                console.log(`   ❌ Rename API Failed: ${result.error}`);
            }

        } catch (error) {
            console.log(`   ❌ Error: ${error.message}`);
        }
    }

    console.log('\n' + '='.repeat(70));
    console.log('✅ RENAME FUNCTIONALITY TEST COMPLETE\n');
}

testRename();
