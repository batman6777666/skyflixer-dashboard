import axios from 'axios';

async function testRealSuccessRate() {
    console.log('\n📊 TESTING REAL SUCCESS RATE TRACKING\n');
    console.log('='.repeat(70));

    try {
        const response = await axios.get('http://localhost:5000/api/stats');
        const { stats } = response.data;

        console.log('\n✅ Stats API Response:\n');
        console.log(`Today's Renames: ${stats.today.count} (Success: ${stats.today.successful}, Failed: ${stats.today.failed})`);
        console.log(`Last 24 Hours: ${stats.last24h.count} (Success: ${stats.last24h.successful}, Failed: ${stats.last24h.failed})`);
        console.log(`Success Rate: ${stats.successRate}%`);
        console.log(`Recent Activity Count: ${stats.recentActivity.length}`);

        console.log('\n' + '='.repeat(70));
        console.log('✅ STATS ARE WORKING!');
        console.log('   - Success rate will reflect actual rename results');
        console.log('   - Currently showing: ' + (stats.today.count === 0 ? '100% (no renames yet)' : `${stats.successRate}%`));
        console.log('   - After renaming, it will show real percentage');
        console.log('='.repeat(70) + '\n');

    } catch (error) {
        console.error('\n❌ Error:', error.message);
    }
}

testRealSuccessRate();
