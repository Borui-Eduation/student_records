const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

/**
 * Generate PNG icons from the BORUI EDUCATION logo
 */
async function generateIcons() {
  try {
    // Source logo path - from project root
    const projectRoot = path.join(__dirname, '../../..');
    const sourcePath = path.join(projectRoot, 'boruieducationlogo.jpg');
    const publicDir = path.join(__dirname, '../public');

    // Check if source exists
    if (!fs.existsSync(sourcePath)) {
      console.error('❌ Source logo not found:', sourcePath);
      process.exit(1);
    }

    console.log('📦 Processing BORUI EDUCATION logo...');
    console.log('Source:', sourcePath);

    // Icon sizes needed
    const sizes = [
      { width: 180, height: 180, filename: 'icon-180x180.png' },
      { width: 167, height: 167, filename: 'icon-167x167.png' },
      { width: 192, height: 192, filename: 'icon-192x192.png' },
      { width: 512, height: 512, filename: 'icon-512x512.png' },
    ];

    // Generate each icon size
    for (const size of sizes) {
      const outputPath = path.join(publicDir, size.filename);
      
      await sharp(sourcePath)
        .resize(size.width, size.height, {
          fit: 'cover',
          position: 'center',
          background: { r: 255, g: 255, b: 255, alpha: 1 }
        })
        .png()
        .toFile(outputPath);

      console.log(`✅ Generated ${size.width}x${size.height} icon: ${size.filename}`);
    }

    console.log('\n✅ All icons generated successfully!');
    console.log('📍 Location:', publicDir);
    
  } catch (error) {
    console.error('❌ Error generating icons:', error.message);
    process.exit(1);
  }
}

generateIcons();
