"use client";

import { useEffect, useRef, useState } from "react";
import EditorialImage from "@/components/ui/EditorialImage";

/**
 * A photographic 360° spin.
 *
 * Every frame of the turntable is stacked in the same box and exactly one is
 * shown at a time; dragging scrubs through them. This is how product viewers
 * on luxury storefronts actually work — the pieces stay real photographs
 * rather than approximated geometry, and it costs no WebGL context, which is
 * what makes it viable on a phone.
 *
 * Pointer Events cover mouse, touch and pen from one code path; the container
 * sets `touch-action: none` so a horizontal drag spins the garment instead of
 * scrolling the page, while a vertical swipe still scrolls normally.
 */
export default function Turntable({
  frames,
  alt,
  /** Pixels of horizontal drag for one full revolution. */
  dragDistance = 520,
  className = "",
}: {
  frames: readonly string[];
  alt: string;
  dragDistance?: number;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [dragging, setDragging] = useState(false);

  /** Fractional frame position; the integer part is what gets displayed. */
  const positionRef = useRef(0);
  const velocityRef = useRef(0);
  const lastXRef = useRef(0);
  const touchedRef = useRef(false);

  /* -- Drag ------------------------------------------------------------- */

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const framesPerPixel = frames.length / dragDistance;

    const onDown = (event: PointerEvent) => {
      touchedRef.current = true;
      setDragging(true);
      lastXRef.current = event.clientX;
      velocityRef.current = 0;
      el.setPointerCapture(event.pointerId);
    };

    const onMove = (event: PointerEvent) => {
      if (!el.hasPointerCapture(event.pointerId)) return;
      const dx = event.clientX - lastXRef.current;
      lastXRef.current = event.clientX;

      const delta = dx * framesPerPixel;
      positionRef.current += delta;
      // Blend rather than replace, so a flick reads as momentum instead of one
      // frame's worth of jitter.
      velocityRef.current = velocityRef.current * 0.6 + delta * 0.4;
    };

    const onUp = (event: PointerEvent) => {
      setDragging(false);
      if (el.hasPointerCapture(event.pointerId)) {
        el.releasePointerCapture(event.pointerId);
      }
    };

    el.addEventListener("pointerdown", onDown);
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerup", onUp);
    el.addEventListener("pointercancel", onUp);
    return () => {
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerup", onUp);
      el.removeEventListener("pointercancel", onUp);
    };
  }, [frames.length, dragDistance]);

  /* -- Idle drift, inertia, and frame selection --------------------------- */

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;

    const tick = () => {
      if (!dragging) {
        if (Math.abs(velocityRef.current) > 0.0005) {
          positionRef.current += velocityRef.current;
          velocityRef.current *= 0.93; // friction
        } else if (!touchedRef.current && !reduced) {
          // Until someone grabs it, the piece turns slowly on its own — it
          // advertises that it *can* be turned without needing a label.
          positionRef.current += 0.012;
        }
      }

      // Positive modulo: the position can go negative when dragged backwards.
      const next =
        ((Math.floor(positionRef.current) % frames.length) + frames.length) %
        frames.length;

      setIndex((current) => (current === next ? current : next));
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [dragging, frames.length]);

  return (
    <div
      ref={containerRef}
      // touch-none is what lets a horizontal drag spin rather than scroll.
      className={`relative touch-none select-none ${
        dragging ? "cursor-grabbing" : "cursor-grab"
      } ${className}`}
      role="img"
      aria-label={`${alt} — drag to rotate`}
    >
      {frames.map((src, i) => (
        // Visibility lives on this wrapper rather than on the image, so a
        // frame that falls back to the missing-asset placeholder is hidden by
        // the same switch — otherwise every frame's placeholder would stack.
        <div
          key={src}
          className="absolute inset-0"
          // Every frame stays mounted and decoded; only visibility changes, so
          // spinning never waits on a network or a decode.
          style={{ visibility: i === index ? "visible" : "hidden" }}
        >
          <EditorialImage
            src={src}
            alt={i === 0 ? alt : ""}
            aria-hidden={i !== 0}
            quiet={i !== 0}
            wrapperClassName="h-full w-full"
            className="h-full w-full object-contain"
          />
        </div>
      ))}
    </div>
  );
}
