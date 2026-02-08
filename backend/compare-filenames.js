import dotenv from 'dotenv';
import { fetchFilesFromAllPlatforms } from './services/fileService.js';
import fs from 'fs';

if (fs.existsSync('.env')) dotenv.config();

async function compareFilenames() {
    console.log('\n🔍 COMPARING FILENAMES ACROSS PLATFORMS\n');

    const apiKeys = {
        rpmshare: [process.env.RPMSHARE_API_KEY_1, process.env.RPMSHARE_API_KEY_2],
        streamp2p: [process.env.STREAMP2P_API_KEY_1, process.env.STREAMP2P_API_KEY_2],
        seekstreaming: [process.env.SEEKSTREAMING_API_KEY_1, process.env.SEEKSTREAMING_API_KEY_2],
        upnshare: [process.env.UPNSHARE_API_KEY_1, process.env.UPNSHARE_API_KEY_2]
    };

    try {
        // We need to bypass the grouping logic in fetchFilesFromAllPlatforms to see raw names
        // But fetchFilesFromAllPlatforms calls matchFilesAcrossPlatforms internally.
        // So we will instantiate clients directly and fetch raw lists.

        // Actually, let's just use the current service, but look at the "unique" files it produces.
        // If UPN is separate, we will see two entries that look similar.

        const files = await fetchFilesFromAllPlatforms(apiKeys);

        console.log(`Total grouped files: ${files.length}\n`);

        // Sort by name to put similar names next to each other
        files.sort((a, b) => a.filename.localeCompare(b.filename));

        files.forEach((f, i) => {
            console.log(`[${i + 1}] "${f.filename}"`);
            console.log(`     Badges: ${f.platforms.map(p => p.platform).join(', ')}`);
            console.log(`     Name Length: ${f.filename.length}`);
            // Check character codes for invisible spaces
            const codes = [];
            for (let j = 0; j < f.filename.length; j++) codes.push(f.filename.charCodeAt(j));
            // console.log(`     Codes: ${codes.join(' ')}`); // too verbose, maybe just for first few
        });

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

compareFilenames();
