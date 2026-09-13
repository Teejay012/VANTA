/**
 * Feature detection for the two WebGL-backed sections. Both render a static
 * editorial fallback when this returns false, so the page is never broken by a
 * blocked or unavailable GPU context.
 */
export function hasWebGL(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const canvas = document.createElement("canvas");
    return Boolean(
      window.WebGLRenderingContext &&
        (canvas.getContext("webgl") || canvas.getContext("experimental-webgl")),
    );
  } catch {
    return false;
  }
}
