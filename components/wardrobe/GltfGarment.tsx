"use client";

import { Component, Suspense, useLayoutEffect, useMemo, type ReactNode } from "react";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";

/**
 * Catches a failed GLTF load and shows the procedural silhouette instead.
 *
 * `useGLTF` suspends while fetching and *throws* on failure — a 404, a network
 * error, or a CDN that does not send permissive CORS headers. Without a
 * boundary that throw would unmount the whole canvas, so every remote model is
 * wrapped in one and the procedural form is always the floor.
 */
class ModelErrorBoundary extends Component<
  { fallback: ReactNode; children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    // Not fatal — the piece simply renders as its procedural silhouette.
    console.warn("[wardrobe] 3D model failed to load, using silhouette:", error);
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

/**
 * Loads a GLB and normalises it: centred on the origin and uniformly scaled so
 * every piece on the rail reads at the same height, whatever units it was
 * authored in. The house material is applied over the top so a scanned asset
 * still obeys the monochrome palette and still responds to the hover
 * inspection lerp.
 */
function GltfModel({
  url,
  material,
  targetHeight,
}: {
  url: string;
  material: THREE.Material;
  targetHeight: number;
}) {
  const { scene } = useGLTF(url);

  // Clone so two entries pointing at the same URL do not share one graph.
  const model = useMemo(() => scene.clone(true), [scene]);

  useLayoutEffect(() => {
    const box = new THREE.Box3().setFromObject(model);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);

    const scale = size.y > 0 ? targetHeight / size.y : 1;
    model.scale.setScalar(scale);
    model.position.set(
      -center.x * scale,
      -center.y * scale,
      -center.z * scale,
    );

    model.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        (child as THREE.Mesh).material = material;
      }
    });
  }, [model, material, targetHeight]);

  return <primitive object={model} />;
}

export default function GltfGarment({
  url,
  material,
  targetHeight = 2.3,
  fallback,
}: {
  url: string;
  material: THREE.Material;
  targetHeight?: number;
  /** The procedural silhouette, shown while loading and if loading fails. */
  fallback: ReactNode;
}) {
  return (
    <ModelErrorBoundary fallback={fallback}>
      <Suspense fallback={fallback}>
        <GltfModel url={url} material={material} targetHeight={targetHeight} />
      </Suspense>
    </ModelErrorBoundary>
  );
}
