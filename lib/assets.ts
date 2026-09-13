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
  /** Hero — male model, background removed so he can be layered mid-ground. */
  heroMale: "/assets/hero-male.webp",
  /** Hero — female model, background removed. */
  heroFemale: "/assets/hero-female.webp",

  /** Section 2 — category cards. */
  categoryMen: "/assets/category-men.webp",
  categoryWomen: "/assets/category-women.webp",
  categoryKids: "/assets/category-kids.webp",
  categoryAccessories: "/assets/category-accessories.webp",

  /** Section 3 — woven technical nylon, used as the cloth shader's albedo map. */
  fabric: "/assets/fabric.webp",
  /** Section 3 — campaign still used behind the drape. */
  editorial: "/assets/editorial.webp",

  /** Section 4 — flat references for the 3D wardrobe items. */
  garmentJacket: "/assets/garment-jacket.webp",
  garmentBag: "/assets/garment-bag.webp",
} as const;

export type AssetKey = keyof typeof ASSETS;
