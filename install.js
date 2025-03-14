/**
 * Simple installation script to set up the ImaKOL server
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up ImaKOL Server...');

// Check if .env file exists, create it if not
const envPath = path.join(__dirname, '.env');
const envExamplePath = path.join(__dirname, '.env.example');

if (!fs.existsSync(envPath)) {
  console.log('📄 Creating .env file...');
  
  // Check if .env.example exists
  if (fs.existsSync(envExamplePath)) {
    const envContent = fs.readFileSync(envExamplePath, 'utf8');
    fs.writeFileSync(envPath, envContent);
    console.log('✅ Created .env file from .env.example');
    console.log('⚠️ Please edit the .env file to add your API keys before running the server');
  } else {
    // Create a basic .env file if .env.example doesn't exist
    const basicEnvContent = `# API Keys (Required)
DEEP_IMAGE_API_KEY=your_api_key_here
GROK_API_KEY=your_grok_api_key_here
PORT=3000
ALLOWED_ORIGINS=*
LOG_LEVEL=info`;
    
    fs.writeFileSync(envPath, basicEnvContent);
    console.log('✅ Created basic .env file');
    console.log('⚠️ Please edit the .env file to add your API keys before running the server');
  }
}

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  console.log('📁 Creating uploads directory...');
  fs.mkdirSync(uploadsDir);
  console.log('✅ Created uploads directory');
}

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
  console.log('📁 Creating logs directory...');
  fs.mkdirSync(logsDir);
  console.log('✅ Created logs directory');
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
console.log('  - Edit the .env file to configure your server settings');
console.log('  - Required: Add your API keys for Deep Image and Grok Vision');
console.log('  - Optional: Configure port, allowed origins, and logging level');
console.log('  - See .env.example for all available configuration options');

console.log('\n✨ Happy capturing!'); 