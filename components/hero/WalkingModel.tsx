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
          // Frame 0 is the poster; the rest wait to be switched in.
          style={{ visibility: index === 0 ? "visible" : "hidden" }}
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
 * Shows frame `index` of a WalkingModel and hides the rest.
 *
 * Called from a scroll handler on every tick, so it touches the DOM directly
 * and bails the moment the frame has not actually changed — React state here
 * would mean a render per stride.
 */
export function setWalkFrame(wrapper: HTMLElement | null, index: number) {
  if (!wrapper) return;

  const previous = Number(wrapper.dataset.currentFrame ?? -1);
  if (previous === index) return;
  wrapper.dataset.currentFrame = String(index);

  const frames = wrapper.querySelectorAll<HTMLElement>("[data-walk-frame]");
  frames.forEach((frame, i) => {
    frame.style.visibility = i === index ? "visible" : "hidden";
  });
}
