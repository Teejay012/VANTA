"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import { gsap, ScrollTrigger } from "@/lib/gsap";

/**
 * Inertia scrolling for the whole document.
 *
 * Lenis takes over the scroll position, so GSAP's ScrollTrigger has to be told
 * about every frame Lenis produces — otherwise scrubbed timelines lag a frame
 * behind the content. The wiring is the standard three-part handshake:
 *
 *   1. ScrollTrigger.scrollerProxy is not needed (Lenis scrolls <html>), but
 *      ScrollTrigger must `update()` on every Lenis scroll event.
 *   2. Lenis is driven from GSAP's ticker instead of its own rAF loop so both
 *      run in the same frame, in a deterministic order.
 *   3. GSAP's lag smoothing is disabled; it would otherwise clamp the delta
 *      time we hand to Lenis after a dropped frame.
 */
export default function SmoothScroll({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    // Users who ask for reduced motion get the plain native scroll.
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (prefersReducedMotion) return;

    const lenis = new Lenis({
      duration: 1.15,
      // A long, shallow ease — this is what gives the scroll its weight.
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      touchMultiplier: 1.6,
    });

    lenis.on("scroll", ScrollTrigger.update);

    const tick = (time: number) => {
      // GSAP reports seconds, Lenis expects milliseconds.
      lenis.raf(time * 1000);
    };

    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(tick);
      gsap.ticker.lagSmoothing(500, 33);
      lenis.destroy();
    };
  }, []);

  return <>{children}</>;
}
