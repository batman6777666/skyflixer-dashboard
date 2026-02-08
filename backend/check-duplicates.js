import dotenv from 'dotenv';
import axios from 'axios';
import fs from 'fs';

if (fs.existsSync('.env')) dotenv.config();

async function checkDuplicates() {
    console.log('\n🔍 CHECKING FOR DUPLICATE FILENAMES\n');
    console.log('='.repeat(70));

    try {
        const response = await axios.get('http://localhost:5000/api/fetch-files');
        const files = response.data.files;

        console.log(`Total entries in API response: ${files.length}\n`);

        // Check for duplicate filenames
        const filenameCount = {};
        const duplicates = [];

        files.forEach(file => {
            const name = file.filename;
            if (!filenameCount[name]) {
                filenameCount[name] = 0;
            }
            filenameCount[name]++;

            if (filenameCount[name] > 1) {
                duplicates.push(name);
            }
        });

        console.log('📊 ANALYSIS:\n');

        if (duplicates.length > 0) {
            console.log(`❌ PROBLEM FOUND! Duplicate filenames detected:`);
            console.log(`   ${duplicates.length} files appear multiple times\n`);

            console.log('Examples of duplicates:');
            duplicates.slice(0, 5).forEach(name => {
                console.log(`\n   "${name.substring(0, 60)}..."`);
                console.log(`      Appears ${filenameCount[name]} times`);

                // Find all entries with this name
                const entries = files.filter(f => f.filename === name);
                entries.forEach((entry, i) => {
                    console.log(`      Entry ${i + 1}: ${entry.platforms.length} platforms - ${entry.platforms.map(p => p.platform).join(', ')}`);
                });
            });

            console.log('\n❌ FILES ARE NOT BEING GROUPED CORRECTLY!');
        } else {
            console.log(`✅ NO DUPLICATES! Each filename appears exactly once.`);
            console.log(`\nSample grouped file:`);
            const multi = files.find(f => f.platforms && f.platforms.length > 1);
            if (multi) {
                console.log(`   "${multi.filename.substring(0, 60)}..."`);
                console.log(`   Platforms (${multi.platforms.length}): ${multi.platforms.map(p => p.platform).join(', ')}`);
            }
        }

        console.log('\n' + '='.repeat(70) + '\n');

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

checkDuplicates();
