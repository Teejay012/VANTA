"use client";

import { useRef, useState } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { useIsomorphicLayoutEffect } from "@/lib/useIsomorphicLayoutEffect";
import { ASSETS } from "@/lib/assets";
import WalkingModel from "@/components/hero/WalkingModel";
import HoverText from "@/components/ui/HoverText";


/**
 * SECTION 1 — The Runway Hero.
 *
 * A 300vh scroll track with a `position: sticky` inner stage. Pinning via
 * sticky (rather than ScrollTrigger's own `pin`) keeps the element in normal
 * document flow, which means no pin-spacer is injected and the hand-off into
 * Section 2 has nothing to jump over.
 *
 * The whole sequence is one scrubbed timeline whose duration is 100 units, so
 * a tween's position on the timeline reads directly as a scroll percentage:
 *
 *    0 → 45   the male model walks off to the right
 *   45 → 50   a beat — the runway light sweeps, the stage is empty
 *   50 → 95   the female model enters from the left and exits right
 *   95 → 100  the stage dissolves and releases into Section 2
 *
 * The models themselves are looping animated cutouts that walk at their own
 * natural cadence; this timeline only carries them across the stage. See
 * WalkingModel for why the gait is deliberately not scroll-driven.
 */
export default function RunwayHero() {
  const trackRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const maleRef = useRef<HTMLDivElement>(null);
  const femaleRef = useRef<HTMLDivElement>(null);
  const wordmarkRef = useRef<HTMLHeadingElement>(null);
  const chromeRef = useRef<HTMLDivElement>(null);
  const sweepRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLSpanElement>(null);

  // The second clip is fetched only once the first model is most of the way
  // across, so it never competes with first paint. The ref guards the setState
  // so this fires once rather than on every scroll tick.
  const [femaleLoaded, setFemaleLoaded] = useState(false);
  const femaleRequested = useRef(false);

  useIsomorphicLayoutEffect(() => {
    // gsap.context scopes every selector and animation created inside it so a
    // single revert() on unmount cleans up tweens *and* ScrollTriggers.
    const ctx = gsap.context(() => {
      // How far off-stage a model has to travel to clear the viewport. Written
      // as a function so `invalidateOnRefresh` can recompute it on resize.
      const exit = () => window.innerWidth * 0.95;
      const entry = () => -window.innerWidth * 0.95;

      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: trackRef.current,
          start: "top top",
          end: "bottom bottom",
          // A touch of scrub smoothing is what separates "scroll-linked" from
          // "cinematic" — the models keep moving for a beat after the wheel
          // stops instead of freezing mid-stride.
          scrub: 1.1,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            if (progressRef.current) {
              progressRef.current.style.transform = `scaleX(${self.progress})`;
            }

            // She enters at 50%; start fetching at 28% so the clip has landed
            // and begun playing before she is due.
            if (self.progress > 0.28 && !femaleRequested.current) {
              femaleRequested.current = true;
              setFemaleLoaded(true);
            }
          },
        },
      });

      /* -- Phase 1 (0 → 45): the male model exits stage right --------------- */

      tl.fromTo(
        maleRef.current,
        { x: 0, scale: 1 },
        { x: exit, scale: 1.06, duration: 45 },
        0,
      )
        .to(maleRef.current, { opacity: 0, duration: 6 }, 39);

      /* -- The wordmark breathes across the whole sequence ------------------ */

      tl.fromTo(
        wordmarkRef.current,
        { scale: 1, letterSpacing: "-0.045em", opacity: 1 },
        { scale: 1.14, letterSpacing: "0.02em", opacity: 0.9, duration: 95 },
        0,
      );

      // Foreground copy clears out early so the runway is uncluttered.
      tl.to(chromeRef.current, { opacity: 0, y: -24, duration: 12 }, 30);

      /* -- Phase 2 (45 → 50): the runway light sweeps ----------------------- */

      tl.fromTo(
        sweepRef.current,
        { scaleX: 0, opacity: 0 },
        { scaleX: 1, opacity: 1, duration: 3, ease: "power2.out" },
        45,
      ).to(sweepRef.current, { opacity: 0.18, duration: 2 }, 48);

      /* -- Phase 3 (50 → 95): the female model crosses the stage ------------ */

      tl.fromTo(femaleRef.current, { opacity: 0 }, { opacity: 1, duration: 6 }, 50)
        .fromTo(
          femaleRef.current,
          { x: entry, scale: 0.94 },
          { x: exit, scale: 1.08, duration: 45 },
          50,
        )
        .to(femaleRef.current, { opacity: 0, duration: 6 }, 89);

      /* -- Phase 4 (95 → 100): release into Section 2 ------------------------ */

      tl.to(
        stageRef.current,
        { opacity: 0, scale: 0.96, filter: "blur(6px)", duration: 5 },
        95,
      );

      // Fonts settle after first paint and change the wordmark's measured size,
      // so re-measure once they are ready.
      document.fonts?.ready.then(() => ScrollTrigger.refresh());
    }, trackRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      id="top"
      ref={trackRef}
      // 300vh of track gives the four phases room to read as distinct beats.
      className="relative h-[300vh] bg-stone"
    >
      <div
        ref={stageRef}
        className="sticky top-0 flex h-screen w-full items-end overflow-hidden bg-stone"
      >
        {/* -- Background: the oversized wordmark ------------------------- */}
        <div
          className="pointer-events-none absolute inset-0 flex items-center justify-center"
          aria-hidden
        >
          <h1
            ref={wordmarkRef}
            className="display select-none text-[21vw] leading-none text-ink will-change-transform"
          >
            VANTA
          </h1>
        </div>

        {/* -- Runway horizon: the sweep that covers the model changeover -- */}
        <div
          ref={sweepRef}
          className="pointer-events-none absolute bottom-[16%] left-0 h-px w-full origin-left bg-ink/60"
          aria-hidden
        />

        {/*
          -- Mid-ground: the models -------------------------------------
          Cutouts (background removed) so they sit between the wordmark and
          the foreground copy. `pointer-events-none` keeps them from
          swallowing clicks meant for the UI beneath.
        */}
        <WalkingModel
          ref={maleRef}
          src={ASSETS.heroMaleWalk}
          alt="Male model walking the VANTA runway in an oversized trench coat"
          className="pointer-events-none absolute bottom-0 left-1/2 h-[62vh] w-[46vw] -translate-x-1/2 will-change-transform sm:h-[78vh] sm:w-[30vw]"
        />
        <WalkingModel
          ref={femaleRef}
          src={femaleLoaded ? ASSETS.heroFemaleWalk : undefined}
          alt="Female model walking the VANTA runway in an oversized wool coat"
          className="pointer-events-none absolute bottom-0 left-1/2 h-[62vh] w-[46vw] -translate-x-1/2 opacity-0 will-change-transform sm:h-[78vh] sm:w-[30vw]"
        />

        {/* -- Foreground chrome ------------------------------------------
            The wrapper is pointer-events-none so the layer never blocks the
            stage; only the interactive controls opt back in. */}
        <div
          ref={chromeRef}
          className="pointer-events-none relative z-10 flex h-full w-full flex-col justify-between px-4 pb-10 pt-28 sm:px-8 sm:pb-14 sm:pt-32"
        >
          <div className="max-w-xs">
            <p className="eyebrow leading-[2.4] text-ink">
              FASHION
              <br />
              THAT MOVES
              <br />
              WITH YOU.
            </p>
            <div className="rule mt-5 w-14 text-ink" />
          </div>

          <div className="flex items-end justify-between gap-4">
            <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:gap-8">
              <a
                href="#categories"
                className="pointer-events-auto bg-ink px-7 py-3.5 text-[10px] tracking-[0.24em] text-bone transition-transform duration-500 ease-[var(--ease-editorial)] hover:-translate-y-0.5 sm:px-9"
              >
                <HoverText>SHOP NOW</HoverText>
              </a>
              <a
                href="#fabric"
                className="pointer-events-auto border-b border-ink pb-1 text-[10px] tracking-[0.24em] text-ink"
              >
                <HoverText>EXPLORE NEW IN</HoverText>
              </a>
            </div>

            <p className="eyebrow hidden text-right leading-[2.2] text-ink sm:block">
              NEW
              <br />
              COLLECTION
              <br />
              2026
            </p>
          </div>
        </div>

        {/* -- Scroll progress: a single hairline across the foot ---------- */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-ink/10">
          <span
            ref={progressRef}
            className="block h-full w-full origin-left scale-x-0 bg-ink"
          />
        </div>
      </div>
    </section>
  );
}
