import dotenv from 'dotenv';
import axios from 'axios';
import fs from 'fs';

if (fs.existsSync('.env')) dotenv.config();

async function testSkylixFilter() {
    console.log('\n🧪 TESTING SKYFLIX FILTER\n');
    console.log('='.repeat(70));

    try {
        const response = await axios.get('http://localhost:5000/api/fetch-files');
        const files = response.data.files;

        console.log(`\n📊 Total files returned: ${files.length}\n`);

        // Check if any file contains "SKYFLIX"
        const skylixFiles = files.filter(f => {
            const name = f.filename || '';
            return name.toLowerCase().includes('skyflix');
        });

        if (skylixFiles.length > 0) {
            console.log(`❌ FILTER FAILED! Found ${skylixFiles.length} files with "SKYFLIX":\n`);
            skylixFiles.forEach(f => {
                console.log(`   "${f.filename}"`);
            });
        } else {
            console.log(`✅ FILTER WORKING! No files with "SKYFLIX" found.`);
        }

        // Show sample files
        console.log(`\n📄 Sample files (first 3):\n`);
        files.slice(0, 3).forEach((f, i) => {
            console.log(`${i + 1}. "${f.filename.substring(0, 60)}..."`);
            console.log(`   Platforms: ${f.platforms.map(p => p.platform).join(', ')}`);
            console.log('');
        });

        console.log('='.repeat(70));
        if (skylixFiles.length === 0) {
            console.log('✅ SUCCESS! SKYFLIX files are filtered out correctly!');
        } else {
            console.log('❌ FILTER NOT WORKING! SKYFLIX files still appearing!');
        }
        console.log('='.repeat(70) + '\n');

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

testSkylixFilter();
