import dotenv from 'dotenv';
import RPMShareAPI from './api/RPMShareAPI.js';
import StreamP2PAPI from './api/StreamP2PAPI.js';
import SeekStreamingAPI from './api/SeekStreamingAPI.js';
import UPnShareAPI from './api/UPnShareAPI.js';
import fs from 'fs';

if (fs.existsSync('.env')) dotenv.config();

async function testAllPlatforms() {
    console.log('🚀 TESTING ALL 4 PLATFORMS\n');
    console.log('='.repeat(70));

    const platforms = [
        { name: 'RPMShare', client: new RPMShareAPI(process.env.RPMSHARE_API_KEY_1) },
        { name: 'StreamP2P', client: new StreamP2PAPI(process.env.STREAMP2P_API_KEY_1) },
        { name: 'SeekStreaming', client: new SeekStreamingAPI(process.env.SEEKSTREAMING_API_KEY_1) },
        { name: 'UPnShare', client: new UPnShareAPI(process.env.UPNSHARE_API_KEY_1) }
    ];

    for (const platform of platforms) {
        try {
            console.log(`\n📦 ${platform.name}`);
            const files = await platform.client.listFiles(1, 8);
            console.log(`   ✅ Connected! Found ${files.length} files`);

            if (files.length > 0) {
                console.log('\n   📄 File List:');
                files.forEach((f, i) => {
                    const displayName = f.name || f.title || f.filename || 'Unnamed';
                    console.log(`      ${i + 1}. ${displayName}`);
                });
            }
        } catch (error) {
            console.log(`   ❌ Failed: ${error.message}`);
        }
    }

    console.log('\n' + '='.repeat(70));
    console.log('✅ VERIFICATION COMPLETE - ALL 4 PLATFORMS TESTED\n');
}

testAllPlatforms();
