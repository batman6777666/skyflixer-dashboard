/**
 * rateLimiter.js — Token-bucket rate limiter
 * ─────────────────────────────────────────────
 * Enforces a maximum of `maxPerSecond` requests per second per key.
 * Default: 5 requests/second/key — conservative to avoid 429.
 */

class RateLimiter {
    /**
     * @param {number} maxPerSecond — max requests per second per key (default 5)
     */
    constructor(maxPerSecond = 5) {
        this.maxPerSecond = maxPerSecond;
        this.interval = 1000 / maxPerSecond; // 200ms between requests at 5/s
        this.buckets = new Map();
    }

    async acquire(key = 'default') {
        if (!this.buckets.has(key)) {
            this.buckets.set(key, { lastTime: 0, queue: Promise.resolve() });
        }

        const bucket = this.buckets.get(key);

        bucket.queue = bucket.queue.then(() => {
            return new Promise(resolve => {
                const now = Date.now();
                const elapsed = now - bucket.lastTime;
                const wait = Math.max(0, this.interval - elapsed);

                setTimeout(() => {
                    bucket.lastTime = Date.now();
                    resolve();
                }, wait);
            });
        });

        return bucket.queue;
    }
}

// Singleton — 5 requests/second/key (safe for all providers)
const globalLimiter = new RateLimiter(5);

export default globalLimiter;
export { RateLimiter };
