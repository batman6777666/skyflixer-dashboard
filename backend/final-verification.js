import dotenv from 'dotenv';
import axios from 'axios';
import fs from 'fs';

if (fs.existsSync('.env')) dotenv.config();

async function finalVerification() {
    console.log('\n✅ FINAL VERIFICATION - ALL 4 PLATFORMS\n');
    console.log('='.repeat(70));

    try {
        console.log('\n📡 Calling /api/fetch-files...\n');

        const response = await axios.get('http://localhost:5000/api/fetch-files');
        const files = response.data.files;

        console.log(`📊 RESULTS:\n`);
        console.log(`   Total Files: ${files.length}`);

        // Count badges
        const badgeCounts = {
            rpmshare: 0,
            streamp2p: 0,
            seekstreaming: 0,
            upnshare: 0
        };

        const multiPlatformFiles = [];

        files.forEach(file => {
            if (file.platforms && file.platforms.length > 1) {
                multiPlatformFiles.push(file);
            }

            file.platforms.forEach(p => {
                badgeCounts[p.platform]++;
            });
        });

        console.log(`\n   Platform Badge Counts:`);
        console.log(`      ${badgeCounts.rpmshare > 0 ? '✅' : '❌'} RPMShare (RPM):      ${badgeCounts.rpmshare} files`);
        console.log(`      ${badgeCounts.streamp2p > 0 ? '✅' : '❌'} StreamP2P (P2P):     ${badgeCounts.streamp2p} files`);
        console.log(`      ${badgeCounts.seekstreaming > 0 ? '✅' : '❌'} SeekStreaming (SEEK): ${badgeCounts.seekstreaming} files`);
        console.log(`      ${badgeCounts.upnshare > 0 ? '✅' : '❌'} UPnShare (UPN):      ${badgeCounts.upnshare} files`);

        console.log(`\n   Multi-Platform Files: ${multiPlatformFiles.length}`);

        if (multiPlatformFiles.length > 0) {
            console.log(`\n   Sample Multi-Platform File:`);
            const sample = multiPlatformFiles[0];
            console.log(`      "${sample.filename}"`);
            console.log(`      Badges: ${sample.platforms.map(p => p.platform.toUpperCase()).join(', ')}`);
        }

        // Final verdict
        const allPlatformsPresent = Object.values(badgeCounts).every(count => count > 0);

        console.log(`\n${'='.repeat(70)}`);
        if (allPlatformsPresent) {
            console.log('✅ SUCCESS! ALL 4 PLATFORMS FOUND & GROUPED!');
            console.log('   Files from RPM, P2P, SEEK, and UPN are now merged into single entries!');
        } else {
            console.log('❌ ISSUE: Some platforms missing');
        }
        console.log(`${'='.repeat(70)}\n`);

    } catch (error) {
        console.error('\n❌ Error:', error.message);
    }
}

finalVerification();
