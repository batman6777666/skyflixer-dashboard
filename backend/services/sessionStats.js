// In-memory statistics tracking (session-only, no database)
// Resets when server restarts
let sessionStats = {
    renames: [],
    startTime: new Date()
};

/**
 * Track a rename operation result
 * @param {string} filename - Original filename
 * @param {string} newName - New filename  
 * @param {Array} platforms - Array of platform names
 * @param {string} status - 'success' or 'failed'
 * @param {string} errorMessage - Optional error message if failed
 */
export function trackRename(filename, newName, platforms, status, errorMessage = null) {
    sessionStats.renames.push({
        timestamp: new Date().toISOString(),
        filename,
        newName,
        platforms,
        status,
        error: errorMessage
    });

    // Keep only last 24 hours of data to minimize memory
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    sessionStats.renames = sessionStats.renames.filter(r =>
        new Date(r.timestamp) > twentyFourHoursAgo
    );
}

/**
 * Get current session statistics
 */
export function getSessionStats() {
    const now = new Date();
    const twentyFourHoursAgo = new Date(now - 24 * 60 * 60 * 1000);

    // Filter renames from last 24 hours
    const last24h = sessionStats.renames.filter(r =>
        new Date(r.timestamp) > twentyFourHoursAgo
    );

    // Calculate stats
    const total = last24h.length;
    const successful = last24h.filter(r => r.status === 'success').length;
    const failed = last24h.filter(r => r.status === 'failed').length;
    const successRate = total > 0 ? Math.round((successful / total) * 100) : 100;

    return {
        today: {
            date: now.toISOString().split('T')[0],
            count: total,
            successful,
            failed
        },
        last24h: {
            count: total,
            successful,
            failed
        },
        successRate,
        recentActivity: last24h.slice(-50).reverse().map((r, i) => ({
            id: i + 1,
            timestamp: r.timestamp,
            original: r.filename,
            renamed: r.newName,
            platforms: r.platforms || [],
            status: r.status,
            error: r.error
        }))
    };
}

/**
 * Reset statistics (useful for testing)
 */
export function resetSessionStats() {
    sessionStats = {
        renames: [],
        startTime: new Date()
    };
}
