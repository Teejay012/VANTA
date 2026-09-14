#!/usr/bin/env node
/**
 * Prints every source URL with the filename it must end up as.
 *
 *   npm run assets:list              human-readable table
 *   npm run assets:list -- --urls    bare URLs, one per line
 *
 * The bare list is meant to be piped into a downloader, e.g.
 *   npm run assets:list -- --urls > urls.txt && xargs -n1 curl -O < urls.txt
 *
 * You do not need to rename anything afterwards — `assets:import` matches on
 * the id inside each filename.
 */

import { loadManifest, outputName, sourceUrl } from "./lib/mirror.mjs";

// Piping into `head` closes stdout early; without this the process dies with
// an unhandled EPIPE instead of simply stopping.
process.stdout.on("error", (error) => {
  if (error.code === "EPIPE") process.exit(0);
  throw error;
});

const urlsOnly = process.argv.includes("--urls");

const manifest = await loadManifest();

if (urlsOnly) {
  for (const asset of manifest.assets) {
    process.stdout.write(sourceUrl(manifest, asset) + "\n");
  }
} else {
  process.stdout.write(`${manifest.assets.length} assets\n\n`);
  for (const asset of manifest.assets) {
    process.stdout.write(
      `${outputName(asset).padEnd(28)} ${sourceUrl(manifest, asset)}\n`,
    );
  }
}
