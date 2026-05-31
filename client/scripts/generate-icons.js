import sharp from 'sharp';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = resolve(__dirname, '..', 'public');

const sizes = {
  'icon-192x192.png': 192,
  'icon-512x512.png': 512,
  'apple-touch-icon.png': 180,
  'maskable-icon.png': 512,
};

async function generateIcons() {
  for (const [filename, size] of Object.entries(sizes)) {
    const svgFilename = filename.replace('.png', '.svg');
    const svgPath = resolve(publicDir, svgFilename);
    const svgContent = readFileSync(svgPath);
    
    await sharp(svgContent)
      .resize(size, size)
      .png()
      .toFile(resolve(publicDir, filename));
    
    console.log(`✓ Generated ${filename} (${size}×${size})`);
  }
}

generateIcons().catch(console.error);
