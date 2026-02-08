import axios from 'axios';

const domains = [
    'https://rpmshare.com/api/v1',
    'https://www.rpmshare.com/api/v1',
    'https://api.rpmshare.com/api/v1',
    'https://rpmshare.net/api/v1',
    'https://rpmshare.io/api/v1',
    'https://rpmshare.org/api/v1',
    'http://rpmshare.com/api/v1' // Try HTTP
];

const endpoints = [
    '/file/list',
    '/video/manage/123', // Dummy ID
    '/video/list',
    '/video'
];

async function scan() {
    console.log('🔍 Scanning for working RPMShare domain...');

    for (const domain of domains) {
        console.log(`\nTesting Domain: ${domain}`);

        for (const endpoint of endpoints) {
            try {
                const url = `${domain}${endpoint}`;
                // Short timeout to scan fast
                const response = await axios.get(url, {
                    timeout: 5000,
                    validateStatus: () => true // Accept any status code
                });

                console.log(`   ✅ Hit: ${url} -> Status: ${response.status}`);
                if (response.status !== 404 && response.status !== 502) {
                    console.log('      🎉 POTENTIAL MATCH found!');
                }
            } catch (error) {
                if (error.code === 'ENOTFOUND') {
                    console.log(`   ❌ ${domain} -> DNS Error (No IP)`);
                    break; // Skip other endpoints for this domain
                } else if (error.code === 'ECONNREFUSED') {
                    console.log(`   ❌ ${domain} -> Connection Refused`);
                    break;
                } else {
                    console.log(`   ⚠️ ${url} -> ${error.message}`);
                }
            }
        }
    }
}

scan();
