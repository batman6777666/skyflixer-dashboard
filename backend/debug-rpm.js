import axios from 'axios';
import dotenv from 'dotenv';
import fs from 'fs';

if (fs.existsSync('.env')) dotenv.config();

async function debugRPM() {
    console.log('🔍 Debugging RPMShare Response Structure...');
    const apiKey = process.env.RPMSHARE_API_KEY_1;

    try {
        const response = await axios.get('https://rpmshare.com/api/v1/file/list', {
            headers: { 'api-token': apiKey },
            params: { page: 1, per_page: 5 }
        });

        console.log('Code:', response.status);
        console.log('--- RAW RESPONSE DATA START ---');
        console.log(JSON.stringify(response.data, null, 2));
        console.log('--- RAW RESPONSE DATA END ---');

        if (response.data.data && response.data.data.files) {
            console.log('✅ Structure response.data.data.files match!');
        } else if (response.data.files) {
            console.log('⚠️ Structure is response.data.files (Incorrectly mapped in code?)');
        } else if (response.data.result && response.data.result.files) {
            console.log('⚠️ Structure is response.data.result.files (Incorrectly mapped in code?)');
        } else {
            console.log('❌ Structure UNKNOWN');
        }

    } catch (error) {
        console.log('💥 Error:', error.message);
    }
}

debugRPM();
