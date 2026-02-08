import db from '../database/db.js';

/**
 * Track a rename operation in the database
 */
export async function trackRename(originalFilename, newFilename, platforms, status, errorMessage = null) {
    return new Promise((resolve, reject) => {
        const timestamp = new Date().toISOString();
        const platformsJSON = JSON.stringify(platforms);

        db.run(
            `INSERT INTO renames (timestamp, original_filename, new_filename, platforms, status, error_message)
       VALUES (?, ?, ?, ?, ?, ?)`,
            [timestamp, originalFilename, newFilename, platformsJSON, status, errorMessage],
            function (err) {
                if (err) reject(err);
                else {
                    updateDailyStats(status).then(resolve).catch(reject);
                }
            }
        );
    });
}

/**
 * Update daily statistics
 */
async function updateDailyStats(status) {
    return new Promise((resolve, reject) => {
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

        // Check if today's record exists
        db.get('SELECT * FROM daily_stats WHERE date = ?', [today], (err, existingRecord) => {
            if (err) {
                reject(err);
                return;
            }

            if (existingRecord) {
                // Update existing record
                db.run(
                    `UPDATE daily_stats 
           SET total_count = total_count + 1,
               successful_count = successful_count + ?,
               failed_count = failed_count + ?
           WHERE date = ?`,
                    [
                        status === 'success' ? 1 : 0,
                        status === 'failed' ? 1 : 0,
                        today
                    ],
                    (err) => {
                        if (err) reject(err);
                        else resolve();
                    }
                );
            } else {
                // Insert new record
                db.run(
                    `INSERT INTO daily_stats (date, total_count, successful_count, failed_count)
           VALUES (?, 1, ?, ?)`,
                    [
                        today,
                        status === 'success' ? 1 : 0,
                        status === 'failed' ? 1 : 0
                    ],
                    (err) => {
                        if (err) reject(err);
                        else resolve();
                    }
                );
            }
        });
    });
}

/**
 * Get today's statistics
 */
export async function getTodayStats() {
    return new Promise((resolve, reject) => {
        const today = new Date().toISOString().split('T')[0];

        db.get('SELECT * FROM daily_stats WHERE date = ?', [today], (err, stats) => {
            if (err) {
                reject(err);
                return;
            }

            if (stats) {
                resolve({
                    date: stats.date,
                    count: stats.total_count,
                    successful: stats.successful_count,
                    failed: stats.failed_count
                });
            } else {
                resolve({
                    date: today,
                    count: 0,
                    successful: 0,
                    failed: 0
                });
            }
        });
    });
}

/**
 * Get last 24 hours statistics
 */
export async function get24HourStats() {
    return new Promise((resolve, reject) => {
        const timestamp24HoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

        db.get(
            `SELECT COUNT(*) as count,
              SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as successful,
              SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed
       FROM renames
       WHERE timestamp >= ?`,
            [timestamp24HoursAgo],
            (err, result) => {
                if (err) {
                    reject(err);
                    return;
                }

                resolve({
                    count: result.count || 0,
                    successful: result.successful || 0,
                    failed: result.failed || 0
                });
            }
        );
    });
}

/**
 * Get recent activity (last 50 entries)
 */
export async function getRecentActivity() {
    return new Promise((resolve, reject) => {
        db.all(
            `SELECT * FROM renames
       ORDER BY timestamp DESC
       LIMIT 50`,
            [],
            (err, activities) => {
                if (err) {
                    reject(err);
                    return;
                }

                resolve(activities.map(activity => ({
                    id: activity.id,
                    timestamp: activity.timestamp,
                    original: activity.original_filename,
                    renamed: activity.new_filename,
                    platforms: JSON.parse(activity.platforms),
                    status: activity.status,
                    error: activity.error_message
                })));
            }
        );
    });
}

/**
 * Calculate success rate
 */
export async function getSuccessRate() {
    const today = await getTodayStats();

    if (today.count === 0) {
        return 0;
    }

    return ((today.successful / today.count) * 100).toFixed(1);
}

/**
 * Cleanup old records (older than 30 days)
 */
export async function cleanupOldRecords() {
    return new Promise((resolve, reject) => {
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

        db.run('DELETE FROM renames WHERE timestamp < ?', [thirtyDaysAgo], function (err) {
            if (err) {
                reject(err);
                return;
            }

            console.log(`🧹 Cleaned up ${this.changes} old records`);
            resolve();
        });
    });
}
