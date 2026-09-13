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
| WebGL | three.js + @react-three/fiber (the cloth shader only) |

## The sections

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

Each model is a **six-frame walk cycle**, not a single still. The scrubbed
timeline drives the traverse, and `onUpdate` drives the stride from the same
smoothed progress — so the legs pass, the weight drops, and the feet stay in
step with the body however fast you scroll. Frames are stacked and switched by
`visibility`, so a step costs no decode.

All twelve frames are background-removed cutouts, layered between the oversized
`VANTA` wordmark and the foreground copy. Every floating text layer is
`pointer-events-none`; only the controls opt back in.

### 2. Editorial reveal — `components/CategoryGrid.tsx`

Two motions per card: a one-shot clip-path wipe staggered left-to-right as the
row enters, and a continuous parallax drift whose travel varies per column so
the row never flattens into one plane. Cards tilt toward the pointer
(`ui/TiltCard`) and their calls to action are magnetic (`ui/MagneticButton`,
built on `gsap.quickTo` so a mousemove does not allocate a tween per event).

Text throughout the site answers to the pointer via `ui/HoverText`: the visible
line lifts away while an identical copy rises into its place, one character at
a time. It is deliberately CSS-only — this is attached to most of the type on
the page, so a JS version would mean dozens of listeners and a tween per glyph,
where a transform plus a staggered `transition-delay` costs nothing and stays
on the compositor. The split characters are hidden from assistive tech and the
run is exposed once via `aria-label`, so a screen reader says "WISHLIST" rather
than spelling it out.

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

### 4. The wardrobe, in the round — `components/WardrobeSection.tsx`

Four pieces, each a photographic **360° turntable**: eight views at 45°
intervals that `Turntable` scrubs through as you drag. Real photography rather
than approximated geometry — nothing models leather like a photograph of
leather — and it needs no WebGL context, which is what makes it work on a
phone.

Pointer Events cover mouse, touch and pen from one path. The stage sets
`touch-action: none`, so a horizontal drag spins the piece instead of scrolling
the page, while a vertical swipe still scrolls normally. Release and it coasts
on inertia; until it is first touched it turns slowly on its own, which
advertises that it can be turned without needing a label.

Only the active piece is mounted — keeping all four would hold 32 decoded
images in memory for a transition nobody asked for.

## Assets

51 images, all served by this site out of `public/assets`. The page makes **no
third-party image requests at runtime**.

They were generated with Higgsfield. `npm run assets:sync` mirrors them into the
repo: it downloads each one, re-encodes it to a right-sized WebP, and writes it
to `public/assets`. It reads its upstream list from `scripts/asset-sources.json`,
which is the only place a CDN URL appears anywhere in the project.

```bash
npm run assets:sync             # fetch anything missing
npm run assets:sync -- --force  # re-download and re-encode everything
```

It runs before `dev` and `build` and short-circuits once the files exist, so a
checkout with `public/assets` committed builds offline. `build` fails loudly if
an image is missing; `dev` only warns, so a flaky network cannot stop the dev
server from starting.

### Downloading them yourself

If you would rather fetch the files by hand, two commands cover it:

```bash
npm run assets:list                      # every URL, with the name it becomes
npm run assets:list -- --urls            # bare URLs, for a downloader
npm run assets:import -- ~/Downloads/x   # pick the downloads up from a folder
```

**You do not need to rename anything.** `assets:import` finds each file by the
generation id embedded in its name, so it does not care what the files are
called, how deeply they are nested, or whether your browser appended `(1)` to
some of them. It renames and re-encodes each match to exactly what the site
expects, and lists anything it could not find along with that file's URL — so a
partial download just needs a second pass rather than starting over.

Both routes share `scripts/lib/mirror.mjs`, so downloading and importing
produce byte-identical output.

The inventory:

| Group | Count | Notes |
| --- | --- | --- |
| `walk-male-*`, `walk-female-*` | 12 | Six-frame walk cycles, alpha preserved |
| `spin-{bomber,trench,tote,boot}-*` | 32 | 360° turntables, 45° apart |
| `category-*` | 4 | Section 2 cards |
| `fabric` | 1 | Sampled as a GPU texture, so encoded at higher quality |
| `editorial`, `editorial-portrait` | 2 | Closing campaign plates |

The cutouts are encoded at full alpha quality — flattening them would drop an
opaque rectangle over the wordmark they are layered against.

Every image renders through `components/ui/EditorialImage.tsx`, which fades it
in once decoded and, if the file is missing, draws a legible placeholder naming
the asset and the command that fixes it rather than a broken-image glyph. It
also reconciles against `img.complete` on mount: a cached image can finish
loading before React attaches `onLoad`, and without that check it would sit
invisible on every repeat visit.

## Performance and accessibility

- The cloth canvas is `dynamic(..., { ssr: false })`, so three.js stays out of
  the first load (≈157 kB First Load JS for the page).
- DPR is capped at 2; uncapped device pixel ratio is wasted fill rate.
- Every scrubbed value that changes per frame lives in a ref, not state.
- `prefers-reduced-motion` disables Lenis and collapses CSS transitions.
- The wardrobe responds to arrow keys; its controls are labelled and every tap
  target is at least 44px, with hairline ticks sitting inside taller hit areas.
- Hover flourishes live behind `@media (hover: hover)` and collapse under
  `prefers-reduced-motion`, so touch users get no stuck half-states.
- Layouts are fluid from 390px up.
