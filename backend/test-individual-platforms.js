import dotenv from 'dotenv';
import RPMShareAPI from './api/RPMShareAPI.js';
import StreamP2PAPI from './api/StreamP2PAPI.js';
import SeekStreamingAPI from './api/SeekStreamingAPI.js';
import UPnShareAPI from './api/UPnShareAPI.js';
import fs from 'fs';

if (fs.existsSync('.env')) dotenv.config();

async function testEachPlatform() {
    console.log('\n🔬 INDIVIDUAL PLATFORM API TESTING\n');
    console.log('='.repeat(70));

    const platforms = [
        { name: 'RPMShare', API: RPMShareAPI, key: process.env.RPMSHARE_API_KEY_1 },
        { name: 'StreamP2P', API: StreamP2PAPI, key: process.env.STREAMP2P_API_KEY_1 },
        { name: 'SeekStreaming', API: SeekStreamingAPI, key: process.env.SEEKSTREAMING_API_KEY_1 },
        { name: 'UPnShare', API: UPnShareAPI, key: process.env.UPNSHARE_API_KEY_1 }
    ];

    for (const platform of platforms) {
        try {
            console.log(`\n📦 ${platform.name}`);
            console.log(`   API Key: ${platform.key ? platform.key.substring(0, 8) + '...' : 'MISSING'}`);

            const client = new platform.API(platform.key);
            console.log(`   🔄 Calling listFiles()...`);

            const files = await client.listFiles(1, 10);

            console.log(`   ✅ Response: ${files.length} files`);

            if (files.length > 0) {
                console.log(`   📄 Sample file:`);
                const sample = files[0];
                console.log(`      Name: ${sample.name || sample.title || 'N/A'}`);
                console.log(`      ID: ${sample.id || sample.fileId || 'N/A'}`);
                console.log(`      Platform tag: ${sample.platform || 'N/A'}`);
            } else {
                console.log(`   ⚠️  Empty array returned!`);
            }

        } catch (error) {
            console.log(`   ❌ Error: ${error.message}`);
            if (error.response) {
                console.log(`      HTTP Status: ${error.response.status}`);
                console.log(`      Response: ${JSON.stringify(error.response.data).substring(0, 200)}`);
            }
        }
    }

    console.log('\n' + '='.repeat(70));
    console.log('✅ TESTING COMPLETE\n');
}

testEachPlatform();
