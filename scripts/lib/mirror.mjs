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
import { alignFrame, measureFrame, planSequence } from "./align.mjs";

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
 * Every file an asset produces.
 *
 * A `strip` asset is one downloaded sprite sheet that becomes N numbered
 * frames — the frames of a walk cycle travel as a single tiled image because a
 * presigned upload URL runs to ~2.4KB and a per-frame upload would not fit in
 * one command. Everything else produces exactly one file.
 */
export function outputNames(asset) {
  if (!asset.strip) return [outputName(asset)];
  return Array.from(
    { length: asset.strip.frames },
    (_, i) => `${asset.strip.prefix}-${String(i + 1).padStart(2, "0")}.webp`,
  );
}

/**
 * Cuts a tiled sprite sheet back into its frames, left to right then top to
 * bottom. The grid must divide the sheet exactly; it was written by the same
 * pipeline that reads it, so a mismatch means the wrong file was matched.
 */
export async function sliceStrip(buffer, strip, sharp) {
  const { width, height } = await sharp(buffer).metadata();
  const cols = strip.cols ?? strip.frames;
  const rows = strip.rows ?? 1;

  const tileWidth = Math.floor(width / cols);
  const tileHeight = Math.floor(height / rows);

  if (tileWidth < 1 || tileHeight < 1) {
    throw new Error(`sprite sheet ${width}x${height} cannot hold ${cols}x${rows} tiles`);
  }

  const frames = [];
  for (let i = 0; i < strip.frames; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    frames.push(
      await sharp(buffer)
        .extract({
          left: col * tileWidth,
          top: row * tileHeight,
          width: tileWidth,
          height: tileHeight,
        })
        .png()
        .toBuffer(),
    );
  }
  return frames;
}

/** Every source filename carries the generation's UUID — the stable part. */
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

/**
 * Groups the assets of a sequence (`align` in the manifest) so they can be
 * registered against one another. Everything else comes back under `null`,
 * meaning "encode independently".
 */
export function groupByAlignment(assets) {
  const groups = new Map();
  for (const asset of assets) {
    const key = asset.align ?? null;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(asset);
  }
  return groups;
}

/**
 * Encodes a whole frame sequence, stabilised against drift.
 *
 * Every frame is measured first, because the shared canvas and the scale can
 * only be chosen once the whole sequence is known — which is exactly why this
 * cannot be folded into the per-asset encode.
 */
export async function encodeSequence(items, sharp) {
  const sizes = [];
  const measurements = [];

  for (const { buffer } of items) {
    const meta = await sharp(buffer).metadata();
    sizes.push({ width: meta.width, height: meta.height });
    measurements.push(await measureFrame(buffer, sharp));
  }

  const targetHeight = items[0].asset.height ?? 1400;
  // Manifest opt-out for sources that do not drift (video-derived frames).
  const stabilise = items[0].asset.stabilise ?? 1;
  const plan = planSequence(measurements, {
    targetHeight,
    sourceSizes: sizes,
    stabilise,
  });

  const encoded = [];
  for (let i = 0; i < items.length; i++) {
    const { asset, buffer } = items[i];

    // A frame with nothing in it cannot be registered; fall back to a plain
    // encode rather than dropping it out of the cycle.
    if (!measurements[i]) {
      encoded.push(await encodeAsset(buffer, asset, sharp));
      continue;
    }

    const aligned = await alignFrame(buffer, measurements[i], plan, sizes[i], sharp, i);
    encoded.push(
      await sharp(aligned)
        .webp({ quality: asset.quality ?? 80, alphaQuality: 100, effort: 5 })
        .toBuffer(),
    );
  }

  return { encoded, plan };
}

/**
 * Turns one downloaded sprite sheet into its finished frames: slice, register
 * the sequence against itself, encode.
 */
export async function encodeStrip(asset, buffer, sharp) {
  const frames = await sliceStrip(buffer, asset.strip, sharp);
  const items = frames.map((frame) => ({ asset, buffer: frame }));
  return encodeSequence(items, sharp);
}
