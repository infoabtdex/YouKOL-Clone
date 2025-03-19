/**
 * Simple installation script to set up the ImaKOL server
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const https = require('https');
const { exec } = require('child_process');
const os = require('os');

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

// Determine platform-specific download URL
function getPocketBaseUrl() {
  const platform = os.platform();
  const arch = os.arch();
  
  // Version to download
  const version = '0.20.7';
  
  // Use direct download URLs from PocketBase
  const baseUrl = `https://github.com/pocketbase/pocketbase/releases/download/v${version}`;
  
  // Determine which binary to download based on platform and architecture
  if (platform === 'win32') {
    return `${baseUrl}/pocketbase_${version}_windows_amd64.zip`;
  } else if (platform === 'darwin') {
    return `${baseUrl}/pocketbase_${version}_darwin_${arch === 'arm64' ? 'arm64' : 'amd64'}.zip`;
  } else if (platform === 'linux') {
    return `${baseUrl}/pocketbase_${version}_linux_${arch === 'arm64' ? 'arm64' : 'amd64'}.zip`;
  } else {
    throw new Error(`Unsupported platform: ${platform}`);
  }
}

// Create directory if it doesn't exist
function createDirectoryIfNotExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`Created directory: ${dirPath}`);
  }
}

// Download file from URL
function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    console.log(`Downloading ${url} to ${destPath}...`);
    
    const file = fs.createWriteStream(destPath);
    
    const request = https.get(url, (response) => {
      // Handle redirects
      if (response.statusCode === 301 || response.statusCode === 302) {
        const redirectUrl = response.headers.location;
        console.log(`Following redirect to: ${redirectUrl}`);
        file.close();
        // Recursive call to handle the redirect
        downloadFile(redirectUrl, destPath).then(resolve).catch(reject);
        return;
      }
      
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download, status code: ${response.statusCode}`));
        return;
      }
      
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        console.log('Download completed');
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(destPath, () => {});
      reject(err);
    });
    
    file.on('error', (err) => {
      fs.unlink(destPath, () => {});
      reject(err);
    });
  });
}

// Extract ZIP file using appropriate method for platform
function extractZip(zipPath, destDir) {
  return new Promise((resolve, reject) => {
    console.log(`Extracting ${zipPath} to ${destDir}...`);
    
    const platform = os.platform();
    
    let command;
    if (platform === 'win32') {
      // Use PowerShell to extract on Windows - escape paths properly
      command = `powershell -command "Expand-Archive -Path '${zipPath.replace(/'/g, "''")}' -DestinationPath '${destDir.replace(/'/g, "''")}' -Force"`;
    } else {
      // Use unzip on Unix-like systems
      command = `unzip -o "${zipPath}" -d "${destDir}"`;
    }
    
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error during extraction: ${error.message}`);
        reject(error);
        return;
      }
      
      console.log('Extraction completed');
      resolve();
    });
  });
}

// Make file executable (Unix only)
function makeExecutable(filePath) {
  if (os.platform() !== 'win32') {
    console.log(`Making ${filePath} executable...`);
    fs.chmodSync(filePath, '755');
    console.log('File permission updated');
  }
}

// Main installation function
async function installPocketBase() {
  try {
    console.log('Starting PocketBase installation...');
    
    // Create pocketbase directory
    const pocketbaseDir = path.join(__dirname, 'pocketbase');
    createDirectoryIfNotExists(pocketbaseDir);
    
    // Get PocketBase download URL for the current platform
    const downloadUrl = getPocketBaseUrl();
    console.log(`Using download URL: ${downloadUrl}`);
    
    // Download PocketBase
    const zipPath = path.join(pocketbaseDir, 'pocketbase.zip');
    try {
      await downloadFile(downloadUrl, zipPath);
    } catch (downloadError) {
      console.error(`Download failed: ${downloadError.message}`);
      console.log('Trying alternative download method...');
      
      // Try downloading with a different method on Windows
      if (os.platform() === 'win32') {
        try {
          console.log('Using PowerShell to download PocketBase...');
          const psCommand = `powershell -command "Invoke-WebRequest -Uri '${downloadUrl}' -OutFile '${zipPath.replace(/'/g, "''")}'"`;
          execSync(psCommand, { stdio: 'inherit' });
          console.log('Download completed via PowerShell');
        } catch (psError) {
          console.error(`PowerShell download failed: ${psError.message}`);
          throw new Error('Failed to download PocketBase after multiple attempts');
        }
      } else {
        // For non-Windows, try curl or wget
        try {
          console.log('Trying curl to download PocketBase...');
          execSync(`curl -L "${downloadUrl}" -o "${zipPath}"`, { stdio: 'inherit' });
          console.log('Download completed via curl');
        } catch (curlError) {
          try {
            console.log('Trying wget to download PocketBase...');
            execSync(`wget "${downloadUrl}" -O "${zipPath}"`, { stdio: 'inherit' });
            console.log('Download completed via wget');
          } catch (wgetError) {
            console.error('All download methods failed');
            throw new Error('Failed to download PocketBase after multiple attempts');
          }
        }
      }
    }
    
    if (!fs.existsSync(zipPath)) {
      throw new Error(`Download seems to have failed. Zip file not found at ${zipPath}`);
    }
    
    // Extract the archive
    await extractZip(zipPath, pocketbaseDir);
    
    // Make pocketbase executable on Unix systems
    if (os.platform() !== 'win32') {
      makeExecutable(path.join(pocketbaseDir, 'pocketbase'));
    } else {
      // Verify the pocketbase.exe exists on Windows
      const pbExePath = path.join(pocketbaseDir, 'pocketbase.exe');
      if (!fs.existsSync(pbExePath)) {
        console.log('Looking for PocketBase executable...');
        // List directory contents to help debugging
        const files = fs.readdirSync(pocketbaseDir);
        console.log(`Files in ${pocketbaseDir}:`, files);
      }
    }
    
    // Delete the zip file
    fs.unlinkSync(zipPath);
    console.log('Deleted zip file');
    
    console.log('\nPocketBase installation completed successfully!');
    console.log(`\nYou can now run PocketBase with: npm run pocketbase`);
    console.log(`Or start both the server and PocketBase with: npm run dev`);
    
  } catch (error) {
    console.error(`Installation failed: ${error.message}`);
    process.exit(1);
  }
}

// Run the installation
installPocketBase();

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