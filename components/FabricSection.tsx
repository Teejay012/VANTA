"use client";

import dynamic from "next/dynamic";
import { useRef, useState } from "react";
import { gsap } from "@/lib/gsap";
import { useIsomorphicLayoutEffect } from "@/lib/useIsomorphicLayoutEffect";
import { ASSETS } from "@/lib/assets";
import { hasWebGL } from "@/lib/webgl";

// three.js is ~150kB gzipped — keep it out of the first load and off the server.
const ClothCanvas = dynamic(() => import("./fabric/ClothCanvas"), {
  ssr: false,
});

/** Campaign copy, unveiled one block at a time as the textile drapes further. */
const PANELS = [
  {
    eyebrow: "CHAPTER I",
    title: ["WOVEN", "NOT", "PRINTED"],
    body: "Technical nylon, milled in a single run. Every metre carries the same weave count, the same weight, the same hand.",
  },
  {
    eyebrow: "CHAPTER II",
    title: ["CUT", "FOR", "MOVEMENT"],
    body: "Patterns drafted on the body in motion rather than flat on the table. The drape is the design.",
  },
  {
    eyebrow: "CHAPTER III",
    title: ["WORN", "OUT OF", "SEASON"],
    body: "Monochrome by discipline. Nothing here expires in six months — the collection is built to outlast its own campaign.",
  },
] as const;

/**
 * SECTION 3 — Woven Fabric Canvas.
 *
 * A sticky full-bleed WebGL textile. One ScrollTrigger writes normalised
 * progress into a ref (read per frame by the shader, never through React
 * state), while a second scrubbed timeline hands the copy panels off to one
 * another as the unroll frontier travels down the cloth.
 */
export default function FabricSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const progressRef = useRef(0);
  const [webgl, setWebgl] = useState<boolean | null>(null);

  useIsomorphicLayoutEffect(() => {
    setWebgl(hasWebGL());

    const ctx = gsap.context(() => {
      /* -- Drive the shader ---------------------------------------------- */
      gsap.to(progressRef, {
        current: 1,
        ease: "none",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top top",
          end: "bottom bottom",
          scrub: true,
        },
      });

      /* -- Hand the copy panels off in sequence --------------------------- */
      const panels = gsap.utils.toArray<HTMLElement>("[data-fabric-panel]");

      const tl = gsap.timeline({
        defaults: { ease: "power2.out" },
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top top",
          end: "bottom bottom",
          scrub: 0.8,
        },
      });

      panels.forEach((panel, i) => {
        // Each panel owns a slice of the track, with a short overlap so one
        // is always fading as the next arrives.
        const slot = 100 / panels.length;
        const at = i * slot;

        tl.fromTo(
          panel.querySelectorAll("[data-fabric-line]"),
          { yPercent: 120, opacity: 0 },
          { yPercent: 0, opacity: 1, duration: slot * 0.32, stagger: slot * 0.045 },
          at + slot * 0.08,
        );

        // The last panel stays on screen through the hand-off to Section 4.
        if (i < panels.length - 1) {
          tl.to(
            panel.querySelectorAll("[data-fabric-line]"),
            { yPercent: -90, opacity: 0, duration: slot * 0.26 },
            at + slot * 0.7,
          );
        }
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      id="fabric"
      ref={sectionRef}
      // Three panels, each needing roughly a screen of travel to read.
      className="relative h-[300vh] bg-stone"
    >
      <div className="sticky top-0 h-screen w-full overflow-hidden bg-stone">
        {/* -- The textile ------------------------------------------------- */}
        <div className="absolute inset-0">
          {webgl ? (
            <ClothCanvas progressRef={progressRef} />
          ) : (
            // Fallback: the same photographed weave, held still.
            <img
              src={ASSETS.fabric}
              alt="Draped woven technical nylon"
              className="h-full w-full object-cover grayscale"
              draggable={false}
            />
          )}
        </div>

        {/* -- Copy woven onto the surface ---------------------------------
            `mix-blend-mode: multiply` lets the fold shading show through the
            letterforms, so the type reads as printed into the cloth rather
            than floating above it. The layer never takes the pointer. */}
        <div className="pointer-events-none absolute inset-0 px-4 py-28 sm:px-8 sm:py-32">
          {PANELS.map((panel) => (
            <div
              key={panel.eyebrow}
              data-fabric-panel
              className="absolute inset-x-4 top-1/2 -translate-y-1/2 mix-blend-multiply sm:inset-x-8"
            >
              <div className="overflow-hidden">
                <p data-fabric-line className="eyebrow mb-6 text-ink/70">
                  {panel.eyebrow}
                </p>
              </div>

              {panel.title.map((line) => (
                <div key={line} className="overflow-hidden">
                  <h2
                    data-fabric-line
                    className="display text-[15vw] leading-[0.84] text-ink sm:text-[8.5vw]"
                  >
                    {line}
                  </h2>
                </div>
              ))}

              <div className="mt-8 max-w-sm overflow-hidden">
                <p
                  data-fabric-line
                  className="text-sm font-light leading-relaxed text-ink/80"
                >
                  {panel.body}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* -- Section marker ---------------------------------------------- */}
        <div className="pointer-events-none absolute bottom-8 right-4 mix-blend-multiply sm:right-8">
          <p className="eyebrow text-ink/60">THE MATERIAL</p>
        </div>
      </div>
    </section>
  );
}
