import axios from 'axios';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000') + '/api';

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    timeout: 120000, // 2 minutes for deep scan operations
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

/**
 * Scan all platforms and find duplicate files
 * @returns {Promise<Object>} - { duplicates, totalDuplicates }
 */
export async function findDuplicates() {
    try {
        const response = await apiClient.get('/find-duplicates');
        return response.data;
    } catch (error) {
        console.error('API Error (findDuplicates):', error);
        throw new Error(error.response?.data?.error || 'Failed to find duplicates');
    }
}

/**
 * Delete all duplicate files across all platforms (keeps 1 copy per name)
 * @returns {Promise<Object>} - { results, totalDeleted, totalFailed }
 */
export async function deleteDuplicates() {
    try {
        const response = await apiClient.post('/delete-duplicates');
        return response.data;
    } catch (error) {
        console.error('API Error (deleteDuplicates):', error);
        throw new Error(error.response?.data?.error || 'Failed to delete duplicates');
    }
}

/**
 * Compare all platforms and find files missing from any platform
 * @returns {Promise<Object>} - { missingFiles, totalMissing, platformCounts }
 */
export async function findMissingFiles() {
    try {
        const response = await apiClient.get('/missing-files');
        return response.data;
    } catch (error) {
        console.error('API Error (findMissingFiles):', error);
        throw new Error(error.response?.data?.error || 'Failed to check missing files');
    }
}

export default {
    fetchFiles,
    renameBatch,
    getStats,
    findDuplicates,
    deleteDuplicates,
    findMissingFiles
};

