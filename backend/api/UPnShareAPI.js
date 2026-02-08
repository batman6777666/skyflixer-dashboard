import axios from 'axios';

class UPnShareAPI {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.baseURL = 'https://upnshare.com/api/v1';
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
     * Endpoint: GET /api/v1/video/manage
     * @param {number} page - Page number
     * @param {number} perPage - Items per page
     * @returns {Promise<Array>} - Array of files
     */
    async listFiles(page = 1, perPage = 100) {
        try {
            // Confirmed Endpoint: GET /video/manage
            // Structure: { data: [ { id: "...", name: "..." }, ... ] }
            const response = await this.client.get('/video/manage', {
                params: { page, per_page: perPage }
            });

            if (response.data && Array.isArray(response.data.data)) {
                return response.data.data.map(file => ({
                    ...file,
                    platform: 'upnshare',
                    fileId: file.id // ID is directly available
                }));
            }

            return [];
        } catch (error) {
            console.error('UPnShare listFiles error:', error.message);
            // We don't throw to allow other platforms to load
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
            // Endpoint: PATCH /video/manage/{id}
            const response = await this.client.patch(`/video/manage/${fileId}`, {
                name: newName
            });

            return {
                success: true,
                platform: 'upnshare',
                message: 'File renamed successfully'
            };
        } catch (error) {
            console.error(`UPnShare renameFile error for ${fileId}:`, error.message);
            return {
                success: false,
                platform: 'upnshare',
                error: error.response?.data?.message || error.message
            };
        }
    }
}

export default UPnShareAPI;
