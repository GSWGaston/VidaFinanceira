import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const source = await readFile(
  new URL("../public/Símbolo.svg", import.meta.url),
  "utf8",
);
const paths = source.replace(/^<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "");
const icon = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="112" fill="#FFF8F6"/>
  <svg x="56" y="148" width="400" height="216" viewBox="0 0 562 304">${paths}</svg>
</svg>`;

await writeFile(new URL("../public/icon.svg", import.meta.url), icon);
for (const size of [192, 512]) {
  await sharp(Buffer.from(icon))
    .resize(size, size)
    .png()
    .toFile(
      fileURLToPath(
        new URL(`../public/icons/icon-${size}.png`, import.meta.url),
      ),
    );
}
