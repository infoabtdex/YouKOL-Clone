// Test script to check PocketBase connection
console.log('Starting PocketBase connection test...');

// Load modules asynchronously
async function testConnection() {
  try {
    // Dynamic import for PocketBase
    const PocketBaseModule = await import('pocketbase');
    const PocketBase = PocketBaseModule.default;
    
    console.log('PocketBase module loaded successfully');

    // Create a new PocketBase client
    const pb = new PocketBase('http://127.0.0.1:8090');
    console.log('PocketBase client created successfully');
    
    // Create a promise that rejects after a timeout
    const timeout = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error('Connection timed out after 5 seconds'));
      }, 5000); // 5 second timeout
    });
    
    try {
      // Race between our connection attempt and the timeout
      const healthCheck = pb.health.check();
      await Promise.race([healthCheck, timeout]);
      
      console.log('PocketBase health check successful!');
      
      // Try to fetch app settings
      const settingsPromise = pb.settings.getAll();
      const settings = await Promise.race([settingsPromise, timeout]);
      console.log('Successfully fetched app settings');
      
      return true;
    } catch (error) {
      console.error('Error connecting to PocketBase:');
      if (error.message === 'Connection timed out after 5 seconds') {
        console.error('CONNECTION TIMEOUT: PocketBase did not respond within 5 seconds');
      } else {
        console.error('- Status:', error.status);
        console.error('- Message:', error.message);
        console.error('- Original error:', error);
      }
      
      if (error.isAbort) {
        console.error('The request was aborted. This could be a network issue or timeout.');
      }
      
      return false;
    }
  } catch (moduleError) {
    console.error('Error loading PocketBase module:', moduleError);
    return false;
  }
}

// Run the test
testConnection().then(success => {
  console.log('\nConnection test result:', success ? 'SUCCESS ✅' : 'FAILED ❌');
  process.exit(success ? 0 : 1);
}).catch(e => {
  console.error('Unexpected error during test:', e);
  console.log('Connection test result: FAILED ❌');
  process.exit(1);
}); 