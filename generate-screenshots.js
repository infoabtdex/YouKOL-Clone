const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

// Make sure the screenshots directory exists
if (!fs.existsSync('screenshots')) {
  fs.mkdirSync('screenshots');
}

// Define the screenshots to create
const screenshots = [
  {
    filename: 'mobile-screenshot.png',
    width: 390,
    height: 844,
    label: 'Mobile View',
    formFactor: 'narrow'
  },
  {
    filename: 'desktop-screenshot.png',
    width: 1280,
    height: 800,
    label: 'Desktop View',
    formFactor: 'wide'
  }
];

// Function to create a placeholder screenshot
function createScreenshot(config) {
  console.log(`Creating ${config.formFactor} screenshot: ${config.filename}`);
  
  // Create canvas with the specified dimensions
  const canvas = createCanvas(config.width, config.height);
  const ctx = canvas.getContext('2d');
  
  // Fill background with app's theme color
  ctx.fillStyle = '#F9FAFB';
  ctx.fillRect(0, 0, config.width, config.height);
  
  // Add a gradient header area
  const gradient = ctx.createLinearGradient(0, 0, config.width, 0);
  gradient.addColorStop(0, '#FF725E');
  gradient.addColorStop(1, '#E9756B');
  ctx.fillStyle = gradient;
  
  // Header height varies by form factor
  const headerHeight = config.formFactor === 'narrow' ? 100 : 150;
  ctx.fillRect(0, 0, config.width, headerHeight);
  
  // Add app name to header
  ctx.fillStyle = 'white';
  ctx.font = `bold ${config.formFactor === 'narrow' ? 24 : 32}px Arial`;
  ctx.textAlign = 'center';
  ctx.fillText('ImaKOL', config.width / 2, headerHeight / 2 + 10);
  
  // Add some placeholder content
  // Main area with some UI elements
  const contentStart = headerHeight + 20;
  
  // Draw some boxes to represent UI elements
  ctx.fillStyle = 'white';
  
  if (config.formFactor === 'narrow') {
    // Mobile layout - vertical arrangement
    for (let i = 0; i < 4; i++) {
      ctx.fillStyle = 'white';
      ctx.fillRect(20, contentStart + i * 110, config.width - 40, 100);
      
      // Add a small image placeholder in each box
      ctx.fillStyle = '#E9756B';
      ctx.fillRect(30, contentStart + 10 + i * 110, 80, 80);
      
      // Add some text lines
      ctx.fillStyle = '#333';
      ctx.font = '16px Arial';
      ctx.textAlign = 'left';
      ctx.fillText('Photo Title', 120, contentStart + 30 + i * 110);
      
      ctx.fillStyle = '#666';
      ctx.font = '14px Arial';
      ctx.fillText('Caption text for this amazing image...', 120, contentStart + 50 + i * 110);
    }
  } else {
    // Desktop layout - grid arrangement
    const itemWidth = 280;
    const itemHeight = 200;
    const itemsPerRow = 4;
    const rowGap = 20;
    
    for (let row = 0; row < 2; row++) {
      for (let col = 0; col < itemsPerRow; col++) {
        const x = 20 + col * (itemWidth + 20);
        const y = contentStart + row * (itemHeight + rowGap);
        
        // Item box
        ctx.fillStyle = 'white';
        ctx.fillRect(x, y, itemWidth, itemHeight);
        
        // Image placeholder
        ctx.fillStyle = '#E9756B';
        ctx.fillRect(x + 10, y + 10, itemWidth - 20, 120);
        
        // Text
        ctx.fillStyle = '#333';
        ctx.font = '16px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('Photo Title', x + 10, y + 150);
        
        ctx.fillStyle = '#666';
        ctx.font = '14px Arial';
        ctx.fillText('Caption text...', x + 10, y + 170);
      }
    }
  }
  
  // Add bottom navigation (for mobile)
  if (config.formFactor === 'narrow') {
    ctx.fillStyle = 'white';
    ctx.fillRect(0, config.height - 70, config.width, 70);
    
    // Nav items
    const navItems = ['Home', 'Search', 'Upload', 'Profile'];
    const itemWidth = config.width / navItems.length;
    
    navItems.forEach((item, index) => {
      // Icon placeholder
      ctx.fillStyle = index === 0 ? '#E9756B' : '#999';
      ctx.beginPath();
      ctx.arc(itemWidth * index + itemWidth / 2, config.height - 45, 12, 0, Math.PI * 2);
      ctx.fill();
      
      // Label
      ctx.fillStyle = index === 0 ? '#E9756B' : '#666';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(item, itemWidth * index + itemWidth / 2, config.height - 20);
    });
  }
  
  // Add watermark label
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.font = `14px Arial`;
  ctx.textAlign = 'center';
  ctx.fillText(`${config.label} - ${config.width}x${config.height}`, config.width / 2, config.height - 10);
  
  // Save the image to file
  const outputPath = path.join('screenshots', config.filename);
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(outputPath, buffer);
  
  console.log(`Saved screenshot to ${outputPath}`);
}

// Create all screenshots
screenshots.forEach(createScreenshot);

console.log('All PWA screenshots generated successfully!'); 