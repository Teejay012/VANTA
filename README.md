# VANTA — Interactive Editorial Fashion Landing

A luxury, scroll-driven fashion landing page: a pinned runway sequence, a
staggered editorial reveal, a WebGL cloth that unrolls as you read it, and a
drag-to-rotate 3D wardrobe.

Monochrome throughout — matte black `#0a0a0a`, off-white `#f8f8f8`, light
neutral stone `#e8e6e1`, and nothing else.

## Running it

```bash
npm install
npm run dev     # http://localhost:3000
npm run build && npm start
```

Node 20+.

The first `dev` or `build` mirrors the imagery into `public/assets` (see
[Assets](#assets)); that step needs network access once, then never again.

## Stack

| Concern | Choice |
| --- | --- |
| Framework | Next.js 15 (App Router) + TypeScript |
| Styling | Tailwind CSS v4 (tokens in `app/globals.css` via `@theme`) |
| Scroll animation | GSAP + ScrollTrigger |
| Inertia scrolling | Lenis, driven from the GSAP ticker |
| 3D / canvas | three.js + @react-three/fiber + @react-three/drei |

## The four sections

### 1. Runway hero — `components/RunwayHero.tsx`

A 300vh scroll track with a `position: sticky` stage. Sticky is used instead of
ScrollTrigger's own `pin` so no pin-spacer is injected and the hand-off into
Section 2 has nothing to jump over.

The sequence is one scrubbed timeline of duration 100, so a tween's position on
the timeline reads directly as a scroll percentage:

| Scroll | Beat |
| --- | --- |
| 0 → 45% | the male model walks off to the right, footfall bob layered on |
| 45 → 50% | a beat — the runway light sweeps across an empty stage |
| 50 → 95% | the female model enters from the left and exits right |
| 95 → 100% | the stage dissolves and releases into Section 2 |

Both models are background-removed cutouts, layered between the oversized
`VANTA` wordmark and the foreground copy. Every floating text layer is
`pointer-events-none`; only the controls opt back in.

### 2. Editorial reveal — `components/CategoryGrid.tsx`

Two motions per card: a one-shot clip-path wipe staggered left-to-right as the
row enters, and a continuous parallax drift whose travel varies per column so
the row never flattens into one plane. Cards tilt toward the pointer
(`ui/TiltCard`) and their calls to action are magnetic (`ui/MagneticButton`,
built on `gsap.quickTo` so a mousemove does not allocate a tween per event).

### 3. Woven fabric canvas — `components/FabricSection.tsx`

A sticky full-bleed textile driven by a custom shader (`lib/shaders/cloth.ts`).
Scroll progress moves an *unroll frontier* from the top edge downward: above it
the cloth has dropped and lies flat, below it the fabric is still bunched, with
folds concentrated in a band at the frontier itself. Normals are derived
analytically from the displacement field, so the lighting stays correct as the
surface moves.

Scroll progress is written into a ref and read per frame — it never passes
through React state.

The campaign copy is `mix-blend-mode: multiply` over the cloth, so the fold
shading shows through the letterforms and the type reads as printed into the
textile rather than floating above it.

Two fallbacks: if the photographic weave cannot be fetched (offline, or a CDN
without permissive CORS), the shader's procedural warp/weft weave takes over;
if WebGL is unavailable entirely, the section renders the still image.

### 4. 3D wardrobe — `components/WardrobeSection.tsx`

Four pieces on a virtual rail. Drag anywhere on the canvas to spin the active
piece a full 360°; release and it keeps turning on inertia. Hovering runs a
*material inspection* — roughness drops and reflections come up, which is what
reads as leather sheen or fabric nap catching the light. Pagination glides the
camera along the rail rather than moving the pieces.

The silhouettes are built procedurally in three.js
(`components/wardrobe/GarmentMesh.tsx`), so the carousel has no asset payload
and loads instantly. Two details do the heavy lifting: each revolve is squashed
on Z, because real outerwear is much wider across the shoulders than it is
front-to-back, and each profile turns a hard corner at the shoulder instead of
rounding into a dome.

To load a real scanned asset instead, set `modelUrl` on a catalogue entry in
`lib/wardrobe.ts`. `components/wardrobe/GltfGarment.tsx` normalises the model's
scale, applies the house material, and falls back to the procedural silhouette
if the fetch fails.

## Assets

Every photograph is served by this site out of `public/assets`. The page makes
**no third-party image requests at runtime**.

The images were originally generated with Higgsfield. `npm run assets:sync`
mirrors them into the repo: it downloads each one, re-encodes it to a
sensibly-sized WebP, and writes it to `public/assets`. It reads its upstream
list from `scripts/asset-sources.json`, which is the only place a CDN URL
appears anywhere in the project.

```bash
npm run assets:sync             # fetch anything missing
npm run assets:sync -- --force  # re-download and re-encode everything
```

It runs automatically before `dev` and `build`, and short-circuits once the
files exist — so a checkout with `public/assets` committed builds offline.
`lib/assets.ts` maps each slot to its local path and is what the components
import.

The two hero models are background-removed cutouts, so their alpha channel is
encoded at full quality; flattening them would drop an opaque rectangle over
the wordmark they are layered against.

The optional wardrobe GLB is mirrored too, byte-for-byte rather than
re-encoded, so enabling it in `lib/wardrobe.ts` also stays local.

Components use plain `<img>` rather than `next/image`. These are fixed-slot
decorative images at known sizes, already optimised at mirror time, so the
optimiser has nothing left to add.

## Performance and accessibility

- Both WebGL scenes are `dynamic(..., { ssr: false })`, so three.js stays out of
  the first load (≈156 kB First Load JS for the page).
- DPR is capped at 2; uncapped device pixel ratio is wasted fill rate.
- Every scrubbed value that changes per frame lives in a ref, not state.
- `prefers-reduced-motion` disables Lenis and collapses CSS transitions.
- The wardrobe responds to arrow keys, and its controls are labelled.
- Layouts are fluid from 390px up.
