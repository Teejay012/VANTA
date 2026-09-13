"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import { gsap } from "@/lib/gsap";
import { useIsomorphicLayoutEffect } from "@/lib/useIsomorphicLayoutEffect";
import { WARDROBE } from "@/lib/wardrobe";
import { ASSETS } from "@/lib/assets";
import { hasWebGL } from "@/lib/webgl";

const WardrobeCanvas = dynamic(() => import("./wardrobe/WardrobeCanvas"), {
  ssr: false,
});

/** Flat stills used when WebGL is unavailable. */
const FALLBACK_STILLS = [
  ASSETS.garmentJacket,
  ASSETS.garmentBag,
  ASSETS.garmentJacket,
  ASSETS.garmentBag,
];

/**
 * SECTION 4 — Interactive 3D Wardrobe.
 *
 * The canvas owns every pointer input: drag anywhere across it to spin the
 * active piece through a full 360°, release and it keeps turning on inertia.
 * Every text layer above it is `pointer-events-none` so nothing steals the
 * drag, and only the pagination controls opt back in.
 */
export default function WardrobeSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const detailRef = useRef<HTMLDivElement>(null);

  const [activeIndex, setActiveIndex] = useState(0);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [webgl, setWebgl] = useState<boolean | null>(null);

  /** Current spin of the active garment, in radians. Read by the r3f frame
   *  loop — deliberately a ref so dragging never triggers a React render. */
  const rotationRef = useRef(0);
  const velocityRef = useRef(0);
  const lastXRef = useRef(0);

  const active = WARDROBE[activeIndex];

  useEffect(() => setWebgl(hasWebGL()), []);

  /* -- Drag to rotate ---------------------------------------------------- */

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const onDown = (event: PointerEvent) => {
      setDragging(true);
      lastXRef.current = event.clientX;
      velocityRef.current = 0;
      stage.setPointerCapture(event.pointerId);
    };

    const onMove = (event: PointerEvent) => {
      if (!stage.hasPointerCapture(event.pointerId)) return;
      const dx = event.clientX - lastXRef.current;
      lastXRef.current = event.clientX;

      const delta = dx * 0.009;
      rotationRef.current += delta;
      // Blend the new velocity in rather than replacing it, so a fast flick
      // reads as momentum instead of a single frame's jitter.
      velocityRef.current = velocityRef.current * 0.6 + delta * 0.4;
    };

    const onUp = (event: PointerEvent) => {
      setDragging(false);
      if (stage.hasPointerCapture(event.pointerId)) {
        stage.releasePointerCapture(event.pointerId);
      }
    };

    stage.addEventListener("pointerdown", onDown);
    stage.addEventListener("pointermove", onMove);
    stage.addEventListener("pointerup", onUp);
    stage.addEventListener("pointercancel", onUp);

    return () => {
      stage.removeEventListener("pointerdown", onDown);
      stage.removeEventListener("pointermove", onMove);
      stage.removeEventListener("pointerup", onUp);
      stage.removeEventListener("pointercancel", onUp);
    };
  }, []);

  /* -- Inertia ------------------------------------------------------------ */

  useEffect(() => {
    let frame = 0;
    const spin = () => {
      if (!dragging && Math.abs(velocityRef.current) > 0.00015) {
        rotationRef.current += velocityRef.current;
        velocityRef.current *= 0.94; // friction
      }
      frame = requestAnimationFrame(spin);
    };
    frame = requestAnimationFrame(spin);
    return () => cancelAnimationFrame(frame);
  }, [dragging]);

  /* -- Pagination --------------------------------------------------------- */

  const goTo = useCallback((index: number) => {
    const next = (index + WARDROBE.length) % WARDROBE.length;
    setActiveIndex(next);
    // Each piece is presented face-on; carry over none of the previous spin.
    rotationRef.current = 0;
    velocityRef.current = 0;
  }, []);

  // Arrow keys drive the rail once the section has focus.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight") goTo(activeIndex + 1);
      if (event.key === "ArrowLeft") goTo(activeIndex - 1);
    };
    const section = sectionRef.current;
    section?.addEventListener("keydown", onKey);
    return () => section?.removeEventListener("keydown", onKey);
  }, [activeIndex, goTo]);

  /* -- Detail crossfade on change ----------------------------------------- */

  useIsomorphicLayoutEffect(() => {
    if (!detailRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        "[data-detail-line]",
        { yPercent: 100, opacity: 0 },
        {
          yPercent: 0,
          opacity: 1,
          duration: 0.85,
          ease: "power3.out",
          stagger: 0.06,
        },
      );
    }, detailRef);
    return () => ctx.revert();
  }, [activeIndex]);

  /* -- Section reveal ------------------------------------------------------ */

  useIsomorphicLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from("[data-wardrobe-heading] > *", {
        yPercent: 110,
        duration: 1.1,
        ease: "power4.out",
        stagger: 0.08,
        scrollTrigger: { trigger: sectionRef.current, start: "top 80%", once: true },
      });
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section
      id="wardrobe"
      ref={sectionRef}
      tabIndex={-1}
      className="relative z-10 bg-ink px-4 py-24 text-bone outline-none sm:px-8 sm:py-32"
    >
      {/* -- Heading -------------------------------------------------------- */}
      <div className="mb-12 flex flex-col gap-8 sm:mb-16 sm:flex-row sm:items-end sm:justify-between">
        <div data-wardrobe-heading className="overflow-hidden">
          <p className="eyebrow mb-6 text-smoke">
            <span className="block">IN THE ROUND</span>
          </p>
          <h2 className="display text-[13vw] leading-[0.85] sm:text-[7vw]">
            <span className="block">THE PIECES</span>
          </h2>
        </div>

        <p className="max-w-xs text-sm font-light leading-relaxed text-smoke">
          Drag to turn each piece through 360°. Hover to bring the light up and
          read the surface.
        </p>
      </div>

      {/* -- Stage ---------------------------------------------------------- */}
      <div className="relative">
        <div
          ref={stageRef}
          className={`relative h-[58vh] min-h-[380px] w-full touch-none select-none sm:h-[64vh] ${
            dragging ? "cursor-grabbing" : "cursor-grab"
          }`}
        >
          {webgl === false ? (
            // Fallback: the flat campaign still for the active piece.
            <img
              src={FALLBACK_STILLS[activeIndex]}
              alt={active.name}
              className="h-full w-full object-contain grayscale"
              draggable={false}
            />
          ) : webgl ? (
            <WardrobeCanvas
              activeIndex={activeIndex}
              hoveredId={hoveredId}
              onHover={setHoveredId}
              rotationRef={rotationRef}
            />
          ) : (
            // First paint, before the capability check resolves.
            <div className="flex h-full w-full items-center justify-center">
              <span className="eyebrow text-smoke">LOADING THE ATELIER</span>
            </div>
          )}

          {/* Drag affordance — never intercepts the pointer it is describing. */}
          <span
            className={`pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 text-[9px] tracking-[0.3em] text-smoke transition-opacity duration-500 ${
              dragging ? "opacity-0" : "opacity-100"
            }`}
          >
            DRAG TO ROTATE
          </span>
        </div>

        {/* -- Detail panel: floats over the stage, click-through ----------- */}
        <div
          ref={detailRef}
          className="pointer-events-none absolute inset-x-0 top-0 flex justify-between gap-6 sm:top-4"
        >
          <div className="overflow-hidden">
            <p data-detail-line className="eyebrow text-smoke">
              {active.category}
            </p>
          </div>
          <div className="max-w-[42%] text-right sm:max-w-xs">
            <div className="overflow-hidden">
              <p data-detail-line className="eyebrow text-smoke">
                {String(activeIndex + 1).padStart(2, "0")} /{" "}
                {String(WARDROBE.length).padStart(2, "0")}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* -- Controls ------------------------------------------------------- */}
      <div className="mt-10 flex flex-col gap-8 sm:mt-12 sm:flex-row sm:items-end sm:justify-between">
        <div className="overflow-hidden">
          <h3 data-detail-line className="display text-3xl sm:text-5xl">
            {active.name}
          </h3>
          <div className="mt-4 flex items-baseline gap-6 overflow-hidden">
            <span data-detail-line className="text-sm font-light text-bone">
              {active.price}
            </span>
            <span
              data-detail-line
              className="max-w-xs text-xs font-light leading-relaxed text-smoke"
            >
              {active.material}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <button
            type="button"
            onClick={() => goTo(activeIndex - 1)}
            aria-label="Previous piece"
            className="flex h-11 w-11 items-center justify-center border border-bone/25 text-bone transition-colors hover:border-bone hover:bg-bone hover:text-ink"
          >
            <span aria-hidden>&#8592;</span>
          </button>

          {/* Scrub: one tick per piece, the active one drawn wide. */}
          <div className="flex items-center gap-2">
            {WARDROBE.map((garment, index) => (
              <button
                key={garment.id}
                type="button"
                onClick={() => goTo(index)}
                aria-label={`Show ${garment.name}`}
                aria-current={index === activeIndex}
                className={`h-px transition-all duration-500 ease-[var(--ease-editorial)] ${
                  index === activeIndex
                    ? "w-12 bg-bone"
                    : "w-6 bg-bone/30 hover:bg-bone/60"
                }`}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={() => goTo(activeIndex + 1)}
            aria-label="Next piece"
            className="flex h-11 w-11 items-center justify-center border border-bone/25 text-bone transition-colors hover:border-bone hover:bg-bone hover:text-ink"
          >
            <span aria-hidden>&#8594;</span>
          </button>
        </div>
      </div>
    </section>
  );
}
