/**
 * API Client for communicating with the Node.js proxy server
 * This handles all API requests to avoid CORS issues
 */

const API_URL = 'http://localhost:3000/api';

const ApiClient = {
  /**
   * Test the API connection
   * @returns {Promise<Object>} Response from the API test endpoint
   */
  testConnection: async function() {
    try {
      const response = await fetch(`${API_URL}/test`);
      
      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error testing API connection:', error);
      throw error;
    }
  },
  
  /**
   * Enhance an image using the API
   * @param {File} imageFile - The image file to enhance
   * @returns {Promise<Object>} Response from the API
   */
  enhanceImage: async function(imageFile) {
    try {
      // Create form data to send the file
      const formData = new FormData();
      formData.append('image', imageFile);
      
      const response = await fetch(`${API_URL}/enhance-image`, {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `API request failed with status ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error enhancing image:', error);
      throw error;
    }
  }
};

// Export the API client for use in the app
window.ApiClient = ApiClient; 