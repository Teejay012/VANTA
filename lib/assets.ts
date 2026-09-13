/**
 * Central asset manifest.
 *
 * Every image below was generated with Higgsfield and is served from their CDN.
 * Keeping the URLs in one module means the whole site can be pointed at a
 * self-hosted mirror by editing `CDN` (or by running `npm run assets:sync`,
 * which mirrors the same files into /public/assets and lets you swap `CDN`
 * for an empty string).
 */

const CDN =
  "https://d8j0ntlcm91z4.cloudfront.net/user_3E4aC5gSRF4DinvQCUJBbOppkSB";

export const ASSETS = {
  /** Hero — male model, background removed so he can be layered mid-ground. */
  heroMale: `${CDN}/hf_20260913_134025_547c2409-30b7-45e1-a7c0-8f3a8f885043.png`,
  /** Hero — female model, background removed. */
  heroFemale: `${CDN}/hf_20260913_134129_961cc757-135f-429f-843a-d7a4906b0f79.png`,

  /** Section 2 — category cards. */
  categoryMen: `${CDN}/hf_20260913_133910_2ee88d72-1556-4267-b187-51a86a87bbea.png`,
  categoryWomen: `${CDN}/hf_20260913_133910_ecb50a50-08e8-4da9-a0c9-529f1cf998d3.png`,
  categoryKids: `${CDN}/hf_20260913_133910_e0b4d92c-2c2d-4322-a58c-d7b389a638bf.png`,
  categoryAccessories: `${CDN}/hf_20260913_133910_0df692a7-bbdc-4f8e-a8f9-e8e35d167b47.png`,

  /** Section 3 — woven technical nylon, used as the cloth shader's albedo map. */
  fabric: `${CDN}/hf_20260913_133910_026b6734-925a-4781-8e86-5f2792895f71.png`,
  /** Section 3 — campaign still used behind the drape. */
  editorial: `${CDN}/hf_20260913_133910_dfca8048-db99-44b5-bc06-8f0616edc9fc.png`,

  /** Section 4 — flat references for the 3D wardrobe items. */
  garmentJacket: `${CDN}/hf_20260913_133910_93928abb-d69b-4a10-872b-466d03045787.png`,
  garmentBag: `${CDN}/hf_20260913_133910_97415d8e-1430-49c2-a32f-6a24b680de12.png`,
} as const;

export type AssetKey = keyof typeof ASSETS;
