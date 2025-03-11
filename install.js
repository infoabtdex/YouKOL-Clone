/**
 * Simple installation script to set up the ImaKOL server
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up ImaKOL Server...');

// Check if .env file exists, create it if not
const envPath = path.join(__dirname, '.env');
if (!fs.existsSync(envPath)) {
  console.log('📄 Creating .env file...');
  const envContent = fs.readFileSync(path.join(__dirname, '.env.example'), 'utf8');
  fs.writeFileSync(envPath, envContent);
  console.log('✅ Created .env file');
}

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  console.log('📁 Creating uploads directory...');
  fs.mkdirSync(uploadsDir);
  console.log('✅ Created uploads directory');
}

// Install dependencies
console.log('📦 Installing dependencies...');
try {
  execSync('npm install', { stdio: 'inherit' });
  console.log('✅ Dependencies installed successfully');
} catch (error) {
  console.error('❌ Failed to install dependencies');
  console.error(error.message);
  process.exit(1);
}

console.log('\n🎉 Setup complete!');
console.log('\n🚀 Start the server with:');
console.log('  npm start');

console.log('\n🌐 Accessing the application:');
console.log('  Once the server is running, it will display URLs to access the application');
console.log('  You can access it from your browser or mobile device on the same network');

console.log('\n⚙️ Configuration:');
console.log('  - The server runs on the port specified in .env (default: 3000, but you can change it)');
console.log('  - By default, all origins (*) are allowed to access the API');
console.log('  - You can modify these settings in the .env file');

// Create example .env file with more flexible origins configuration
fs.writeFileSync(path.join(__dirname, '.env.example'), `# Server Configuration
# Change this to any port you prefer
PORT=3000

# CORS Configuration
# Add URLs that will access this server (comma-separated), or use * to allow all origins
# Examples:
# Allow specific origins: http://localhost:ANY_PORT,http://127.0.0.1:ANY_PORT,http://YOUR_IP:ANY_PORT
# Allow all origins (not recommended for production): *
ALLOWED_ORIGINS=*`);

console.log('\n✨ Happy capturing!'); 