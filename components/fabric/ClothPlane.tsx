"use client";

import { useEffect, useMemo, useRef, type MutableRefObject } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { clothFragmentShader, clothVertexShader } from "@/lib/shaders/cloth";
import { ASSETS } from "@/lib/assets";

/**
 * The draped textile itself: one heavily-subdivided plane scaled to fill the
 * viewport, driven by the cloth shader.
 */
export default function ClothPlane({
  progressRef,
}: {
  /** Scroll progress 0..1, written by ScrollTrigger and read per frame. */
  progressRef: MutableRefObject<number>;
}) {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const { viewport } = useThree();

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uProgress: { value: 0 },
      uAmplitude: { value: 1 },
      uMap: { value: null as THREE.Texture | null },
      uHasMap: { value: 0 },
      uLight: { value: new THREE.Vector3(-0.45, 0.7, 0.85) },
      uBase: { value: new THREE.Color("#f2f0ec") },
      uShadow: { value: new THREE.Color("#6f6d68") },
    }),
    [],
  );

  // Load the photographic weave imperatively rather than with `useTexture`,
  // because a texture failure must degrade to the procedural weave rather than
  // throw into a Suspense boundary.
  useEffect(() => {
    let disposed = false;
    let texture: THREE.Texture | null = null;

    const loader = new THREE.TextureLoader();
    // Required for a cross-origin texture to be readable by the GPU.
    loader.setCrossOrigin("anonymous");
    loader.load(
      ASSETS.fabric,
      (loaded) => {
        // The effect may have torn down while the request was in flight.
        if (disposed) {
          loaded.dispose();
          return;
        }
        loaded.wrapS = THREE.RepeatWrapping;
        loaded.wrapT = THREE.RepeatWrapping;
        loaded.colorSpace = THREE.SRGBColorSpace;
        loaded.anisotropy = 8;
        texture = loaded;
        uniforms.uMap.value = loaded;
        uniforms.uHasMap.value = 1;
      },
      undefined,
      () => {
        // uHasMap stays 0 — the shader's procedural weave takes over.
      },
    );

    return () => {
      disposed = true;
      texture?.dispose();
      uniforms.uMap.value = null;
      uniforms.uHasMap.value = 0;
    };
  }, [uniforms]);

  useFrame((_, delta) => {
    const material = materialRef.current;
    if (!material) return;

    material.uniforms.uTime.value += delta;

    // Ease the uniform towards the scroll value instead of snapping to it, so
    // the drape keeps a little inertia of its own.
    const current = material.uniforms.uProgress.value as number;
    material.uniforms.uProgress.value +=
      (progressRef.current - current) * Math.min(1, delta * 4.5);
  });

  return (
    // Overscanned by 18%. Fold displacement pushes edge vertices along Z, and
    // under perspective a vertex pushed away from the camera pulls *inward* —
    // an exactly-sized plane would flash the clear colour along its edges.
    <mesh scale={[viewport.width * 1.18, viewport.height * 1.18, 1]}>
      {/* 1x1 plane scaled to the viewport; 180² segments give the folds enough
          resolution to stay smooth at the frontier. */}
      <planeGeometry args={[1, 1, 180, 180]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={clothVertexShader}
        fragmentShader={clothFragmentShader}
        uniforms={uniforms}
      />
    </mesh>
  );
}
