import { useEffect, useLayoutEffect } from "react";

/**
 * `useLayoutEffect` warns when it runs during SSR. Animations need the layout
 * pass, so use it in the browser and fall back to `useEffect` on the server.
 */
export const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;
