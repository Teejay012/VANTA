"use client";

import { useRef } from "react";
import { gsap } from "@/lib/gsap";
import { useIsomorphicLayoutEffect } from "@/lib/useIsomorphicLayoutEffect";

type Props = {
  children: React.ReactNode;
  href?: string;
  /** How far the element is allowed to chase the cursor, in pixels. */
  strength?: number;
  className?: string;
};

/**
 * A control that leans toward the pointer while it is nearby and springs back
 * when it leaves. The inner span moves slightly further than the wrapper,
 * which reads as parallax between the frame and its label.
 *
 * `gsap.quickTo` is used instead of `gsap.to` because this fires on every
 * mousemove — quickTo reuses one tween instance rather than allocating a new
 * one per event.
 */
export default function MagneticButton({
  children,
  href = "#",
  strength = 22,
  className = "",
}: Props) {
  const wrapRef = useRef<HTMLAnchorElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);

  useIsomorphicLayoutEffect(() => {
    const wrap = wrapRef.current;
    const label = labelRef.current;
    if (!wrap || !label) return;

    // Magnetism is a fine-pointer affordance; on touch it would just cause
    // the control to drift under the finger.
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

    const ease = "elastic.out(1, 0.42)";
    const xTo = gsap.quickTo(wrap, "x", { duration: 0.9, ease });
    const yTo = gsap.quickTo(wrap, "y", { duration: 0.9, ease });
    const labelX = gsap.quickTo(label, "x", { duration: 1.1, ease });
    const labelY = gsap.quickTo(label, "y", { duration: 1.1, ease });

    const onMove = (event: MouseEvent) => {
      const { left, top, width, height } = wrap.getBoundingClientRect();
      // Offset of the cursor from the element's centre, normalised to -1..1.
      const dx = (event.clientX - (left + width / 2)) / (width / 2);
      const dy = (event.clientY - (top + height / 2)) / (height / 2);

      xTo(dx * strength);
      yTo(dy * strength);
      labelX(dx * strength * 0.35);
      labelY(dy * strength * 0.35);
    };

    const onLeave = () => {
      xTo(0);
      yTo(0);
      labelX(0);
      labelY(0);
    };

    wrap.addEventListener("mousemove", onMove);
    wrap.addEventListener("mouseleave", onLeave);
    return () => {
      wrap.removeEventListener("mousemove", onMove);
      wrap.removeEventListener("mouseleave", onLeave);
    };
  }, [strength]);

  return (
    <a
      ref={wrapRef}
      href={href}
      className={`inline-flex items-center gap-3 will-change-transform ${className}`}
    >
      <span ref={labelRef} className="inline-flex items-center gap-3">
        {children}
      </span>
    </a>
  );
}
