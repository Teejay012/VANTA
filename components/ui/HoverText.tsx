"use client";

import { type ElementType } from "react";

/**
 * Text that rolls over on hover: the visible line lifts away while an
 * identical copy rises into its place from below, one character at a time.
 *
 * Deliberately CSS-only. This is attached to most of the type on the page, so
 * a JS-driven version would mean dozens of listeners and a tween per glyph;
 * a transform plus a staggered `transition-delay` costs nothing and stays on
 * the compositor.
 *
 * Accessibility: the split characters are hidden from assistive tech and the
 * whole run is exposed once via `aria-label`, so a screen reader announces
 * "WISHLIST" rather than "W I S H L I S T".
 */
export default function HoverText({
  children,
  as = "span",
  className = "",
  /** Seconds between adjacent characters. Longer reads as more deliberate. */
  stagger = 0.018,
  /** Set false for a single-block roll rather than per-character. */
  perCharacter = true,
}: {
  children: string;
  as?: ElementType;
  className?: string;
  stagger?: number;
  perCharacter?: boolean;
}) {
  const units = perCharacter ? Array.from(children) : [children];

  // A polymorphic tag widens to the union of every intrinsic element, whose
  // `children` narrows to `never`. Pinning the props we actually pass keeps
  // the call sites type-checked without that collapse.
  const Tag = as as React.ComponentType<{
    className?: string;
    "aria-label"?: string;
    children?: React.ReactNode;
  }>;

  return (
    <Tag
      // `group/hover-text` scopes the hover so nesting inside another `group`
      // (a category card, say) does not cross-trigger.
      className={`group/hover-text relative inline-block ${className}`}
      aria-label={children}
    >
      {units.map((unit, index) => {
        const delay = `${index * stagger}s`;
        // Preserve the width of spaces, which collapse once split out.
        const glyph = unit === " " ? " " : unit;

        return (
          <span
            key={`${unit}-${index}`}
            aria-hidden
            className="relative inline-block overflow-hidden align-bottom"
            // The roll is a pure translate, so the line box never changes and
            // surrounding layout cannot shift.
            style={{ verticalAlign: "bottom" }}
          >
            <span
              className="inline-block transition-transform duration-[420ms] ease-[var(--ease-editorial)] group-hover/hover-text:-translate-y-full motion-reduce:transition-none motion-reduce:group-hover/hover-text:translate-y-0"
              style={{ transitionDelay: delay }}
            >
              {glyph}
            </span>
            <span
              className="absolute left-0 top-0 inline-block translate-y-full transition-transform duration-[420ms] ease-[var(--ease-editorial)] group-hover/hover-text:translate-y-0 motion-reduce:hidden"
              style={{ transitionDelay: delay }}
            >
              {glyph}
            </span>
          </span>
        );
      })}
    </Tag>
  );
}
