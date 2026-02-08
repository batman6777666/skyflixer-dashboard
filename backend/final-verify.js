import axios from 'axios';
import dotenv from 'dotenv';
import fs from 'fs';

if (fs.existsSync('.env')) dotenv.config();

const apis = [
    {
        name: 'RPMShare',
        url: 'https://rpmshare.com/api/v1/file/list',
        key: process.env.RPMSHARE_API_KEY_1
    },
    {
        name: 'StreamP2P',
        url: 'https://streamp2p.com/api/v1/file/list',
        key: process.env.STREAMP2P_API_KEY_1
    },
    {
        name: 'SeekStreaming',
        url: 'https://seekstreaming.com/api/v1/file/list',
        key: process.env.SEEKSTREAMING_API_KEY_1
    }
];

async function verifyAll() {
    console.log('🚀 Final Verification of All APIs...');

    for (const api of apis) {
        console.log(`\n🔍 Testing ${api.name} (${api.url})...`);
        try {
            const response = await axios.get(api.url, {
                headers: { 'api-token': api.key },
                params: { page: 1, per_page: 1 },
                timeout: 10000,
                validateStatus: () => true
            });

            console.log(`   Status: ${response.status}`);
            if (response.status === 200) {
                console.log('   ✅ CONNECTED');
                if (api.name === 'RPMShare') {
                    // Log structure to check for ID
                    const files = response.data?.data?.files || [];
                    if (files.length > 0) {
                        console.log('   📂 JSON Structure Example:', JSON.stringify(files[0], null, 2));
                    } else {
                        console.log('   📂 No files found, but API works.');
                    }
                }
            } else {
                console.log(`   ❌ returned ${response.status} (${response.statusText})`);
            }

        } catch (error) {
            console.error(`   💥 FAILED: ${error.message}`);
            if (error.code) console.error(`      Code: ${error.code}`);
        }
    }
}

verifyAll();
