import dotenv from 'dotenv';
import axios from 'axios';
import fs from 'fs';

if (fs.existsSync('.env')) dotenv.config();

async function testGrouping() {
    console.log('\n🎯 TESTING SMART GROUPING\n');
    console.log('='.repeat(70));

    try {
        const response = await axios.get('http://localhost:5000/api/fetch-files');
        const files = response.data.files;

        console.log(`\n📊 Total Grouped Files: ${files.length}\n`);

        // Analyze platform distribution
        const platformCounts = {
            1: 0,
            2: 0,
            3: 0,
            4: 0
        };

        files.forEach(f => {
            const count = f.platforms.length;
            platformCounts[count] = (platformCounts[count] || 0) + 1;
        });

        console.log('Platform Distribution:');
        console.log(`  Files on 1 platform:  ${platformCounts[1] || 0}`);
        console.log(`  Files on 2 platforms: ${platformCounts[2] || 0}`);
        console.log(`  Files on 3 platforms: ${platformCounts[3] || 0}`);
        console.log(`  Files on 4 platforms: ${platformCounts[4] || 0}`);

        // Show examples of 4-platform files
        const fourPlatform = files.filter(f => f.platforms.length === 4);
        if (fourPlatform.length > 0) {
            console.log(`\n✅ SUCCESS! ${fourPlatform.length} files found on ALL 4 PLATFORMS:\n`);
            fourPlatform.slice(0, 3).forEach((f, i) => {
                console.log(`${i + 1}. "${f.filename.substring(0, 60)}..."`);
                console.log(`   Platforms: ${f.platforms.map(p => p.platform.toUpperCase()).join(', ')}`);
                console.log('');
            });
        } else {
            console.log('\n⚠️ No files found on all 4 platforms');

            // Show what we do have
            const sample = files[0];
            if (sample) {
                console.log(`\nSample file:`);
                console.log(`  Name: "${sample.filename.substring(0, 60)}..."`);
                console.log(`  Platforms (${sample.platforms.length}): ${sample.platforms.map(p => p.platform).join(', ')}`);
            }
        }

        console.log('\n' + '='.repeat(70));

        if (fourPlatform.length > 0) {
            console.log('✅ GROUPING WORKING! Files from all platforms merged!');
        } else {
            console.log('⚠️ Grouping may need adjustment');
        }

        console.log('='.repeat(70) + '\n');

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

testGrouping();
