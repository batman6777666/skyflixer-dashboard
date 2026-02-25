import axios from 'axios';

const sleep = ms => new Promise(r => setTimeout(r, ms));

let _cache = null;
let _cacheTime = 0;
const CACHE_TTL = 3 * 60 * 1000;

class RPMShareAPI {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.baseURL = 'https://rpmshare.com/api/v1';
        this.client = axios.create({
            baseURL: this.baseURL,
            headers: {
                'api-token': this.apiKey,
                'Content-Type': 'application/json'
            },
            timeout: 30000
        });
    }

    /**
     * Fetch one page of files (with up to 3 retries on failure)
     */
    async listFiles(page = 1, retries = 3) {
        for (let attempt = 1; attempt <= retries; attempt++) {
            try {
                const response = await this.client.get('/video/manage', { params: { page } });
                const data = response.data;
                const files = Array.isArray(data.data) ? data.data : [];
                const maxPage = data.metadata?.maxPage || 1;
                return {
                    files: files.map(f => ({ ...f, platform: 'rpmshare', fileId: f.id })),
                    maxPage
                };
            } catch (error) {
                console.error(`RPMShare listFiles page ${page} attempt ${attempt} error:`, error.message);
                if (attempt < retries) await sleep(1000 * attempt);
            }
        }
        console.error(`RPMShare listFiles page ${page}: all retries failed, returning []`);
        return { files: [], maxPage: 1 };
    }

    /**
     * Deep scan — fetch ALL pages SEQUENTIALLY to avoid rate-limiting.
     */
    async listAllFiles() {
        if (_cache && Date.now() - _cacheTime < CACHE_TTL) {
            console.log(`  -> RPMShare: Cache hit (${_cache.length} files)`);
            return _cache;
        }

        const allFiles = [];
        console.log(`  -> RPMShare: Starting deep scan...`);

        const { files: firstPage, maxPage } = await this.listFiles(1);
        allFiles.push(...firstPage);
        console.log(`  -> RPMShare: Page 1/${maxPage} => ${firstPage.length} files`);

        for (let p = 2; p <= maxPage; p++) {
            await sleep(50);
            const { files } = await this.listFiles(p);
            allFiles.push(...files);
        }

        _cache = allFiles;
        _cacheTime = Date.now();
        console.log(`  -> RPMShare: Done — ${allFiles.length} files (${maxPage} pages)`);
        return allFiles;
    }

    /**
     * Rename a file
     * Endpoint: PATCH /api/v1/video/manage/{id}
     */
    async renameFile(fileId, newName) {
        try {
            await this.client.patch(`/video/manage/${fileId}`, { name: newName });
            return { success: true, platform: 'rpmshare', message: 'File renamed successfully' };
        } catch (error) {
            console.error(`RPMShare renameFile error for ${fileId}:`, error.message);
            return { success: false, platform: 'rpmshare', error: error.response?.data?.message || error.message };
        }
    }

    /**
     * Delete a file
     * APIs often return 204 No Content on success — treat any non-error response as success.
     */
    async deleteFile(fileId) {
        try {
            const res = await this.client.delete(`/video/manage/${fileId}`);
            console.log(`RPMShare deleteFile ${fileId}: HTTP ${res.status}`);
            return { success: true, platform: 'rpmshare', fileId, message: 'File deleted successfully' };
        } catch (error) {
            const status = error.response?.status;
            const msg = error.response?.data?.message || error.message;
            console.error(`RPMShare deleteFile error for ${fileId}: HTTP ${status} — ${msg}`);
            return { success: false, platform: 'rpmshare', fileId, error: msg };
        }
    }
}

export default RPMShareAPI;
