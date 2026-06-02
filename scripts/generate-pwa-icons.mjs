import { readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, "..", "public");
const svg = readFileSync(join(publicDir, "icon.svg"));

for (const size of [192, 512]) {
  const png = await sharp(svg).resize(size, size).png().toBuffer();
  writeFileSync(join(publicDir, `icon-${size}.png`), png);
  console.log(`Created icon-${size}.png`);
}
