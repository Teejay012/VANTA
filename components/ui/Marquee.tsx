"use client";

import { useRef } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { useIsomorphicLayoutEffect } from "@/lib/useIsomorphicLayoutEffect";

/**
 * An endless ticker that answers to the scroll wheel.
 *
 * It always drifts at a base speed, but scroll velocity stretches that speed
 * and scroll *direction* flips it — scroll down and the words run left, scroll
 * up and they run back. That coupling is what stops a marquee reading as
 * decoration and makes it feel wired to the page.
 *
 * The track holds two identical copies of the content and animates by exactly
 * -50%, so the loop point lands on the seam and is invisible.
 */
export default function Marquee({
  children,
  baseSpeed = 18,
  className = "",
}: {
  children: React.ReactNode;
  /** Seconds for one full pass at rest. Higher is slower. */
  baseSpeed?: number;
  className?: string;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  useIsomorphicLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const tween = gsap.to(trackRef.current, {
        xPercent: -50,
        ease: "none",
        duration: baseSpeed,
        repeat: -1,
      });

      const trigger = ScrollTrigger.create({
        trigger: wrapRef.current,
        start: "top bottom",
        end: "bottom top",
        onUpdate: (self) => {
          // getVelocity is px/sec and can spike hard on a trackpad flick, so
          // it is damped and clamped before it reaches the timeline.
          const velocity = self.getVelocity();
          const boost = gsap.utils.clamp(-6, 6, velocity / 260);
          gsap.to(tween, {
            timeScale: self.direction === -1 ? -1 - Math.abs(boost) : 1 + Math.abs(boost),
            duration: 0.5,
            overwrite: true,
          });
        },
      });

      return () => {
        trigger.kill();
        tween.kill();
      };
    }, wrapRef);

    return () => ctx.revert();
  }, [baseSpeed]);

  return (
    <div
      ref={wrapRef}
      className={`overflow-hidden ${className}`}
      // Decorative: the same words repeat twice and would be read out twice.
      aria-hidden
    >
      <div ref={trackRef} className="flex w-max flex-nowrap will-change-transform">
        <div className="flex flex-nowrap items-center">{children}</div>
        <div className="flex flex-nowrap items-center">{children}</div>
      </div>
    </div>
  );
}
