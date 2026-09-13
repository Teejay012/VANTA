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
 *
 * All frames load eagerly: a lazily-loaded frame would still be hidden when
 * the walk cut to it, leaving a gap. Only the poster is fetched at high
 * priority so the rest do not contend with first paint.
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
          // Frame 0 is the poster; the rest wait to be cut to.
          style={{ visibility: index === 0 ? "visible" : "hidden" }}
        >
          <EditorialImage
            src={src}
            // Only the first frame carries the description; the rest are the
            // same person mid-stride and would just repeat it.
            alt={index === 0 ? alt : ""}
            aria-hidden={index !== 0}
            quiet={index !== 0}
            // No decode fade: a frame must appear the instant it is cut to,
            // or the first pass through the walk flickers.
            instant
            // Every frame must be decoded before the walk reaches it, so none
            // can be lazy — but only the poster competes for first paint.
            fetchPriority={index === 0 ? "high" : "low"}
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
 * `phase` is a float in [0, frames-1]; the whole part picks the frame and the
 * fraction is discarded. Exactly one frame is ever on screen.
 *
 * An earlier version cross-faded into the next frame to soften the steps, and
 * it was a mistake: two walk poses overlaid at partial opacity show two sets of
 * legs, which reads as a smeared double exposure rather than motion. Film has
 * never blended one frame into the next — it cuts, and the eye does the rest.
 * Smoothness comes from frame count, so that is the knob that gets turned.
 *
 * Called on every scroll tick, so it writes to the DOM directly and bails as
 * soon as the frame has not actually changed.
 */
export function setWalkPhase(wrapper: HTMLElement | null, phase: number) {
  if (!wrapper) return;

  const frames = wrapper.querySelectorAll<HTMLElement>("[data-walk-frame]");
  if (frames.length === 0) return;

  const last = frames.length - 1;
  const index = Math.min(Math.max(Math.round(phase), 0), last);

  const recorded = wrapper.dataset.walkFrame;

  // First call: the markup left frame 0 showing as the poster, and the walk
  // may well start somewhere else. Sweep the whole stack once so nothing is
  // stranded — skipping this leaves the poster painted under every later
  // frame, which is exactly what a cross-fade looks like.
  if (recorded === undefined) {
    frames.forEach((frame, i) => {
      frame.style.visibility = i === index ? "visible" : "hidden";
    });
    wrapper.dataset.walkFrame = String(index);
    return;
  }

  const previous = Number(recorded);
  if (previous === index) return;
  wrapper.dataset.walkFrame = String(index);

  // Steady state: only the outgoing and incoming frames are touched.
  if (frames[previous]) frames[previous].style.visibility = "hidden";
  frames[index].style.visibility = "visible";
}
