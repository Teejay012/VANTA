#!/usr/bin/env node
/**
 * Mirrors the site's imagery into public/assets by downloading it.
 *
 *   npm run assets:sync            mirror anything missing
 *   npm run assets:sync -- --force re-download and re-encode everything
 *
 * If you would rather fetch the files yourself, `npm run assets:list` prints
 * every URL and `npm run assets:import` picks the downloads up from a folder —
 * both produce byte-identical results, since the naming and the encode are
 * shared in ./lib/mirror.mjs.
 *
 * This runs automatically before `dev` and `build`, and short-circuits once
 * the files exist, so a checkout with public/assets committed works offline.
 *
 * `--allow-missing` downgrades a failure to a warning. `dev` uses it so a
 * flaky network cannot stop the dev server from starting; `build` does not,
 * because a production bundle with no imagery is just a broken deploy.
 */

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  OUT_DIR,
  encodeAsset,
  exists,
  loadManifest,
  loadSharp,
  outputName,
  sourceUrl,
} from "./lib/mirror.mjs";

const force = process.argv.includes("--force");
const allowMissing = process.argv.includes("--allow-missing");

const log = (msg) => process.stdout.write(`[assets] ${msg}\n`);

async function main() {
  const manifest = await loadManifest();
  await mkdir(OUT_DIR, { recursive: true });

  // Work out what is missing before touching the network, so a fully mirrored
  // checkout never needs connectivity.
  const pending = [];
  for (const asset of manifest.assets) {
    const out = path.join(OUT_DIR, outputName(asset));
    if (!force && (await exists(out))) continue;
    pending.push({ ...asset, out });
  }

  if (pending.length === 0) {
    log(`all ${manifest.assets.length} assets present — nothing to do`);
    return;
  }

  // Only the images need sharp; a `raw` passthrough does not.
  const sharp = pending.some((asset) => !asset.raw) ? loadSharp() : null;

  log(`mirroring ${pending.length} asset(s) into public/assets`);

  for (const asset of pending) {
    const url = sourceUrl(manifest, asset);

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`${asset.name}: ${response.status} fetching ${url}`);
    }
    const original = Buffer.from(await response.arrayBuffer());
    const encoded = await encodeAsset(original, asset, sharp);
    await writeFile(asset.out, encoded);

    const from = (original.length / 1024 / 1024).toFixed(1);
    const to = (encoded.length / 1024).toFixed(0);
    log(`${outputName(asset)}  ${from}MB -> ${to}KB`);
  }

  log("done — commit public/assets so the site stops depending on the CDN");
}

main().catch((error) => {
  console.error(`[assets] ${error.message}`);
  console.error(
    "[assets] The site needs these files in public/assets to render. Either " +
      "re-run `npm run assets:sync` with network access, or download them " +
      "yourself (`npm run assets:list`) and run `npm run assets:import -- <folder>`.",
  );
  // Under --allow-missing the caller has said it would rather start without
  // imagery than not start at all.
  process.exit(allowMissing ? 0 : 1);
});
