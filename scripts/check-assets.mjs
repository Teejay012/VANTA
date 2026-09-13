#!/usr/bin/env node
/**
 * Audits public/assets against the manifest.
 *
 *   npm run assets:check          report only
 *   npm run assets:check -- --fix delete the strays
 *
 * Two things go wrong in practice, and both are invisible until something
 * looks broken: a downloaded original gets left behind next to the WebP it was
 * converted into (they are multi-megabyte and must never be committed), and a
 * file the site no longer references lingers from an older manifest.
 */

import { readdir, unlink } from "node:fs/promises";
import path from "node:path";
import { OUT_DIR, loadManifest, outputNames } from "./lib/mirror.mjs";

const fix = process.argv.includes("--fix");
const log = (msg) => process.stdout.write(`[check] ${msg}\n`);

const manifest = await loadManifest();
const expected = new Set(manifest.assets.flatMap(outputNames));

let present;
try {
  present = await readdir(OUT_DIR);
} catch {
  log("public/assets does not exist — run `npm run assets:sync`");
  process.exit(1);
}

const extra = present.filter((file) => !expected.has(file));
const missing = [...expected].filter((file) => !present.includes(file));

log(`${expected.size} expected, ${present.length} present`);

if (missing.length) {
  log(`MISSING ${missing.length} — the site will show placeholders for these:`);
  for (const file of missing) process.stdout.write(`  ${file}\n`);
}

if (extra.length) {
  log(
    `${fix ? "REMOVING" : "UNEXPECTED"} ${extra.length} file(s) not referenced by the site:`,
  );
  for (const file of extra) {
    process.stdout.write(`  ${file}\n`);
    if (fix) await unlink(path.join(OUT_DIR, file));
  }
  if (!fix) log("re-run with --fix to delete them");
}

if (!extra.length && !missing.length) log("clean — public/assets matches the manifest exactly");

process.exit(missing.length || (extra.length && !fix) ? 1 : 0);
