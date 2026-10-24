// Downloads CC0 material textures from Poly Haven and converts them to compact WebP.
// Usage: node scripts/fetch-textures.mjs
import { mkdir, writeFile, access } from "node:fs/promises";
import sharp from "sharp";

const OUT = "public/textures";
const SIZE = 1024;

// id in our material library → Poly Haven asset id
const SETS = {
  oak: "oak_veneer_01",
  walnut: "natural_walnut_veneer",
  ash: "ash_veneer",
  "black-oak": "black_oak_veneer",
  boucle: "terry_cloth",
  linen: "rough_linen",
  velvet: "velour_velvet",
  leather: "fabric_leather_02",
};

// Poly Haven map name → our suffix
const MAPS = { Diffuse: "diff", nor_gl: "nor", arm: "arm" };

const exists = (p) => access(p).then(() => true, () => false);

async function fetchSet(key, id) {
  const files = await (await fetch(`https://api.polyhaven.com/files/${id}`)).json();
  for (const [map, suffix] of Object.entries(MAPS)) {
    const out = `${OUT}/${key}_${suffix}.webp`;
    if (await exists(out)) continue;
    const url = files[map]?.["1k"]?.jpg?.url ?? files[map]?.["1k"]?.png?.url;
    if (!url) throw new Error(`${id}: no 1k ${map}`);
    const buf = Buffer.from(await (await fetch(url)).arrayBuffer());
    await writeFile(
      out,
      await sharp(buf)
        .resize(SIZE, SIZE)
        .webp({ quality: suffix === "diff" ? 80 : 72, effort: 6 })
        .toBuffer()
    );
    console.log("✓", out);
  }
}

await mkdir(OUT, { recursive: true });
for (const [key, id] of Object.entries(SETS)) await fetchSet(key, id);
