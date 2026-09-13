/**
 * Wardrobe catalogue for Section 4.
 *
 * Each piece is a photographic 360° turntable: eight views shot at 45°
 * intervals, which the Turntable component scrubs through as you drag. Real
 * photography rather than approximated geometry — a luxury viewer sells the
 * cut and the material, and nothing models leather like a photograph of
 * leather. It also costs no WebGL context, which is what keeps the section
 * usable on a phone.
 */

export type Garment = {
  id: string;
  name: string;
  category: string;
  price: string;
  /** One line of material copy, surfaced while the piece is being inspected. */
  material: string;
  /** Eight views, 45° apart, in clockwise order starting front-on. */
  frames: readonly string[];
};

/** Builds the eight frame paths for a turntable. */
const turntable = (id: string) =>
  Array.from({ length: 8 }, (_, i) => `/assets/spin-${id}-0${i + 1}.webp`);

export const WARDROBE: readonly Garment[] = [
  {
    id: "bomber",
    name: "LEATHER BIKER",
    category: "OUTERWEAR",
    price: "$1,480",
    material: "Vegetable-tanned lambskin, matte finish, unlined body.",
    frames: turntable("bomber"),
  },
  {
    id: "trench",
    name: "BELTED TRENCH",
    category: "OUTERWEAR",
    price: "$1,240",
    material: "Charcoal wool twill, self belt, storm-flap shoulder.",
    frames: turntable("trench"),
  },
  {
    id: "tote",
    name: "STRUCTURED TOTE",
    category: "ACCESSORIES",
    price: "$960",
    material: "Saddle-stitched calf leather over a rigid frame.",
    frames: turntable("tote"),
  },
  {
    id: "boot",
    name: "BLOCK-HEEL BOOT",
    category: "FOOTWEAR",
    price: "$720",
    material: "Polished calf leather, sculpted heel, leather sole.",
    frames: turntable("boot"),
  },
];
