"use client";

import { forwardRef } from "react";
import EditorialImage from "@/components/ui/EditorialImage";

/**
 * A model walking, as a single self-playing animated image.
 *
 * This used to be a stack of frames stepped by the scroll position, and that
 * was the wrong shape for the problem. Tying a gait to scroll means the model
 * walks in slow motion when you ease off and sprints when you flick — and
 * everyone has an exact instinct for what walking looks like, so any deviation
 * reads as broken. Worse, the stride length in the footage bears no relation to
 * how far the CSS transform carries them, so the feet skate.
 *
 * So the gait is decoupled from the scroll entirely. The animation plays at its
 * own natural cadence (it is a looping clip of the model walking on the spot,
 * cut at a pose-matched frame so the loop is seamless) and the hero timeline
 * only moves it across the stage. That is also what a runway actually looks
 * like: a constant walk, passing through.
 *
 * Being one element rather than forty makes overlap structurally impossible,
 * which is what produced the ghosting in the frame-stepping versions.
 */
const WalkingModel = forwardRef<
  HTMLDivElement,
  { src?: string; alt: string; className?: string }
>(function WalkingModel({ src, alt, className = "" }, ref) {
  return (
    <div ref={ref} className={className}>
      {/* `src` is withheld until the model is nearly due on stage. Each clip is
          about 1.4MB, and the second one is not needed until halfway through
          the hero — requesting it up front would double the cost of first
          paint for something nobody has scrolled to yet. */}
      {src ? (
        <EditorialImage
          src={src}
          alt={alt}
          wrapperClassName="h-full w-full"
          className="h-full w-full object-contain object-bottom"
        />
      ) : null}
    </div>
  );
});

export default WalkingModel;
