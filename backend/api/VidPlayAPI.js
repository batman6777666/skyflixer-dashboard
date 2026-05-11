import axios from 'axios';
import globalLimiter from '../services/rateLimiter.js';

const sleep = ms => new Promise(r => setTimeout(r, ms));

class VidPlayAPI {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.baseURL = 'https://easyvidplay.com/api/v1';
        this.client = axios.create({
            baseURL: this.baseURL,
            headers: { 'api-token': this.apiKey, 'Content-Type': 'application/json' },
            timeout: 30000
        });
    }

    /**
     * Fetch one page — UNLIMITED retries with exponential backoff on 429.
     * Will NEVER return empty due to rate limits. Keeps retrying until success.
     * API: GET /api/v1/video/manage?page=N&perPage=500
     */
    async listFiles(page = 1) {
        let attempt = 0;
        while (true) {
            attempt++;
            try {
                await globalLimiter.acquire(this.apiKey);
                const response = await this.client.get('/video/manage', { params: { page, perPage: 500 } });
                const data = response.data;
                const files = Array.isArray(data.data) ? data.data : [];
                const maxPage = data.metadata?.maxPage || 1;
                return {
                    files: files.map(f => ({ ...f, platform: 'vidplay', fileId: f.id })),
                    maxPage
                };
            } catch (error) {
                const status = error.response?.status;
                if (status === 429) {
                    // Rate limited — exponential backoff: 3s, 6s, 12s, 24s... capped at 60s
                    const backoff = Math.min(3000 * Math.pow(2, attempt - 1), 60000);
                    console.log(`  ⏳ VidPlay page ${page}: 429 rate limited, waiting ${(backoff/1000).toFixed(0)}s (attempt ${attempt})...`);
                    await sleep(backoff);
                    continue; // retry — never skip
                }
                // Non-429 errors: retry up to 5 times with delay
                if (attempt < 5) {
                    console.log(`  ⚠️ VidPlay page ${page}: error (attempt ${attempt}/5), retrying in 2s...`);
                    await sleep(2000);
                    continue;
                }
                console.error(`  ❌ VidPlay page ${page}: failed after ${attempt} attempts`);
                return { files: [], maxPage: 1 };
            }
        }
    }

    async listAllFiles(onProgress) {
        const allFiles = [];
        console.log(`  -> VidPlay: Starting deep scan...`);

        const { files: firstPage, maxPage } = await this.listFiles(1);
        allFiles.push(...firstPage);
        console.log(`  -> VidPlay: Page 1/${maxPage} => ${firstPage.length} files`);
        if (onProgress) onProgress({ pagesCompleted: 1, totalPages: maxPage });

        for (let p = 2; p <= maxPage; p++) {
            const { files } = await this.listFiles(p);
            allFiles.push(...files);
            if (onProgress) onProgress({ pagesCompleted: p, totalPages: maxPage });
        }

        console.log(`  -> VidPlay: Done — ${allFiles.length} files (${maxPage} pages)`);
        return allFiles;
    }

    /**
     * Rename a video — PATCH /api/v1/video/manage/{id}
     * Body: { "name": "new name" }
     * Returns 204 No Content on success
     */
    async renameFile(fileId, newName) {
        let attempt = 0;
        while (true) {
            attempt++;
            try {
                await globalLimiter.acquire(this.apiKey);
                await this.client.patch(`/video/manage/${fileId}`, { name: newName });
                return { success: true, platform: 'vidplay' };
            } catch (error) {
                if (error.response?.status === 429) {
                    const backoff = Math.min(3000 * Math.pow(2, attempt - 1), 60000);
                    await sleep(backoff);
                    continue;
                }
                if (error.response?.status === 409) {
                    return { success: false, platform: 'vidplay', error: 'Video is currently processing (409 Conflict)' };
                }
                if (attempt < 3) { await sleep(2000); continue; }
                return { success: false, platform: 'vidplay', error: error.response?.data?.message || error.message };
            }
        }
    }

    /**
     * Delete a single video — DELETE /api/v1/video/manage/{id}
     * Returns 204 No Content on success
     */
    async deleteFile(fileId) {
        let attempt = 0;
        while (true) {
            attempt++;
            try {
                await globalLimiter.acquire(this.apiKey);
                await this.client.delete(`/video/manage/${fileId}`);
                return { success: true, platform: 'vidplay', fileId };
            } catch (error) {
                if (error.response?.status === 429) {
                    const backoff = Math.min(3000 * Math.pow(2, attempt - 1), 60000);
                    await sleep(backoff);
                    continue;
                }
                if (error.response?.status === 409) {
                    return { success: false, platform: 'vidplay', fileId, error: 'Video is currently processing (409 Conflict)' };
                }
                if (attempt < 3) { await sleep(2000); continue; }
                return { success: false, platform: 'vidplay', fileId, error: error.response?.data?.message || error.message };
            }
        }
    }

    /**
     * Delete multiple videos at once — DELETE /api/v1/video/manage
     * Body: { "ids": ["id1", "id2", ...] }
     * Returns 204 No Content on success
     */
    async deleteMultipleFiles(fileIds) {
        let attempt = 0;
        while (true) {
            attempt++;
            try {
                await globalLimiter.acquire(this.apiKey);
                await this.client.delete('/video/manage', { data: { ids: fileIds } });
                return { success: true, platform: 'vidplay', fileIds };
            } catch (error) {
                if (error.response?.status === 429) {
                    const backoff = Math.min(3000 * Math.pow(2, attempt - 1), 60000);
                    await sleep(backoff);
                    continue;
                }
                if (error.response?.status === 409) {
                    return { success: false, platform: 'vidplay', fileIds, error: 'One or more videos are currently processing (409 Conflict)' };
                }
                if (attempt < 3) { await sleep(2000); continue; }
                return { success: false, platform: 'vidplay', fileIds, error: error.response?.data?.message || error.message };
            }
        }
    }

    /**
     * Get single video detail — GET /api/v1/video/manage/{id}
     * Returns full video detail including the `type` field
     */
    async getVideoDetail(fileId) {
        let attempt = 0;
        while (true) {
            attempt++;
            try {
                await globalLimiter.acquire(this.apiKey);
                const response = await this.client.get(`/video/manage/${fileId}`);
                return { success: true, data: response.data };
            } catch (error) {
                if (error.response?.status === 429) {
                    const backoff = Math.min(3000 * Math.pow(2, attempt - 1), 60000);
                    await sleep(backoff);
                    continue;
                }
                if (attempt < 3) { await sleep(2000); continue; }
                return { success: false, error: error.response?.data?.message || error.message };
            }
        }
    }

    /**
     * Get upload credentials — GET /api/v1/video/upload
     * Returns { tusUrl, accessToken } for TUS protocol upload
     */
    async getUploadCredentials() {
        let attempt = 0;
        while (true) {
            attempt++;
            try {
                await globalLimiter.acquire(this.apiKey);
                const response = await this.client.get('/video/upload');
                return { success: true, data: response.data };
            } catch (error) {
                if (error.response?.status === 429) {
                    const backoff = Math.min(3000 * Math.pow(2, attempt - 1), 60000);
                    await sleep(backoff);
                    continue;
                }
                if (attempt < 3) { await sleep(2000); continue; }
                return { success: false, error: error.response?.data?.message || error.message };
            }
        }
    }

    async deleteFilePermanently(fileId) {
        return this.deleteFile(fileId);
    }
}

export default VidPlayAPI;
