/**
 * Shared plumbing for the two ways imagery gets into public/assets:
 * `sync-assets.mjs` (download from the CDN) and `import-assets.mjs` (pick up
 * files you downloaded by hand). Both must produce byte-identical output, so
 * the naming and the encode live here rather than in either script.
 */

import { createRequire } from "node:module";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);

export const ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
);
export const OUT_DIR = path.join(ROOT, "public", "assets");

/** The filename an asset must land on for lib/assets.ts to find it. */
export const outputName = (asset) =>
  `${asset.name}.${asset.raw ? asset.ext : "webp"}`;

/**
 * Every source filename carries the generation's UUID — the stable part, which
 * survives a browser renaming the download or changing its case.
 */
export const uuidOf = (filename) =>
  filename.match(
    /([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i,
  )?.[1]?.toLowerCase() ?? null;

export async function loadManifest() {
  return JSON.parse(
    await readFile(path.join(ROOT, "scripts", "asset-sources.json"), "utf8"),
  );
}

export const sourceUrl = (manifest, asset) =>
  asset.url ?? `${manifest.cdn}/${asset.file}`;

export async function exists(file) {
  try {
    return (await stat(file)).size > 0;
  } catch {
    return false;
  }
}

export function loadSharp() {
  try {
    return require("sharp");
  } catch {
    throw new Error(
      "sharp is required to encode the images. Run `npm install` first.",
    );
  }
}

/**
 * Re-encodes one source image to the size and format the site expects.
 * `raw` assets are passed through untouched.
 */
export async function encodeAsset(original, asset, sharp) {
  if (asset.raw) return original;

  return sharp(original)
    .resize({
      width: asset.width,
      height: asset.height,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({
      quality: asset.quality ?? 80,
      // The hero cutouts carry the models' alpha channel; losing it would put
      // an opaque rectangle over the wordmark behind them.
      alphaQuality: asset.alpha ? 100 : 80,
      effort: 5,
    })
    .toBuffer();
}
