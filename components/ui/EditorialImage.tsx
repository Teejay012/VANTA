"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Every photograph on the page goes through here.
 *
 * Two jobs beyond rendering an `<img>`:
 *
 *  1. It fades in once decoded, so a slow asset arrives as a dissolve rather
 *     than a pop.
 *  2. If the file is missing it renders a legible placeholder that names the
 *     asset and the command that fixes it — not the browser's broken-image
 *     glyph. The imagery is mirrored into public/assets by a script that has
 *     to run once (see scripts/sync-assets.mjs); when that has not happened,
 *     the page should say so in plain language instead of looking broken.
 */
export default function EditorialImage({
  src,
  alt,
  className = "",
  wrapperClassName = "",
  draggable = false,
  /** Rendered instead of the fallback label for purely decorative slots. */
  quiet = false,
  /** Skips the fade-in. For frames of a sequence, which must appear on cut. */
  instant = false,
  ...rest
}: {
  src: string;
  alt: string;
  className?: string;
  wrapperClassName?: string;
  draggable?: boolean;
  quiet?: boolean;
  instant?: boolean;
} & React.ImgHTMLAttributes<HTMLImageElement>) {
  const [state, setState] = useState<"loading" | "ready" | "failed">("loading");
  const imgRef = useRef<HTMLImageElement>(null);

  // A cached image can finish loading before React attaches onLoad — on a
  // repeat visit the event never fires and the image would sit at opacity 0
  // forever. Reconcile against the element's own state after mount, and again
  // whenever the source changes.
  useEffect(() => {
    const img = imgRef.current;
    if (!img || !img.complete) return;
    setState(img.naturalWidth > 0 ? "ready" : "failed");
  }, [src]);

  if (state === "failed") {
    const name = src.split("/").pop() ?? src;

    return (
      <div
        role="img"
        aria-label={`${alt} — image not available`}
        className={`flex items-center justify-center border border-current/15 bg-current/[0.04] p-4 ${wrapperClassName || className}`}
      >
        {!quiet && (
          <span className="max-w-[22ch] text-center text-[9px] leading-relaxed tracking-[0.18em] opacity-45">
            {name}
            <br />
            <span className="opacity-70">RUN npm run assets:sync</span>
          </span>
        )}
      </div>
    );
  }

  return (
    <img
      ref={imgRef}
      src={src}
      alt={alt}
      draggable={draggable}
      onLoad={() => setState("ready")}
      onError={() => setState("failed")}
      className={
        instant
          ? className
          : `${className} transition-opacity duration-700 ease-[var(--ease-editorial)] ${
              state === "ready" ? "opacity-100" : "opacity-0"
            }`
      }
      {...rest}
    />
  );
}
