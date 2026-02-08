import dotenv from 'dotenv';
import UPnShareAPI from './api/UPnShareAPI.js';
import fs from 'fs';

if (fs.existsSync('.env')) dotenv.config();

async function showUPnShareFiles() {
    console.log('═══════════════════════════════════════════════════════');
    console.log('           📦 UPnShare Platform - File List            ');
    console.log('═══════════════════════════════════════════════════════\n');

    try {
        const apiKey = process.env.UPNSHARE_API_KEY_1;
        const api = new UPnShareAPI(apiKey);

        console.log('🔄 Fetching files from UPnShare...\n');
        const files = await api.listFiles(1, 20);

        console.log(`✅ SUCCESS! Connected to UPnShare`);
        console.log(`📊 Total Files Found: ${files.length}\n`);

        if (files.length > 0) {
            console.log('📄 File List:\n');
            files.forEach((file, i) => {
                const name = file.name || file.title || 'Unnamed';
                const id = file.id || file.fileId || 'N/A';
                console.log(`   ${String(i + 1).padStart(2, ' ')}. ${name}`);
                console.log(`       └─ ID: ${id}\n`);
            });
        } else {
            console.log('   (No files in account)\n');
        }

        console.log('═══════════════════════════════════════════════════════');
        console.log('✅ UPnShare Integration: WORKING PERFECTLY!');
        console.log('═══════════════════════════════════════════════════════\n');

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

showUPnShareFiles();
