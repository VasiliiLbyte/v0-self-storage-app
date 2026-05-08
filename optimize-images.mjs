import { readFileSync, writeFileSync, statSync } from 'fs';
import { execSync } from 'child_process';

const src = './images/pantone_1505_xgc_pelican_logo.png';
const stat = statSync(src);
console.log('Source PNG size:', Math.round(stat.size / 1024), 'KB');

try {
  const sharp = (await import('sharp')).default;

  // 400x400 для общего использования
  await sharp(src)
    .resize(400, 400, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ compressionLevel: 9 })
    .toFile('./public/images/pelican_400.png');

  // 80x80 для хедера/фавикона
  await sharp(src)
    .resize(80, 80, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ compressionLevel: 9 })
    .toFile('./public/images/pelican_80.png');

  // WebP версия (лучшее сжатие)
  await sharp(src)
    .resize(400, 400, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .webp({ quality: 85 })
    .toFile('./public/images/pelican_400.webp');

  const s1 = statSync('./public/images/pelican_400.png').size;
  const s2 = statSync('./public/images/pelican_80.png').size;
  const s3 = statSync('./public/images/pelican_400.webp').size;

  console.log('pelican_400.png:', Math.round(s1 / 1024), 'KB');
  console.log('pelican_80.png:', Math.round(s2 / 1024), 'KB');
  console.log('pelican_400.webp:', Math.round(s3 / 1024), 'KB');
  console.log('Done!');
} catch (e) {
  console.log('sharp not available:', e.message);
  console.log('Try: npm install sharp');
}
