"use client";

import { forwardRef } from "react";
import EditorialImage from "@/components/ui/EditorialImage";

/**
 * A model rendered as a stack of walk-cycle frames.
 *
 * All frames sit on top of one another and exactly one is visible at a time —
 * `setWalkFrame` below flips them. Keeping every frame mounted means the
 * browser has already decoded them by the time the sequence plays, so stepping
 * costs a single `visibility` flip rather than a decode.
 *
 * The forwarded ref points at the wrapper, which is what the hero timeline
 * translates across the stage; the frames themselves never move independently.
 */
const WalkingModel = forwardRef<
  HTMLDivElement,
  { frames: readonly string[]; alt: string; className?: string }
>(function WalkingModel({ frames, alt, className = "" }, ref) {
  return (
    <div ref={ref} className={className}>
      {frames.map((src, index) => (
        // Visibility lives on the wrapper so a frame that falls back to the
        // missing-asset placeholder is hidden by the same switch.
        <div
          key={src}
          data-walk-frame={index}
          className="absolute inset-0"
          // Frame 0 is the poster; the rest wait to be blended in.
          style={{
            visibility: index === 0 ? "visible" : "hidden",
            opacity: index === 0 ? 1 : 0,
          }}
        >
          <EditorialImage
            src={src}
            // Only the first frame carries the description; the rest are the
            // same person mid-stride and would just repeat it.
            alt={index === 0 ? alt : ""}
            aria-hidden={index !== 0}
            quiet={index !== 0}
            wrapperClassName="h-full w-full"
            className="h-full w-full object-contain object-bottom"
          />
        </div>
      ))}
    </div>
  );
});

export default WalkingModel;

/**
 * Places a WalkingModel at a fractional point in its sequence.
 *
 * `phase` is a float in [0, frames-1]: the whole part picks the frame, the
 * fraction cross-fades the next one in over it. Without that blend, twenty
 * frames stretched over a screen-and-a-half of scroll arrive as twenty visible
 * steps; with it the stride reads as continuous however slowly you scroll.
 *
 * The outgoing frame stays fully opaque underneath while the incoming one
 * fades in on top — dissolving both at once would let the background show
 * through the model mid-step.
 *
 * Called on every scroll tick, so it writes to the DOM directly and touches
 * only the frames whose state actually changes.
 */
export function setWalkPhase(wrapper: HTMLElement | null, phase: number) {
  if (!wrapper) return;

  const frames = wrapper.querySelectorAll<HTMLElement>("[data-walk-frame]");
  if (frames.length === 0) return;

  const last = frames.length - 1;
  const clamped = Math.min(Math.max(phase, 0), last);
  const current = Math.min(Math.floor(clamped), last);
  const next = Math.min(current + 1, last);
  const blend = clamped - current;

  // Skip the DOM work when neither the pair nor the blend has moved enough to
  // be visible — scrubbing settles with many sub-pixel updates.
  const key = `${current}:${blend.toFixed(2)}`;
  if (wrapper.dataset.walkPhase === key) return;

  const previous = wrapper.dataset.walkPair?.split(",").map(Number) ?? [];
  wrapper.dataset.walkPhase = key;
  wrapper.dataset.walkPair = `${current},${next}`;

  // Retire whichever frames were showing and are no longer part of the pair.
  for (const index of previous) {
    if (index !== current && index !== next && frames[index]) {
      frames[index].style.visibility = "hidden";
      frames[index].style.opacity = "0";
    }
  }

  const base = frames[current];
  base.style.visibility = "visible";
  base.style.opacity = "1";
  base.style.zIndex = "1";

  if (next !== current) {
    const incoming = frames[next];
    incoming.style.visibility = "visible";
    incoming.style.opacity = String(blend);
    incoming.style.zIndex = "2";
  }
}
