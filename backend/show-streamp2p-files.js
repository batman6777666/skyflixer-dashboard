import dotenv from 'dotenv';
import StreamP2PAPI from './api/StreamP2PAPI.js';
import fs from 'fs';

// Load env
if (fs.existsSync('.env')) dotenv.config();

async function showFiles() {
    console.log('🚀 Fetching StreamP2P Files using App Code...');

    try {
        const apiKey = process.env.STREAMP2P_API_KEY_1;
        if (!apiKey) throw new Error('API Key not found in .env');

        const api = new StreamP2PAPI(apiKey);
        const files = await api.listFiles(1, 10);

        console.log(`\n✅ Successfully fetched ${files.length} files from StreamP2P!`);

        if (files.length > 0) {
            console.log('\n📄 File List:');
            files.forEach((f, i) => {
                console.log(`   ${i + 1}. [${f.fileId}] ${f.name || f.title || f.filename}`);
            });
        } else {
            console.log('   (No files found in account)');
        }

    } catch (error) {
        console.error('❌ Failed:', error.message);
    }
}

showFiles();
