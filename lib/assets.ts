/**
 * Central asset manifest.
 *
 * Every path here is served by this site out of `public/assets` — the page
 * makes no third-party image requests at runtime.
 *
 * The files are mirrored into the repo by `npm run assets:sync`, which reads
 * its upstream list from `scripts/asset-sources.json` and re-encodes each
 * image to WebP. That script runs automatically before `dev` and `build`, and
 * is a no-op once `public/assets` is populated.
 */

/** Builds a numbered frame sequence: prefix-01.webp … prefix-0N.webp */
const sequence = (prefix: string, count: number) =>
  Array.from(
    { length: count },
    (_, i) => `/assets/${prefix}-${String(i + 1).padStart(2, "0")}.webp`,
  );

export const ASSETS = {
  /**
   * Hero — twenty frames lifted from one continuous walk, matted and
   * registered against each other so the figure does not drift between them.
   * Scroll drives both the traverse and the stride, so the models walk rather
   * than slide.
   */
  heroMaleFrames: sequence("walk-male", 20),
  heroFemaleFrames: sequence("walk-female", 20),

  /** Section 2 — category cards. */
  categoryMen: "/assets/category-men.webp",
  categoryWomen: "/assets/category-women.webp",
  categoryKids: "/assets/category-kids.webp",
  categoryAccessories: "/assets/category-accessories.webp",

  /** Section 3 — woven technical nylon, used as the cloth shader's albedo map. */
  fabric: "/assets/fabric.webp",

  /** Section 5 — the closing campaign spread. */
  editorial: "/assets/editorial.webp",
  editorialPortrait: "/assets/editorial-portrait.webp",
} as const;

export type AssetKey = keyof typeof ASSETS;
