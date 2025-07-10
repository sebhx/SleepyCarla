#!/usr/bin/env node

/**
 * PWA Icon Generator Script
 * Creates placeholder PWA icons for SleepyCarla
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🎨 Generating PWA icons for SleepyCarla...');

// SVG template for PWA icons
const createSVGIcon = (size, emoji = '🌙') => `
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" fill="#FFB6C1" rx="20"/>
  <text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle" font-size="${size * 0.6}" font-family="Arial, sans-serif">
    ${emoji}
  </text>
</svg>`;

// Icon sizes needed for PWA
const iconSizes = [64, 192, 512];
const publicDir = path.join(__dirname, '..', 'public');

// Create icons
iconSizes.forEach(size => {
  const svgContent = createSVGIcon(size);
  const filename = `pwa-${size}x${size}.svg`;
  const filePath = path.join(publicDir, filename);
  
  fs.writeFileSync(filePath, svgContent);
  console.log(`✅ Created ${filename}`);
});

// Create Apple Touch Icons
const appleSizes = [180];
appleSizes.forEach(size => {
  const svgContent = createSVGIcon(size);
  const filename = `apple-touch-icon.svg`;
  const filePath = path.join(publicDir, filename);
  
  fs.writeFileSync(filePath, svgContent);
  console.log(`✅ Created ${filename}`);
});

// Create basic manifest screenshot placeholder
const screenshotSVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="640" height="1136" viewBox="0 0 640 1136">
  <rect width="640" height="1136" fill="#FFF8F8"/>
  <rect x="50" y="100" width="540" height="936" fill="#FFB6C1" rx="20"/>
  <text x="320" y="300" text-anchor="middle" font-size="48" font-family="Arial, sans-serif" fill="white">
    SleepyCarla
  </text>
  <text x="320" y="370" text-anchor="middle" font-size="24" font-family="Arial, sans-serif" fill="white">
    Baby Sleep Tracker
  </text>
  <text x="320" y="600" text-anchor="middle" font-size="120" font-family="Arial, sans-serif">
    🌙
  </text>
</svg>`;

fs.writeFileSync(path.join(publicDir, 'screenshot-mobile.svg'), screenshotSVG);
console.log('✅ Created screenshot-mobile.svg');

console.log('\n🎉 PWA icons generated successfully!');
console.log('📝 Note: For production, consider creating proper PNG icons using a tool like Figma or Adobe Illustrator');
