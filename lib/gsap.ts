"use client";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/**
 * GSAP plugins must be registered exactly once, and only in the browser —
 * ScrollTrigger touches `window` at registration time. Importing this module
 * from any client component is enough; repeated imports are de-duplicated by
 * the module cache, and `registerPlugin` is idempotent anyway.
 */
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export { gsap, ScrollTrigger };
