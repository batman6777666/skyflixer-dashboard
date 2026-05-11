import axios from 'axios';
import globalLimiter from '../services/rateLimiter.js';

const sleep = ms => new Promise(r => setTimeout(r, ms));

class UPnShareAPI {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.baseURL = 'https://upnshare.com/api/v1';
        this.client = axios.create({
            baseURL: this.baseURL,
            headers: { 'api-token': this.apiKey, 'Content-Type': 'application/json' },
            timeout: 30000
        });
    }

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
                    files: files.map(f => ({ ...f, platform: 'upnshare', fileId: f.id })),
                    maxPage
                };
            } catch (error) {
                const status = error.response?.status;
                if (status === 429) {
                    const backoff = Math.min(3000 * Math.pow(2, attempt - 1), 60000);
                    console.log(`  ⏳ UPnShare page ${page}: 429 rate limited, waiting ${(backoff/1000).toFixed(0)}s (attempt ${attempt})...`);
                    await sleep(backoff);
                    continue;
                }
                if (attempt < 5) {
                    console.log(`  ⚠️ UPnShare page ${page}: error (attempt ${attempt}/5), retrying in 2s...`);
                    await sleep(2000);
                    continue;
                }
                console.error(`  ❌ UPnShare page ${page}: failed after ${attempt} attempts`);
                return { files: [], maxPage: 1 };
            }
        }
    }

    async listAllFiles(onProgress) {
        const allFiles = [];
        console.log(`  -> UPnShare: Starting deep scan...`);

        const { files: firstPage, maxPage } = await this.listFiles(1);
        allFiles.push(...firstPage);
        console.log(`  -> UPnShare: Page 1/${maxPage} => ${firstPage.length} files`);
        if (onProgress) onProgress({ pagesCompleted: 1, totalPages: maxPage });

        for (let p = 2; p <= maxPage; p++) {
            const { files } = await this.listFiles(p);
            allFiles.push(...files);
            if (onProgress) onProgress({ pagesCompleted: p, totalPages: maxPage });
        }

        console.log(`  -> UPnShare: Done — ${allFiles.length} files (${maxPage} pages)`);
        return allFiles;
    }

    async renameFile(fileId, newName) {
        let attempt = 0;
        while (true) {
            attempt++;
            try {
                await globalLimiter.acquire(this.apiKey);
                await this.client.patch(`/video/manage/${fileId}`, { name: newName });
                return { success: true, platform: 'upnshare' };
            } catch (error) {
                if (error.response?.status === 429) {
                    const backoff = Math.min(3000 * Math.pow(2, attempt - 1), 60000);
                    await sleep(backoff);
                    continue;
                }
                if (attempt < 3) { await sleep(2000); continue; }
                return { success: false, platform: 'upnshare', error: error.response?.data?.message || error.message };
            }
        }
    }

    async deleteFile(fileId) {
        let attempt = 0;
        while (true) {
            attempt++;
            try {
                await globalLimiter.acquire(this.apiKey);
                await this.client.delete(`/video/manage/${fileId}`);
                return { success: true, platform: 'upnshare', fileId };
            } catch (error) {
                if (error.response?.status === 429) {
                    const backoff = Math.min(3000 * Math.pow(2, attempt - 1), 60000);
                    await sleep(backoff);
                    continue;
                }
                if (attempt < 3) { await sleep(2000); continue; }
                return { success: false, platform: 'upnshare', fileId, error: error.response?.data?.message || error.message };
            }
        }
    }
}

export default UPnShareAPI;
