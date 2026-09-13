#!/usr/bin/env node
/**
 * Mirrors the site's imagery into public/assets.
 *
 * The photographs were generated with Higgsfield and originally lived on their
 * CDN. This script pulls each one down once, re-encodes it to a sensibly-sized
 * WebP, and writes it into the repo — after which the running site serves every
 * pixel itself and never makes a third-party request.
 *
 *   npm run assets:sync            mirror anything missing
 *   npm run assets:sync -- --force re-download and re-encode everything
 *
 * It runs automatically before `dev` and `build`. Once public/assets is
 * committed the script is a no-op, so those commands still work offline.
 *
 * `--allow-missing` downgrades a failure to a warning. `dev` uses it so a
 * flaky network cannot stop the dev server from starting; `build` does not,
 * because a production bundle with no imagery is just a broken deploy.
 */

import { createRequire } from "node:module";
import { mkdir, readFile, writeFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = path.join(ROOT, "public", "assets");

const force = process.argv.includes("--force");
const allowMissing = process.argv.includes("--allow-missing");

/** Terse, non-decorative logging — this runs inside `npm run build`. */
const log = (msg) => process.stdout.write(`[assets] ${msg}\n`);

async function exists(file) {
  try {
    const s = await stat(file);
    return s.size > 0;
  } catch {
    return false;
  }
}

async function main() {
  const manifest = JSON.parse(
    await readFile(path.join(ROOT, "scripts", "asset-sources.json"), "utf8"),
  );

  await mkdir(OUT_DIR, { recursive: true });

  // Work out what is actually missing before touching the network, so a fully
  // mirrored checkout never needs connectivity.
  const pending = [];
  for (const asset of manifest.assets) {
    // `raw` assets (the optional GLB) keep their own extension and are copied
    // byte-for-byte; everything else is re-encoded to WebP.
    const ext = asset.raw ? asset.ext : "webp";
    const out = path.join(OUT_DIR, `${asset.name}.${ext}`);
    if (!force && (await exists(out))) continue;
    pending.push({ ...asset, out });
  }

  if (pending.length === 0) {
    log(`all ${manifest.assets.length} assets present — nothing to do`);
    return;
  }

  // sharp is a devDependency, and only the images need it. Without it we could
  // still save the originals, but they are multi-megabyte PNGs and the app
  // references .webp, so bail loudly rather than write files it cannot use.
  let sharp;
  if (pending.some((asset) => !asset.raw)) {
    try {
      sharp = require("sharp");
    } catch {
      throw new Error(
        "sharp is required to encode the images. Run `npm install` first.",
      );
    }
  }

  log(`mirroring ${pending.length} asset(s) into public/assets`);

  for (const asset of pending) {
    const url = `${manifest.cdn}/${asset.file}`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`${asset.name}: ${response.status} fetching ${url}`);
    }
    const original = Buffer.from(await response.arrayBuffer());

    if (asset.raw) {
      await writeFile(asset.out, original);
      const size = (original.length / 1024 / 1024).toFixed(1);
      log(`${path.basename(asset.out)}  ${size}MB (copied)`);
      continue;
    }

    let pipeline = sharp(original).resize({
      width: asset.width,
      height: asset.height,
      fit: "inside",
      withoutEnlargement: true,
    });

    pipeline = pipeline.webp({
      quality: asset.quality ?? 80,
      // The two hero cutouts carry the models' alpha channel; losing it would
      // put a rectangle of background over the wordmark behind them.
      alphaQuality: asset.alpha ? 100 : 80,
      effort: 5,
    });

    const encoded = await pipeline.toBuffer();
    await writeFile(asset.out, encoded);

    const from = (original.length / 1024 / 1024).toFixed(1);
    const to = (encoded.length / 1024).toFixed(0);
    log(`${asset.name}.webp  ${from}MB -> ${to}KB`);
  }

  log("done — commit public/assets so the site stops depending on the CDN");
}

main().catch((error) => {
  console.error(`[assets] ${error.message}`);
  console.error(
    "[assets] The site needs these files in public/assets to render. " +
      "Re-run `npm run assets:sync` from a machine with network access.",
  );
  // Under --allow-missing the caller has said it would rather start without
  // imagery than not start at all.
  process.exit(allowMissing ? 0 : 1);
});
