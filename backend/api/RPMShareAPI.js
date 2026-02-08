import axios from 'axios';

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
     * Fetch list of files
     * Note: Documentation doesn't explicitly state list endpoint, assuming /video/list or keeping /file/list but mapping 'id'
     * @param {number} page - Page number
     * @param {number} perPage - Items per page
     * @returns {Promise<Array>} - Array of files
     */
    async listFiles(page = 1, perPage = 100) {
        try {
            // Trying probable endpoint based on 'video' resource naming convention
            // If /file/list was old, maybe /video/list is new? 
            // We will try the user's provided /file/list first if they said "2 url right" refers to that
            // But let's assume standard REST: GET /video

            // Reverting to /file/list as per "2 url right" comment unless proved otherwise, 
            // BUT updating the mapping to look for 'id' if 'file_code' is missing.
            // Confirmed Endpoint: GET /video/manage
            // Structure: { data: [ { id: "...", name: "..." }, ... ] }
            const response = await this.client.get('/video/manage', {
                params: { page, per_page: perPage }
            });

            if (response.data && Array.isArray(response.data.data)) {
                return response.data.data.map(file => ({
                    ...file,
                    platform: 'rpmshare',
                    fileId: file.id // ID is directly available
                }));
            }

            return [];
        } catch (error) {
            console.error('RPMShare listFiles error:', error.message);
            // We don't throw here to allow other platforms to load
            return [];
        }
    }

    /**
     * Rename a file
     * Endpoint: PATCH /api/v1/video/manage/{id}
     * @param {string} fileId - Video ID
     * @param {string} newName - New filename
     * @returns {Promise<Object>} - Response object
     */
    async renameFile(fileId, newName) {
        try {
            // New Endpoint: PATCH /video/manage/{id}
            const response = await this.client.patch(`/video/manage/${fileId}`, {
                name: newName
            });

            // Success usually returns 204 or 200
            return {
                success: true,
                platform: 'rpmshare',
                message: 'File renamed successfully'
            };
        } catch (error) {
            console.error(`RPMShare renameFile error for ${fileId}:`, error.message);
            return {
                success: false,
                platform: 'rpmshare',
                error: error.response?.data?.message || error.message
            };
        }
    }
}

export default RPMShareAPI;
