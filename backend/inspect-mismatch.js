import dotenv from 'dotenv';
import RPMShareAPI from './api/RPMShareAPI.js';
import StreamP2PAPI from './api/StreamP2PAPI.js';
import SeekStreamingAPI from './api/SeekStreamingAPI.js';
import UPnShareAPI from './api/UPnShareAPI.js';
import fs from 'fs';

if (fs.existsSync('.env')) dotenv.config();

async function inspectMismatch() {
    console.log('\n🔍 INSPECTING MISMATCH - RAW DUMP\n');

    // Initialize clients
    // We'll just fetch from UPN and RPM to compare, since UPN is the odd one out
    const rpm = new RPMShareAPI(process.env.RPMSHARE_API_KEY_1);
    const upn = new UPnShareAPI(process.env.UPNSHARE_API_KEY_1);

    try {
        const [rFiles, uFiles] = await Promise.all([
            rpm.listFiles(1, 20),
            upn.listFiles(1, 20)
        ]);

        console.log(`RPM Files: ${rFiles.length}`);
        console.log(`UPN Files: ${uFiles.length}`);

        // Sort for easier visual comparison
        rFiles.sort((a, b) => a.name.localeCompare(b.name));
        uFiles.sort((a, b) => a.name.localeCompare(b.name));

        console.log('\n--- UPN FILES (The ones separating) ---');
        uFiles.forEach(f => console.log(`"${f.name}"`));

        console.log('\n--- RPM FILES (The ones grouping) ---');
        rFiles.forEach(f => console.log(`"${f.name}"`));

        // Let's pick one that looks "same" and compare
        // Assuming user has "It.Welcome.To.Derry..."
        const upnTarget = uFiles.find(f => f.name.includes('Derry') && f.name.includes('E01'));
        const rpmTarget = rFiles.find(f => f.name.includes('Derry') && f.name.includes('E01'));

        if (upnTarget && rpmTarget) {
            console.log('\n--- DIRECT COMPARISON ---');
            console.log(`UPN: "${upnTarget.name}"`);
            console.log(`RPM: "${rpmTarget.name}"`);

            console.log('\nComparing characters:');
            const maxLen = Math.max(upnTarget.name.length, rpmTarget.name.length);
            for (let i = 0; i < maxLen; i++) {
                const uChar = upnTarget.name[i] || '';
                const rChar = rpmTarget.name[i] || '';
                const uCode = upnTarget.name.charCodeAt(i) || 0;
                const rCode = rpmTarget.name.charCodeAt(i) || 0;

                if (uChar !== rChar) {
                    console.log(`Mismatch at ${i}: '${uChar}'(${uCode}) vs '${rChar}'(${rCode})`);
                }
            }
        } else {
            console.log('\nCould not find matching pair for comparison.');
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

inspectMismatch();
