import axios from 'axios';
import dotenv from 'dotenv';
import fs from 'fs';

if (fs.existsSync('.env')) dotenv.config();

const apiKey = process.env.STREAMP2P_API_KEY_1;
// Try both .com and .xyz as per previous discussions, and maybe others.
// User didn't specify domain in this prompt, but previous prompt had streamp2p.xyz in code?
// Wait, my `StreamP2PAPI.js` has `.xyz`? Or `.com`?
// I will scan DOMAINS too.

const domains = [
    'https://streamp2p.com/api/v1',
    'https://streamp2p.xyz/api/v1',
    'https://streamp2p.net/api/v1'
];

const endpoints = [
    '/video/manage',
    '/file/list',
    '/video/list'
];

async function testStreamP2P() {
    console.log(`Testing StreamP2P with Key: ${apiKey.substring(0, 5)}...`);

    for (const domain of domains) {
        for (const endpoint of endpoints) {
            const url = `${domain}${endpoint}`;
            // console.log(`Trying ${url}...`);
            try {
                const response = await axios.get(url, {
                    headers: { 'api-token': apiKey },
                    params: { page: 1, per_page: 5 },
                    timeout: 5000,
                    validateStatus: () => true
                });

                if (response.status === 200) {
                    console.log(`\n✅ SUCCESS: ${url}`);
                    console.log('📦 Data:', JSON.stringify(response.data, null, 2).substring(0, 300));
                    return; // Found it!
                } else if (response.status !== 404 && response.status !== 502) {
                    console.log(`⚠️ ${url} -> ${response.status} (${response.statusText})`);
                }
            } catch (error) {
                // console.log(`❌ ${url} -> ${error.message}`);
            }
        }
    }
    console.log('❌ StreamP2P Scan Finished (No Success)');
}

testStreamP2P();
