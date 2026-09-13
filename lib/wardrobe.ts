/**
 * Wardrobe catalogue for Section 4.
 *
 * Each entry describes a garment silhouette that is built procedurally in
 * three.js (see GarmentMesh) plus the material it should be inspected in.
 * Building the geometry in-engine rather than shipping GLTF files keeps the
 * carousel dependency-free and instant to load; `modelUrl` is the escape hatch
 * for dropping in a real scanned asset later — GarmentMesh will prefer it and
 * fall back to the procedural silhouette if the file fails to load.
 */

export type GarmentSurface = "leather" | "fabric" | "metal";
export type GarmentSilhouette = "bomber" | "tote" | "trench" | "eyewear";

export type Garment = {
  id: string;
  name: string;
  category: string;
  price: string;
  /** One line of material copy, surfaced while the piece is being inspected. */
  material: string;
  silhouette: GarmentSilhouette;
  surface: GarmentSurface;
  /** Optional GLB. Leave undefined to use the procedural silhouette. */
  modelUrl?: string;
};

export const WARDROBE: Garment[] = [
  {
    id: "bomber",
    name: "OVERSIZED BOMBER",
    category: "OUTERWEAR",
    price: "$1,480",
    material: "Vegetable-tanned lambskin, matte finish, unlined body.",
    silhouette: "bomber",
    surface: "leather",
    // A mesh reconstructed from this piece's campaign still with Higgsfield's
    // image-to-3D model, mirrored into public/assets alongside the images.
    // Uncomment to load it instead of the procedural silhouette; GltfGarment
    // normalises its scale, applies the house material, and falls back to the
    // silhouette if the file is missing or fails to parse. Left off by default
    // because the source still is of a *folded* jacket, so the reconstruction
    // is a folded mass rather than a hanging garment — worth a look, not worth
    // being the default.
    // modelUrl: "/assets/garment-bomber.glb",
  },
  {
    id: "tote",
    name: "STRUCTURED TOTE",
    category: "ACCESSORIES",
    price: "$960",
    material: "Saddle-stitched calf leather over a rigid frame.",
    silhouette: "tote",
    surface: "leather",
  },
  {
    id: "trench",
    name: "TECHNICAL TRENCH",
    category: "OUTERWEAR",
    price: "$1,240",
    material: "Bonded nylon twill, 3-layer, taped seams.",
    silhouette: "trench",
    surface: "fabric",
  },
  {
    id: "eyewear",
    name: "ANGULAR EYEWEAR",
    category: "ACCESSORIES",
    price: "$420",
    material: "Milled titanium frame, smoke mineral lens.",
    silhouette: "eyewear",
    surface: "metal",
  },
];

/**
 * Base PBR values per surface. The hover state interpolates towards
 * `inspect` — roughness drops and reflections come up, which is what reads as
 * "leather sheen" or "fabric nap" catching the studio light.
 */
export const SURFACES: Record<
  GarmentSurface,
  {
    color: string;
    roughness: number;
    metalness: number;
    clearcoat: number;
    clearcoatRoughness: number;
    sheen: number;
    envMapIntensity: number;
    inspect: { roughness: number; envMapIntensity: number; clearcoat: number };
  }
> = {
  leather: {
    color: "#17161a",
    roughness: 0.46,
    metalness: 0.06,
    clearcoat: 0.55,
    clearcoatRoughness: 0.3,
    sheen: 0.2,
    envMapIntensity: 0.9,
    inspect: { roughness: 0.2, envMapIntensity: 1.9, clearcoat: 1 },
  },
  fabric: {
    color: "#27262a",
    roughness: 0.93,
    metalness: 0,
    clearcoat: 0.05,
    clearcoatRoughness: 0.8,
    sheen: 1,
    envMapIntensity: 0.55,
    inspect: { roughness: 0.72, envMapIntensity: 1.2, clearcoat: 0.2 },
  },
  metal: {
    color: "#c9c7c2",
    roughness: 0.24,
    metalness: 1,
    clearcoat: 0.3,
    clearcoatRoughness: 0.15,
    sheen: 0,
    envMapIntensity: 1.3,
    inspect: { roughness: 0.06, envMapIntensity: 2.6, clearcoat: 0.6 },
  },
};

/** Horizontal spacing between pieces on the virtual rail, in world units. */
export const RAIL_SPACING = 4.2;
