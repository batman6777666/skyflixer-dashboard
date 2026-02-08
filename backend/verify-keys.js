import dotenv from 'dotenv';
import axios from 'axios';
import fs from 'fs';

// Load environment variables directly
if (fs.existsSync('.env')) {
    dotenv.config();
    console.log('✅ Loaded .env file');
} else {
    console.error('❌ .env file not found in current directory!');
    process.exit(1);
}

// Global error handlers
process.on('uncaughtException', (err) => {
    console.error('💥 Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
});

async function verifyRPMShare() {
    const apiKey = process.env.RPMSHARE_API_KEY_1;
    console.log(`\n🔍 Verifying RPMShare (Key: ${apiKey ? 'Present' : 'Missing'})...`);

    if (!apiKey) {
        console.log('❌ RPMShare API Key is missing');
        return;
    }

    try {
        console.log('   Sending request to https://rpmshare.com/api/v1/file/list...');
        const response = await axios.get('https://rpmshare.com/api/v1/file/list', {
            headers: { 'api-token': apiKey },
            params: { page: 1, per_page: 1 },
            timeout: 10000 // 10s timeout
        });

        if (response.status === 200) {
            console.log('✅ RPMShare Connection Successful');
            console.log(`   Response Message: ${response.data.msg}`);
        } else {
            console.log(`❌ RPMShare returned status ${response.status}`);
        }
    } catch (error) {
        console.log('❌ RPMShare Failed:');
        if (error.response) {
            console.log(`   Status: ${error.response.status}`);
            console.log(`   Data: ${JSON.stringify(error.response.data)}`);
        } else if (error.request) {
            console.log('   No response received (Network Error)');
            console.log(`   Error: ${error.message}`);
        } else {
            console.log(`   Error: ${error.message}`);
        }
    }
}

async function verifyStreamP2P() {
    const apiKey = process.env.STREAMP2P_API_KEY_1;
    console.log(`\n🔍 Verifying StreamP2P (Key: ${apiKey ? 'Present' : 'Missing'})...`);

    if (!apiKey) {
        console.log('❌ StreamP2P API Key is missing');
        return;
    }

    try {
        console.log('   Sending request to https://streamp2p.com/api/v1/file/list...');
        const response = await axios.get('https://streamp2p.com/api/v1/file/list', {
            headers: { 'api-token': apiKey },
            params: { page: 1, per_page: 1 },
            timeout: 10000
        });

        if (response.status === 200) {
            console.log('✅ StreamP2P Connection Successful');
            console.log(`   Response Message: ${response.data.msg}`);
        }
    } catch (error) {
        console.log('❌ StreamP2P Failed:');
        if (error.response) {
            console.log(`   Status: ${error.response.status}`);
            console.log(`   Data: ${JSON.stringify(error.response.data)}`);
        } else if (error.request) {
            console.log('   No response received (Network Error)');
            console.log(`   Error: ${error.message}`);
        } else {
            console.log(`   Error: ${error.message}`);
        }
    }
}

async function verifySeekStreaming() {
    const apiKey = process.env.SEEKSTREAMING_API_KEY_1;
    console.log(`\n🔍 Verifying SeekStreaming (Key: ${apiKey ? 'Present' : 'Missing'})...`);

    if (!apiKey) {
        console.log('❌ SeekStreaming API Key is missing');
        return;
    }

    try {
        console.log('   Sending request to https://seekstreaming.com/api/v1/file/list...');
        const response = await axios.get('https://seekstreaming.com/api/v1/file/list', {
            headers: { 'api-token': apiKey },
            params: { page: 1, per_page: 1 },
            timeout: 10000
        });

        if (response.status === 200) {
            console.log('✅ SeekStreaming Connection Successful');
            console.log(`   Response Message: ${response.data.msg}`);
        }
    } catch (error) {
        console.log('❌ SeekStreaming Failed:');
        if (error.response) {
            console.log(`   Status: ${error.response.status}`);
            console.log(`   Data: ${JSON.stringify(error.response.data)}`);
        } else if (error.request) {
            console.log('   No response received (Network Error)');
            console.log(`   Error: ${error.message}`);
        } else {
            console.log(`   Error: ${error.message}`);
        }
    }
}

async function runVerification() {
    console.log('🚀 Starting API Key Verification...');
    await verifyRPMShare();
    await verifyStreamP2P();
    await verifySeekStreaming();
    console.log('\n🏁 Verification Complete');
}

runVerification();
