import sharp from 'sharp';
import { readdirSync, statSync } from 'fs';
import { join, basename, extname } from 'path';

const inputDir = './src/images/cards';
const outputDir = './public/cards';

const files = readdirSync(inputDir).filter(f => /\.(jpg|jpeg|png)$/i.test(f));

let totalBefore = 0;
let totalAfter = 0;

for (const file of files) {
  const inputPath = join(inputDir, file);
  const name = basename(file, extname(file));
  const outputPath = join(outputDir, `${name}.webp`);

  const before = statSync(inputPath).size;
  totalBefore += before;

  await sharp(inputPath)
    .webp({ quality: 75 })
    .toFile(outputPath);

  const after = statSync(outputPath).size;
  totalAfter += after;

  console.log(`${file} → ${name}.webp  ${(before/1024/1024).toFixed(1)}MB → ${(after/1024).toFixed(0)}KB`);
}

console.log(`\nTotal: ${(totalBefore/1024/1024).toFixed(1)}MB → ${(totalAfter/1024/1024).toFixed(1)}MB (saved ${((1 - totalAfter/totalBefore)*100).toFixed(0)}%)`);
