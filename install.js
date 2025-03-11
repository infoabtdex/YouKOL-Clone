/**
 * Simple installation script to set up the Node.js server
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up ImaKOL API Proxy Server...');

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
console.log('\nStart the server with:');
console.log('  npm start');
console.log('\nOr for development with auto-restart:');
console.log('  npm run dev');
console.log('\nTest the server at:');
console.log('  http://localhost:3000/api/test');

// Create example .env file
fs.writeFileSync(path.join(__dirname, '.env.example'), `# Server Configuration
PORT=3000

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:5500,http://127.0.0.1:5500

# Add your image enhancement API key here
# IMAGE_ENHANCEMENT_API_KEY=your_api_key_goes_here`);

console.log('\n✨ Happy coding!'); 