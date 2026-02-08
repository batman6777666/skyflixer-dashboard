import dotenv from 'dotenv';
import RPMShareAPI from './api/RPMShareAPI.js';
import StreamP2PAPI from './api/StreamP2PAPI.js';
import SeekStreamingAPI from './api/SeekStreamingAPI.js';
import fs from 'fs';

if (fs.existsSync('.env')) dotenv.config();

async function verifyAllPlatforms() {
    console.log('🚀 VERIFYING ALL 3 PLATFORMS\n');
    console.log('='.repeat(60));

    // Test RPMShare
    try {
        console.log('\n📦 1. RPMShare');
        const rpm = new RPMShareAPI(process.env.RPMSHARE_API_KEY_1);
        const rpmFiles = await rpm.listFiles(1, 5);
        console.log(`   ✅ Connected! Found ${rpmFiles.length} files`);
        rpmFiles.slice(0, 3).forEach((f, i) => {
            console.log(`      ${i + 1}. ${f.name || f.title}`);
        });
    } catch (error) {
        console.log(`   ❌ Failed: ${error.message}`);
    }

    // Test StreamP2P
    try {
        console.log('\n📦 2. StreamP2P');
        const p2p = new StreamP2PAPI(process.env.STREAMP2P_API_KEY_1);
        const p2pFiles = await p2p.listFiles(1, 5);
        console.log(`   ✅ Connected! Found ${p2pFiles.length} files`);
        p2pFiles.slice(0, 3).forEach((f, i) => {
            console.log(`      ${i + 1}. ${f.name || f.title}`);
        });
    } catch (error) {
        console.log(`   ❌ Failed: ${error.message}`);
    }

    // Test SeekStreaming
    try {
        console.log('\n📦 3. SeekStreaming');
        const seek = new SeekStreamingAPI(process.env.SEEKSTREAMING_API_KEY_1);
        const seekFiles = await seek.listFiles(1, 5);
        console.log(`   ✅ Connected! Found ${seekFiles.length} files`);
        seekFiles.slice(0, 3).forEach((f, i) => {
            console.log(`      ${i + 1}. ${f.name || f.title}`);
        });
    } catch (error) {
        console.log(`   ❌ Failed: ${error.message}`);
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ VERIFICATION COMPLETE\n');
}

verifyAllPlatforms();
