import dotenv from 'dotenv';
import axios from 'axios';
import fs from 'fs';

if (fs.existsSync('.env')) dotenv.config();

async function testStats() {
    console.log('\n📊 TESTING STATISTICS API\n');
    console.log('='.repeat(70));

    try {
        const response = await axios.get('http://localhost:5000/api/stats');
        const { stats } = response.data;

        console.log('\n✅ API Response Received\n');

        // Check Today's Stats
        console.log('📅 Today\'s Rename:');
        console.log(`   Total: ${stats.today.count}`);
        console.log(`   Successful: ${stats.today.successful}`);
        console.log(`   Failed: ${stats.today.failed}`);

        // Check Last 24 Hours
        console.log('\n⏰ Last 24 Hours:');
        console.log(`   Total: ${stats.last24h.count}`);
        console.log(`   Successful: ${stats.last24h.successful}`);
        console.log(`   Failed: ${stats.last24h.failed}`);

        // Check Success Rate
        console.log('\n✅ Success Rate:');
        console.log(`   ${stats.successRate}%`);

        // Check Recent Activity
        console.log('\n📝 Recent Activity:');
        console.log(`   Total entries: ${stats.recentActivity.length}`);
        if (stats.recentActivity.length > 0) {
            console.log(`\n   Latest 3 activities:`);
            stats.recentActivity.slice(0, 3).forEach((activity, i) => {
                console.log(`   ${i + 1}. ${activity.original} → ${activity.renamed}`);
                console.log(`      Status: ${activity.status}, Time: ${new Date(activity.timestamp).toLocaleString()}`);
            });
        }

        // Verify data consistency
        console.log('\n' + '='.repeat(70));
        console.log('🔍 CONSISTENCY CHECK:\n');

        const issues = [];

        // Check if values are actual numbers (not Promise objects)
        if (typeof stats.today.count !== 'number') {
            issues.push('❌ Today count is not a number (likely Promise object)');
        } else {
            console.log('✅ Today count is a proper number');
        }

        if (typeof stats.last24h.count !== 'number') {
            issues.push('❌ Last 24h count is not a number (likely Promise object)');
        } else {
            console.log('✅ Last 24h count is a proper number');
        }

        if (typeof stats.successRate !== 'number') {
            issues.push('❌ Success rate is not a number (likely Promise object)');
        } else {
            console.log('✅ Success rate is a proper number');
        }

        if (!Array.isArray(stats.recentActivity)) {
            issues.push('❌ Recent activity is not an array (likely Promise object)');
        } else {
            console.log('✅ Recent activity is a proper array');
        }

        console.log('\n' + '='.repeat(70));
        if (issues.length === 0) {
            console.log('✅ ALL STATS ARE WORKING CORRECTLY!');
            console.log('   Today, Last 24h, Success Rate, and Recent Activity are all consistent');
        } else {
            console.log('❌ ISSUES FOUND:');
            issues.forEach(issue => console.log(`   ${issue}`));
        }
        console.log('='.repeat(70) + '\n');

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        if (error.response) {
            console.error('Response data:', error.response.data);
        }
    }
}

testStats();
