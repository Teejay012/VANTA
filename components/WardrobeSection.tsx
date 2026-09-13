"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { gsap } from "@/lib/gsap";
import { useIsomorphicLayoutEffect } from "@/lib/useIsomorphicLayoutEffect";
import { WARDROBE } from "@/lib/wardrobe";
import Turntable from "@/components/wardrobe/Turntable";
import HoverText from "@/components/ui/HoverText";

/**
 * SECTION 4 — The wardrobe, in the round.
 *
 * Each piece is a photographic 360° spin. Drag anywhere on the stage to turn
 * it; on a phone the same drag works under the finger, because the stage sets
 * `touch-action: none` horizontally while leaving vertical scroll alone.
 *
 * Only one turntable is mounted at a time. Mounting all four would mean 32
 * decoded images sitting in memory for the sake of a transition nobody asked
 * for — the piece cross-fades instead.
 */
export default function WardrobeSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const detailRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  const [activeIndex, setActiveIndex] = useState(0);
  const active = WARDROBE[activeIndex];

  const goTo = useCallback((index: number) => {
    setActiveIndex((index + WARDROBE.length) % WARDROBE.length);
  }, []);

  // Arrow keys page the rail once the section has focus.
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight") goTo(activeIndex + 1);
      if (event.key === "ArrowLeft") goTo(activeIndex - 1);
    };
    section.addEventListener("keydown", onKey);
    return () => section.removeEventListener("keydown", onKey);
  }, [activeIndex, goTo]);

  /* -- Cross-fade the stage and re-run the detail copy on change ----------- */

  useIsomorphicLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        stageRef.current,
        { opacity: 0, scale: 0.96 },
        { opacity: 1, scale: 1, duration: 0.8, ease: "power3.out" },
      );
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
    }, sectionRef);
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
      className="relative z-10 bg-ink px-4 py-20 text-bone outline-none sm:px-8 sm:py-32"
    >
      {/* -- Heading -------------------------------------------------------- */}
      <div className="mb-10 flex flex-col gap-6 sm:mb-16 sm:flex-row sm:items-end sm:justify-between">
        <div data-wardrobe-heading className="overflow-hidden">
          <p className="eyebrow mb-4 text-smoke sm:mb-6">
            <span className="block">IN THE ROUND</span>
          </p>
          <h2 className="display text-[15vw] leading-[0.85] sm:text-[7vw]">
            <span className="block">THE PIECES</span>
          </h2>
        </div>

        <p className="max-w-xs text-sm font-light leading-relaxed text-smoke">
          Drag to turn each piece through a full circle. Every frame is a
          photograph, not a render.
        </p>
      </div>

      {/* -- Stage ---------------------------------------------------------- */}
      <div className="relative">
        <div
          ref={stageRef}
          className="relative mx-auto w-full max-w-[560px] will-change-transform"
        >
          <Turntable
            // Remounting per piece drops the previous eight frames from memory.
            key={active.id}
            frames={active.frames}
            alt={`${active.name} — ${active.material}`}
            className="aspect-square w-full"
          />
        </div>

        {/* Floating labels — click-through so they never eat the drag. */}
        <div className="pointer-events-none absolute inset-x-0 top-0 flex justify-between gap-4">
          <div className="overflow-hidden">
            <p data-detail-line className="eyebrow text-smoke">
              {active.category}
            </p>
          </div>
          <div className="overflow-hidden">
            <p data-detail-line className="eyebrow text-smoke">
              {String(activeIndex + 1).padStart(2, "0")} /{" "}
              {String(WARDROBE.length).padStart(2, "0")}
            </p>
          </div>
        </div>

        <p className="pointer-events-none mt-2 text-center text-[9px] tracking-[0.3em] text-smoke">
          DRAG TO ROTATE
        </p>
      </div>

      {/* -- Detail and controls -------------------------------------------- */}
      <div className="mt-10 flex flex-col gap-8 sm:mt-12 sm:flex-row sm:items-end sm:justify-between">
        <div className="overflow-hidden">
          <h3 data-detail-line className="display text-[9vw] leading-none sm:text-5xl">
            {active.name}
          </h3>
          <div className="mt-4 flex flex-col gap-1 overflow-hidden sm:flex-row sm:items-baseline sm:gap-6">
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

        <div className="flex items-center justify-between gap-4 sm:justify-end sm:gap-6">
          <button
            type="button"
            onClick={() => goTo(activeIndex - 1)}
            aria-label="Previous piece"
            className="flex h-12 w-12 shrink-0 items-center justify-center border border-bone/25 text-bone transition-colors hover:border-bone hover:bg-bone hover:text-ink"
          >
            <span aria-hidden>&#8592;</span>
          </button>

          {/* One tick per piece, the active one drawn wide. */}
          <div className="flex items-center gap-2">
            {WARDROBE.map((garment, index) => (
              <button
                key={garment.id}
                type="button"
                onClick={() => goTo(index)}
                aria-label={`Show ${garment.name}`}
                aria-current={index === activeIndex}
                // A tall transparent hit area around a hairline tick: the mark
                // stays editorial, the target stays thumb-sized.
                className="group/tick flex h-12 w-10 items-center justify-center sm:w-8"
              >
                <span
                  className={`block h-px transition-all duration-500 ease-[var(--ease-editorial)] ${
                    index === activeIndex
                      ? "w-10 bg-bone sm:w-12"
                      : "w-5 bg-bone/30 group-hover/tick:bg-bone/70 sm:w-6"
                  }`}
                />
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => goTo(activeIndex + 1)}
            aria-label="Next piece"
            className="flex h-12 w-12 shrink-0 items-center justify-center border border-bone/25 text-bone transition-colors hover:border-bone hover:bg-bone hover:text-ink"
          >
            <span aria-hidden>&#8594;</span>
          </button>
        </div>
      </div>

      {/* -- Piece index: a text list that doubles as navigation ------------- */}
      <ul className="mt-14 grid grid-cols-1 gap-px border-t border-bone/10 sm:grid-cols-2 lg:grid-cols-4">
        {WARDROBE.map((garment, index) => (
          <li key={garment.id}>
            <button
              type="button"
              onClick={() => goTo(index)}
              className={`w-full border-b border-bone/10 py-5 text-left transition-colors ${
                index === activeIndex ? "text-bone" : "text-smoke hover:text-bone"
              }`}
            >
              <span className="eyebrow block text-[9px] opacity-60">
                {String(index + 1).padStart(2, "0")}
              </span>
              <HoverText className="mt-2 block text-sm tracking-[0.14em]">
                {garment.name}
              </HoverText>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
