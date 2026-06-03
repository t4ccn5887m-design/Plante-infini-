import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const svg = readFileSync(join(root, "public/icon.svg"));

async function png(size, name) {
  await sharp(svg).resize(size, size).png({ compressionLevel: 9 }).toFile(join(root, "public", name));
}

await png(192, "icon-192.png");
await png(512, "icon-512.png");
await sharp(svg).resize(32, 32).png().toFile(join(root, "public/favicon-32.png"));
console.log("Generated icon-192.png, icon-512.png, favicon-32.png");
