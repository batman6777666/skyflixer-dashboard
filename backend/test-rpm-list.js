import axios from 'axios';
import dotenv from 'dotenv';
import fs from 'fs';

if (fs.existsSync('.env')) dotenv.config();

const apiKey = process.env.RPMSHARE_API_KEY_1;
const baseUrl = 'https://rpmshare.com/api/v1';

async function testList() {
    const endpoints = [
        '/video/list',
        '/video/manage',
        '/file/list',
        '/videos'
    ];

    for (const endpoint of endpoints) {
        try {
            const response = await axios.get(`${baseUrl}${endpoint}`, {
                headers: { 'api-token': apiKey },
                params: { page: 1, per_page: 5 },
                validateStatus: () => true
            });

            if (response.status === 200) {
                console.log(`\n✅ SUCCESS on: ${endpoint}`);
                console.log('📦 Data Sample:', JSON.stringify(response.data, null, 2).substring(0, 300));
                break; // Stop after first success to avoid confusion
            } else {
                // console.log(`❌ Failed on: ${endpoint} -> ${response.status}`);
            }

        } catch (error) {
            // console.log(`💥 &Error on: ${endpoint} -> ${error.message}`);
        }
    }
}

testList();
