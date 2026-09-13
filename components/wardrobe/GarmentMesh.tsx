"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { SURFACES, type Garment } from "@/lib/wardrobe";
import GltfGarment from "./GltfGarment";

/**
 * Builds a garment silhouette out of three.js primitives.
 *
 * These are deliberately abstracted forms — a luxury house's 3D viewer sells
 * the *cut* and the *material*, and a clean lathed silhouette under good studio
 * light does that better than a low-poly scan would. Everything is generated
 * in-engine, so the carousel carries no asset payload at all.
 *
 * Every mesh shares the single material instance passed in, which is what lets
 * the hover "inspection" lerp animate one object instead of a dozen.
 */
function Silhouette({
  garment,
  material,
}: {
  garment: Garment;
  material: THREE.Material;
}) {
  const geometries = useMemo(() => {
    const V = THREE.Vector2;

    switch (garment.silhouette) {
      case "bomber":
        return {
          // Torso shell. Two things make a revolve read as outerwear rather
          // than a vessel: the form must be clearly taller than it is wide,
          // and the profile must turn a hard corner at the shoulder instead of
          // rounding over into a dome.
          body: new THREE.LatheGeometry(
            [
              new V(0.68, -1.22), // hem
              new V(0.73, -1.1), // hem rib
              new V(0.73, -0.5),
              new V(0.75, 0.1),
              new V(0.78, 0.55),
              new V(0.8, 0.86), // shoulder — widest point
              new V(0.58, 0.98), // the corner
              new V(0.34, 1.02), // neck opening
            ],
            72,
          ),
          collar: new THREE.TorusGeometry(0.34, 0.075, 20, 64),
          hem: new THREE.TorusGeometry(0.73, 0.075, 20, 64),
          // Cuff tapers narrower than the bicep, as a set-in sleeve does.
          sleeve: new THREE.CylinderGeometry(0.21, 0.16, 1.5, 36, 1, true),
          // A raised centre-front strip. Nothing says "jacket" faster than a
          // visible zip line down the middle.
          placket: new THREE.BoxGeometry(0.075, 2.05, 0.05),
        };

      case "trench":
        return {
          // A-line: narrow at the shoulder, flaring hard to the hem.
          body: new THREE.LatheGeometry(
            [
              new V(1.02, -1.5), // flared hem
              new V(0.96, -1.15),
              new V(0.82, -0.5),
              new V(0.72, 0.05), // waist
              new V(0.76, 0.5),
              new V(0.79, 0.86), // shoulder
              new V(0.56, 0.99),
              new V(0.33, 1.04),
            ],
            72,
          ),
          collar: new THREE.TorusGeometry(0.33, 0.08, 20, 64),
          hem: new THREE.TorusGeometry(1.02, 0.05, 16, 72),
          sleeve: new THREE.CylinderGeometry(0.2, 0.15, 1.75, 36, 1, true),
          belt: new THREE.TorusGeometry(0.735, 0.05, 16, 64),
          placket: new THREE.BoxGeometry(0.07, 2.5, 0.05),
        };

      case "tote": {
        // Rounded slab built from an extruded, bevelled rectangle.
        const shape = new THREE.Shape();
        const w = 0.82;
        const h = 0.95;
        const r = 0.12;
        shape.moveTo(-w + r, -h);
        shape.lineTo(w - r, -h);
        shape.quadraticCurveTo(w, -h, w, -h + r);
        shape.lineTo(w, h - r);
        shape.quadraticCurveTo(w, h, w - r, h);
        shape.lineTo(-w + r, h);
        shape.quadraticCurveTo(-w, h, -w, h - r);
        shape.lineTo(-w, -h + r);
        shape.quadraticCurveTo(-w, -h, -w + r, -h);

        return {
          body: new THREE.ExtrudeGeometry(shape, {
            depth: 0.42,
            bevelEnabled: true,
            bevelSize: 0.07,
            bevelThickness: 0.07,
            bevelSegments: 8,
            curveSegments: 24,
          }).center(),
          // A half-torus reads as a carry handle.
          handle: new THREE.TorusGeometry(0.34, 0.045, 18, 48, Math.PI),
          hardware: new THREE.CylinderGeometry(0.05, 0.05, 0.04, 24),
        };
      }

      case "eyewear":
      default:
        return {
          rim: new THREE.TorusGeometry(0.42, 0.045, 18, 56),
          lens: new THREE.CircleGeometry(0.42, 48),
          bridge: new THREE.CylinderGeometry(0.035, 0.035, 0.3, 20),
          arm: new THREE.CylinderGeometry(0.03, 0.025, 1.5, 20),
        };
    }
  }, [garment.silhouette]);

  // Geometries are constructed imperatively, so release their GPU buffers when
  // the silhouette changes or the piece unmounts.
  useEffect(
    () => () =>
      Object.values(geometries).forEach((g) => (g as THREE.BufferGeometry)?.dispose()),
    [geometries],
  );

  switch (garment.silhouette) {
    case "bomber":
      return (
        // A lathe is a solid of revolution — circular in plan. Real outerwear
        // is far deeper across the shoulders than it is front-to-back, so the
        // whole silhouette is squashed on Z. This single scale is what turns
        // the revolve from a vessel into a garment.
        <group scale={[1, 1, 0.6]}>
          <mesh geometry={geometries.body} material={material} />
          <mesh geometry={geometries.collar} material={material} position={[0, 1.02, 0]} rotation={[Math.PI / 2, 0, 0]} />
          <mesh geometry={geometries.hem} material={material} position={[0, -1.2, 0]} rotation={[Math.PI / 2, 0, 0]} />
          {/* Clear of the 0.8 shoulder radius, so the arms read as arms rather
              than disappearing into the torso. Cuffs swing slightly outward. */}
          <mesh geometry={geometries.sleeve} material={material} position={[-0.9, 0.12, 0]} rotation={[0, 0, -0.13]} />
          <mesh geometry={geometries.sleeve} material={material} position={[0.9, 0.12, 0]} rotation={[0, 0, 0.13]} />
          {/* Sits proud of the widest point of the body so it always reads. */}
          <mesh geometry={geometries.placket} material={material} position={[0, -0.08, 0.84]} />
        </group>
      );

    case "trench":
      return (
        // Flattened a little less than the bomber — a coat holds more volume.
        <group scale={[1, 1, 0.66]}>
          <mesh geometry={geometries.body} material={material} />
          <mesh geometry={geometries.collar} material={material} position={[0, 1.04, 0]} rotation={[Math.PI / 2, 0, 0]} />
          <mesh geometry={geometries.hem} material={material} position={[0, -1.5, 0]} rotation={[Math.PI / 2, 0, 0]} />
          <mesh geometry={geometries.belt} material={material} position={[0, 0.05, 0]} rotation={[Math.PI / 2, 0, 0]} />
          <mesh geometry={geometries.sleeve} material={material} position={[-0.93, 0.0, 0]} rotation={[0, 0, -0.1]} />
          <mesh geometry={geometries.sleeve} material={material} position={[0.93, 0.0, 0]} rotation={[0, 0, 0.1]} />
          <mesh geometry={geometries.placket} material={material} position={[0, -0.22, 0.84]} />
        </group>
      );

    case "tote":
      return (
        <group>
          <mesh geometry={geometries.body} material={material} />
          <mesh geometry={geometries.handle} material={material} position={[0, 0.98, 0.1]} />
          <mesh geometry={geometries.handle} material={material} position={[0, 0.98, -0.1]} />
          <mesh geometry={geometries.hardware} material={material} position={[0, 0.1, 0.3]} rotation={[Math.PI / 2, 0, 0]} />
        </group>
      );

    case "eyewear":
    default:
      return (
        <group>
          <mesh geometry={geometries.rim} material={material} position={[-0.5, 0, 0]} />
          <mesh geometry={geometries.rim} material={material} position={[0.5, 0, 0]} />
          <mesh geometry={geometries.lens} material={material} position={[-0.5, 0, 0]} />
          <mesh geometry={geometries.lens} material={material} position={[0.5, 0, 0]} />
          <mesh geometry={geometries.bridge} material={material} position={[0, 0.06, 0]} rotation={[0, 0, Math.PI / 2]} />
          {/* Temples fold back along -Z. */}
          <mesh geometry={geometries.arm} material={material} position={[-0.88, 0.06, -0.68]} rotation={[Math.PI / 2, 0, 0.2]} />
          <mesh geometry={geometries.arm} material={material} position={[0.88, 0.06, -0.68]} rotation={[Math.PI / 2, 0, -0.2]} />
        </group>
      );
  }
}

/** Scratch vector reused by the per-frame scale lerp — avoids per-frame GC. */
const scratchScale = new THREE.Vector3();

/**
 * One piece on the rail: the silhouette, its material, and the hover
 * "material inspection" state that drives roughness and reflectivity.
 */
export default function GarmentMesh({
  garment,
  isActive,
  hovered,
  rotationRef,
}: {
  garment: Garment;
  /** True for the piece the camera is currently parked in front of. */
  isActive: boolean;
  hovered: boolean;
  /** Shared drag rotation, in radians, written by the pointer handlers. */
  rotationRef: React.MutableRefObject<number>;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const surface = SURFACES[garment.surface];

  const material = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(surface.color),
        roughness: surface.roughness,
        metalness: surface.metalness,
        clearcoat: surface.clearcoat,
        clearcoatRoughness: surface.clearcoatRoughness,
        sheen: surface.sheen,
        sheenColor: new THREE.Color("#9a9a96"),
        envMapIntensity: surface.envMapIntensity,
        // The lathed shells are open surfaces, so both faces must be shaded.
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 1,
      }),
    [surface],
  );

  useEffect(() => () => material.dispose(), [material]);

  useFrame((state, delta) => {
    const group = groupRef.current;
    if (!group) return;

    // Frame-rate independent approach factor.
    const k = Math.min(1, delta * 4);

    // Only the active piece answers the drag; the rest idle on a slow turn so
    // the rail never looks frozen.
    if (isActive) {
      group.rotation.y += (rotationRef.current - group.rotation.y) * k;
    } else {
      group.rotation.y += delta * 0.12;
    }

    // Inactive pieces recede and fade into the background.
    const target = isActive ? 1 : 0.74;
    group.scale.lerp(scratchScale.set(target, target, target), k);

    const restY =
      (isActive ? 0 : -0.25) + Math.sin(state.clock.elapsedTime * 0.6) * 0.03;
    group.position.y += (restY - group.position.y) * k;

    // Material inspection: lerp towards the "inspect" values while hovered.
    const to = hovered && isActive ? surface.inspect : surface;
    material.roughness += (to.roughness - material.roughness) * k;
    material.envMapIntensity += (to.envMapIntensity - material.envMapIntensity) * k;
    material.clearcoat += (to.clearcoat - material.clearcoat) * k;
    material.opacity += ((isActive ? 1 : 0.35) - material.opacity) * k;
  });

  const silhouette = <Silhouette garment={garment} material={material} />;

  return (
    <group ref={groupRef}>
      {garment.modelUrl ? (
        // A scanned GLB when the catalogue entry names one, with the
        // procedural form standing in while it loads or if it never arrives.
        <GltfGarment
          url={garment.modelUrl}
          material={material}
          fallback={silhouette}
        />
      ) : (
        silhouette
      )}
    </group>
  );
}
