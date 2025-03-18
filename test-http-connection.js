// Test direct HTTP connection to PocketBase
const axios = require('axios');

console.log('Testing direct HTTP connection to PocketBase...');

// Set a timeout for the request
axios.get('http://127.0.0.1:8090/api/health', { timeout: 5000 })
  .then(response => {
    console.log('Connection successful!');
    console.log('Status:', response.status);
    console.log('Data:', response.data);
    process.exit(0);
  })
  .catch(error => {
    console.error('Error connecting to PocketBase:');
    if (error.code === 'ECONNREFUSED') {
      console.error('Connection refused. PocketBase may not be running or accessible at http://127.0.0.1:8090');
    } else if (error.code === 'ETIMEDOUT') {
      console.error('Connection timed out. PocketBase may be running but not responding.');
    } else {
      console.error('Error details:', error.message);
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
      }
    }
    process.exit(1);
  }); 