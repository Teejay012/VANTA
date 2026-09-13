"use client";

import { Canvas } from "@react-three/fiber";
import type { MutableRefObject } from "react";
import ClothPlane from "./ClothPlane";

/**
 * Thin r3f wrapper so the whole three.js graph can be code-split away from the
 * initial bundle (see the dynamic import in FabricSection).
 */
export default function ClothCanvas({
  progressRef,
}: {
  progressRef: MutableRefObject<number>;
}) {
  return (
    <Canvas
      // Retina is enough; uncapped DPR on a 180² mesh is wasted fill rate.
      dpr={[1, 2]}
      camera={{ position: [0, 0, 3.2], fov: 45 }}
      gl={{ antialias: true, alpha: false }}
      // Matches --color-stone, so any pixel the cloth does not cover blends
      // into the section behind it rather than reading as a black gap.
      onCreated={({ gl }) => gl.setClearColor("#e8e6e1", 1)}
      // This canvas is purely decorative — let every pointer event through to
      // the copy and controls layered above it.
      style={{ pointerEvents: "none" }}
    >
      <ClothPlane progressRef={progressRef} />
    </Canvas>
  );
}
