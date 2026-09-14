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

export const ASSETS = {
  /**
   * Hero — looping animated cutouts. Each is a matted clip of the model
   * walking on the spot, cut at a pose-matched frame so the loop is seamless,
   * and it plays at its own cadence. Scroll moves them across the stage but
   * does not drive the gait; see components/hero/WalkingModel.tsx.
   */
  heroMaleWalk: "/assets/walk-male.webp",
  heroFemaleWalk: "/assets/walk-female.webp",

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
