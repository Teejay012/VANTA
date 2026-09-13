#!/usr/bin/env node
/**
 * Imports imagery you downloaded by hand into public/assets.
 *
 *   npm run assets:import -- ~/Downloads/vanta-images
 *
 * Point it at the folder you unzipped. It finds each file by the generation
 * UUID embedded in its name, so it does not care what the files are called,
 * what order they are in, how deeply they are nested, or whether your browser
 * appended "(1)" to a few of them. Each match is renamed and re-encoded to
 * exactly what lib/assets.ts expects.
 *
 * Anything it cannot find is listed at the end with its download URL, so a
 * partial download just needs a second pass rather than starting over.
 *
 *   --force   re-encode assets that are already present
 *   --dry     report what would happen, write nothing
 */

import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  OUT_DIR,
  encodeAsset,
  exists,
  loadManifest,
  loadSharp,
  outputName,
  sourceUrl,
  uuidOf,
} from "./lib/mirror.mjs";

const args = process.argv.slice(2);
const force = args.includes("--force");
const dry = args.includes("--dry");
const sourceDir = args.find((a) => !a.startsWith("--"));

const log = (msg) => process.stdout.write(`[import] ${msg}\n`);

/** Every file under `dir`, indexed by the UUID in its filename. */
async function indexByUuid(dir) {
  const index = new Map();

  async function walk(current) {
    let entries;
    try {
      entries = await readdir(current, { withFileTypes: true });
    } catch {
      return; // unreadable directory — skip rather than abort the import
    }
    for (const entry of entries) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) {
        await walk(full);
        continue;
      }
      const uuid = uuidOf(entry.name);
      // First match wins, so a duplicate download does not clobber the file
      // that was found first.
      if (uuid && !index.has(uuid)) index.set(uuid, full);
    }
  }

  await walk(dir);
  return index;
}

async function main() {
  if (!sourceDir) {
    throw new Error(
      "Pass the folder holding the downloaded images, e.g.\n" +
        "  npm run assets:import -- ~/Downloads/vanta-images",
    );
  }

  const manifest = await loadManifest();
  const index = await indexByUuid(path.resolve(sourceDir));
  log(`scanned ${sourceDir} — ${index.size} file(s) with a recognisable id`);

  if (index.size === 0) {
    throw new Error(
      "Nothing in that folder looks like a generated image. Unzip the archive " +
        "first and point this at the unzipped folder.",
    );
  }

  const sharp = loadSharp();
  await mkdir(OUT_DIR, { recursive: true });

  const missing = [];
  let written = 0;
  let skipped = 0;

  for (const asset of manifest.assets) {
    const out = path.join(OUT_DIR, outputName(asset));

    if (!force && (await exists(out))) {
      skipped++;
      continue;
    }

    const uuid = uuidOf(asset.file);
    const found = uuid ? index.get(uuid) : null;
    if (!found) {
      missing.push(asset);
      continue;
    }

    const original = await readFile(found);
    const encoded = await encodeAsset(original, asset, sharp);

    if (!dry) await writeFile(out, encoded);
    written++;

    const from = (original.length / 1024 / 1024).toFixed(1);
    const to = (encoded.length / 1024).toFixed(0);
    log(`${outputName(asset)}  ${from}MB -> ${to}KB  (${path.basename(found)})`);
  }

  log(
    `${dry ? "would write" : "wrote"} ${written}, already present ${skipped}, missing ${missing.length}`,
  );

  if (missing.length) {
    log("still missing — download these and run the import again:");
    for (const asset of missing) {
      process.stdout.write(
        `  ${outputName(asset).padEnd(26)} ${sourceUrl(manifest, asset)}\n`,
      );
    }
    process.exitCode = 1;
    return;
  }

  log("complete — commit public/assets and the site is fully self-hosted");
}

main().catch((error) => {
  console.error(`[import] ${error.message}`);
  process.exit(1);
});
