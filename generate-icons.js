const fs = require('fs');
const { createCanvas, loadImage } = require('canvas');
const path = require('path');

// Make sure the icons directory exists
if (!fs.existsSync('icons')) {
  fs.mkdirSync('icons');
}

// The icon sizes needed for a PWA
const sizes = [192, 512];

async function generateIcons() {
  try {
    // Load the icon image (assuming it's saved as app-icon.png in the root directory)
    // Note: You need to save the attached image as app-icon.png
    const image = await loadImage('app-icon.png');
    
    // Generate icons for each size
    for (const size of sizes) {
      const canvas = createCanvas(size, size);
      const ctx = canvas.getContext('2d');
      
      // Draw the image on the canvas
      ctx.drawImage(image, 0, 0, size, size);
      
      // Save the resized image
      const buffer = canvas.toBuffer('image/png');
      fs.writeFileSync(path.join('icons', `icon-${size}x${size}.png`), buffer);
      
      console.log(`Generated icon: ${size}x${size}`);
    }
    
    console.log('All PWA icons generated successfully!');
  } catch (error) {
    console.error('Error generating icons:', error);
  }
}

generateIcons(); 