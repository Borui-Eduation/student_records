#!/usr/bin/env node

/**
 * Generate PWA icons from SVG
 * This script creates PNG icons from the SVG icon file
 */

const fs = require('fs')
const path = require('path')

// Simple icon generation - creates solid color PNG files
// For production, consider using a proper image library like sharp

const sizes = [192, 512]
const publicDir = path.join(__dirname, '../apps/web/public')

// Create simple PNG files (1x1 pixel, can be replaced with proper images)
sizes.forEach((size) => {
  const filename = `icon-${size}x${size}.png`
  const filepath = path.join(publicDir, filename)
  
  // Create a simple PNG header for a black square
  // This is a minimal valid PNG file (1x1 black pixel)
  // For production, use a proper image library
  const pngHeader = Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, // PNG signature
    0x00, 0x00, 0x00, 0x0d, // IHDR chunk size
    0x49, 0x48, 0x44, 0x52, // IHDR
    0x00, 0x00, 0x00, 0x01, // width: 1
    0x00, 0x00, 0x00, 0x01, // height: 1
    0x08, 0x02, 0x00, 0x00, 0x00, // bit depth, color type, etc.
    0x90, 0x77, 0x53, 0xde, // CRC
    0x00, 0x00, 0x00, 0x0c, // IDAT chunk size
    0x49, 0x44, 0x41, 0x54, // IDAT
    0x08, 0x99, 0x01, 0x01, 0x00, 0x00, 0xfe, 0xff,
    0x00, 0x00, 0x00, 0x02, 0x00, 0x01, // data
    0x49, 0xb4, 0xe8, 0xb7, // CRC
    0x00, 0x00, 0x00, 0x00, // IEND chunk size
    0x49, 0x45, 0x4e, 0x44, // IEND
    0xae, 0x42, 0x60, 0x82, // CRC
  ])
  
  fs.writeFileSync(filepath, pngHeader)
  console.log(`✓ Generated ${filename}`)
})

console.log('\n✓ Icons generated successfully!')
console.log('Note: These are placeholder icons. For production, replace with proper images.')
console.log('You can use tools like:')
console.log('  - ImageMagick: convert icon.svg -resize 192x192 icon-192x192.png')
console.log('  - Sharp (Node.js): npm install sharp')
console.log('  - Online tools: https://convertio.co/svg-png/')

