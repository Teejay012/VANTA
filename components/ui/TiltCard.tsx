"use client";

import { useRef } from "react";
import { gsap } from "@/lib/gsap";
import { useIsomorphicLayoutEffect } from "@/lib/useIsomorphicLayoutEffect";

type Props = {
  children: React.ReactNode;
  /** Maximum rotation on each axis, in degrees. Keep this small — past about
   *  8° the perspective distortion stops looking like a lit surface. */
  max?: number;
  className?: string;
};

/**
 * Subtle 3D tilt that follows the pointer across the card's surface, plus a
 * matching parallax push on any child marked `data-tilt-layer`.
 */
export default function TiltCard({ children, max = 6, className = "" }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useIsomorphicLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

    const layers = el.querySelectorAll<HTMLElement>("[data-tilt-layer]");

    const rotX = gsap.quickTo(el, "rotationX", { duration: 0.7, ease: "power3.out" });
    const rotY = gsap.quickTo(el, "rotationY", { duration: 0.7, ease: "power3.out" });

    const onMove = (event: MouseEvent) => {
      const { left, top, width, height } = el.getBoundingClientRect();
      const dx = (event.clientX - (left + width / 2)) / (width / 2);
      const dy = (event.clientY - (top + height / 2)) / (height / 2);

      // Inverted on X so the card appears to tip *away* under the cursor.
      rotX(-dy * max);
      rotY(dx * max);

      layers.forEach((layer, index) => {
        const depth = (index + 1) * 10;
        gsap.to(layer, {
          x: dx * depth,
          y: dy * depth,
          duration: 0.7,
          ease: "power3.out",
        });
      });
    };

    const onLeave = () => {
      rotX(0);
      rotY(0);
      layers.forEach((layer) =>
        gsap.to(layer, { x: 0, y: 0, duration: 0.9, ease: "power3.out" }),
      );
    };

    el.addEventListener("mousemove", onMove);
    el.addEventListener("mouseleave", onLeave);
    return () => {
      el.removeEventListener("mousemove", onMove);
      el.removeEventListener("mouseleave", onLeave);
    };
  }, [max]);

  return (
    <div
      ref={ref}
      // `transform-style: preserve-3d` plus a perspective on the parent is what
      // makes the rotation read as depth rather than a skew.
      className={`[transform-style:preserve-3d] will-change-transform ${className}`}
    >
      {children}
    </div>
  );
}
