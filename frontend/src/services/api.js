import axios from 'axios';

const apiBase = import.meta.env.VITE_API_BASE_URL;
const API_BASE_URL = apiBase ? `${apiBase}/api` : '/api';

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    timeout: 120000,
    headers: { 'Content-Type': 'application/json' }
});

// ─── SSE Helper ───────────────────────────────────────────────
function consumeSSE(path, onProgress) {
    return new Promise((resolve, reject) => {
        const baseUrl = apiBase || '';
        const url = `${baseUrl}/api/${path}`;
        const eventSource = new EventSource(url);

        eventSource.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.type === 'progress' && onProgress) {
                    onProgress(data);
                } else if (data.type === 'complete') {
                    eventSource.close();
                    resolve({ success: true, ...data });
                } else if (data.type === 'error') {
                    eventSource.close();
                    reject(new Error(data.error || 'Stream error'));
                }
            } catch (e) { /* ignore parse errors */ }
        };

        eventSource.onerror = () => {
            eventSource.close();
            reject(new Error('Connection lost'));
        };
    });
}

// ─── Fetch Files ──────────────────────────────────────────────

export async function fetchFiles() {
    try {
        const response = await apiClient.get('/fetch-files');
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.error || 'Failed to fetch files');
    }
}

export function fetchFilesStream(onProgress) {
    return consumeSSE('fetch-files-stream', onProgress);
}

// ─── Rename ───────────────────────────────────────────────────

export async function renameBatch(files, newNames) {
    try {
        const response = await apiClient.post('/rename-batch', { files, newNames });
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.error || 'Failed to rename files');
    }
}

export async function getRenameStatus(jobId) {
    try {
        const response = await apiClient.get(`/rename-status/${jobId}`);
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.error || 'Failed to get rename status');
    }
}

// ─── Stats ────────────────────────────────────────────────────

export async function getStats() {
    try {
        const response = await apiClient.get('/stats');
        return response.data;
    } catch (error) {
        // Never throw on stats — return safe defaults silently
        return {
            success: true,
            stats: {
                today: { count: 0, successful: 0, failed: 0 },
                last24h: { count: 0, successful: 0, failed: 0 },
                successRate: 100,
                recentActivity: []
            }
        };
    }
}

// ─── Duplicates ───────────────────────────────────────────────

export async function findDuplicates() {
    try {
        const response = await apiClient.get('/find-duplicates');
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.error || 'Failed to find duplicates');
    }
}

export function findDuplicatesStream(onProgress) {
    return consumeSSE('find-duplicates-stream', onProgress);
}

export async function deleteDuplicates() {
    try {
        const response = await apiClient.post('/delete-duplicates');
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.error || 'Failed to delete duplicates');
    }
}

export function deleteDuplicatesStream(onProgress) {
    return consumeSSE('delete-duplicates-stream', onProgress);
}

// ─── Missing Files ────────────────────────────────────────────

export async function findMissingFiles() {
    try {
        const response = await apiClient.get('/missing-files');
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.error || 'Failed to check missing files');
    }
}

export function findMissingFilesStream(onProgress) {
    return consumeSSE('missing-files-stream', onProgress);
}

export default {
    fetchFiles,
    fetchFilesStream,
    renameBatch,
    getRenameStatus,
    getStats,
    findDuplicates,
    findDuplicatesStream,
    deleteDuplicates,
    deleteDuplicatesStream,
    findMissingFiles,
    findMissingFilesStream
};
