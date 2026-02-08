import dotenv from 'dotenv';
import RPMShareAPI from './api/RPMShareAPI.js';
import StreamP2PAPI from './api/StreamP2PAPI.js';
import SeekStreamingAPI from './api/SeekStreamingAPI.js';
import UPnShareAPI from './api/UPnShareAPI.js';
import fs from 'fs';

if (fs.existsSync('.env')) dotenv.config();

async function deepInspect() {
    console.log('\n🔬 DEEP FILENAME INSPECTION\n');

    // Initialize clients
    const rpm = new RPMShareAPI(process.env.RPMSHARE_API_KEY_1);
    const p2p = new StreamP2PAPI(process.env.STREAMP2P_API_KEY_1);
    const seek = new SeekStreamingAPI(process.env.SEEKSTREAMING_API_KEY_1);
    const upn = new UPnShareAPI(process.env.UPNSHARE_API_KEY_1);

    try {
        // Fetch raw files (just first page)
        const [rFiles, pFiles, sFiles, uFiles] = await Promise.all([
            rpm.listFiles(1, 10),
            p2p.listFiles(1, 10),
            seek.listFiles(1, 10),
            upn.listFiles(1, 10)
        ]);

        console.log(`Fetched counts: RPM=${rFiles.length}, P2P=${pFiles.length}, SEEK=${sFiles.length}, UPN=${uFiles.length}`);

        // Let's take the first file from UPnShare and attempt to find it in others
        if (uFiles.length > 0) {
            const target = uFiles[0];
            console.log(`\n🎯 TARGET FILE (from UPnShare):`);
            console.log(`   Name: "${target.name}"`);
            console.log(`   Length: ${target.name.length}`);
            console.log(`   Char codes: ${getCharCodes(target.name)}`);

            // Search in RPM
            findMatch('RPMShare', rFiles, target.name);
            // Search in P2P
            findMatch('StreamP2P', pFiles, target.name);
            // Search in SEEK
            findMatch('SeekStreaming', sFiles, target.name);
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

function findMatch(platformName, files, targetName) {
    console.log(`\n🔎 Searching in ${platformName}...`);

    // Exact match
    const exact = files.find(f => f.name === targetName);
    if (exact) {
        console.log(`   ✅ EXACT MATCH FOUND!`);
        return;
    }

    console.log(`   ❌ No exact match.`);

    // Find closest match (contains or starts with)
    // We'll normalize both to lowercase and check
    const similar = files.find(f => f.name.toLowerCase() === targetName.toLowerCase());
    if (similar) {
        console.log(`   ⚠️  Case-insensitive match found:`);
        console.log(`      Found: "${similar.name}"`);
        console.log(`      Diff: Case mismatch`);
        return;
    }

    // Trimmed match
    const trimmed = files.find(f => f.name.trim() === targetName.trim());
    if (trimmed) {
        console.log(`   ⚠️  Trimmed match found:`);
        console.log(`      Found: "${trimmed.name}"`);
        console.log(`      Diff: Whitespace mismatch`);
        return;
    }

    // Check for "almost" matches (e.g. one char diff)
    // Let's just print the first file from this platform to compare manually
    if (files.length > 0) {
        const candidate = files[0];
        console.log(`   Closest candidate (first file):`);
        console.log(`      Name: "${candidate.name}"`);
        console.log(`      Length: ${candidate.name.length}`);
        console.log(`      Char codes: ${getCharCodes(candidate.name)}`);

        if (candidate.name === targetName) {
            console.log(`      WAIT: Javascript says they are equal.`);
        } else {
            console.log(`      JS says they are DIFFERENT.`);
            // Compare chars
            for (let i = 0; i < Math.max(candidate.name.length, targetName.length); i++) {
                const c1 = candidate.name.charCodeAt(i);
                const c2 = targetName.charCodeAt(i);
                if (c1 !== c2) {
                    console.log(`      mismatch at index ${i}: ${c1} vs ${c2} ('${String.fromCharCode(c1)}' vs '${String.fromCharCode(c2)}')`);
                    break;
                }
            }
        }
    }
}

function getCharCodes(str) {
    const codes = [];
    for (let i = 0; i < str.length; i++) codes.push(str.charCodeAt(i));
    return codes.join(' ');
}

deepInspect();
