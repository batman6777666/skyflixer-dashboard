import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    timeout: 60000, // 60 seconds for batch operations
    headers: {
        'Content-Type': 'application/json'
    }
});

/**
 * Fetch files from all platforms
 * @returns {Promise<Object>} - Response with files array
 */
export async function fetchFiles() {
    try {
        const response = await apiClient.get('/fetch-files');
        return response.data;
    } catch (error) {
        console.error('API Error (fetchFiles):', error);
        throw new Error(error.response?.data?.error || 'Failed to fetch files');
    }
}

/**
 * Process batch rename
 * @param {Array} files - Files to rename
 * @param {Array} newNames - New filenames
 * @returns {Promise<Object>} - Rename results
 */
export async function renameBatch(files, newNames) {
    try {
        const response = await apiClient.post('/rename-batch', {
            files,
            newNames
        });
        return response.data;
    } catch (error) {
        console.error('API Error (renameBatch):', error);
        throw new Error(error.response?.data?.error || 'Failed to rename files');
    }
}

/**
 * Get current statistics
 * @returns {Promise<Object>} - Statistics data
 */
export async function getStats() {
    try {
        const response = await apiClient.get('/stats');
        return response.data;
    } catch (error) {
        console.error('API Error (getStats):', error);
        throw new Error(error.response?.data?.error || 'Failed to fetch statistics');
    }
}

export default {
    fetchFiles,
    renameBatch,
    getStats
};
