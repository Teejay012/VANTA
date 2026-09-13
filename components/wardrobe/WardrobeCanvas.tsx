"use client";

import { useRef, type MutableRefObject } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows, Environment, Lightformer } from "@react-three/drei";
import * as THREE from "three";
import GarmentMesh from "./GarmentMesh";
import { RAIL_SPACING, WARDROBE } from "@/lib/wardrobe";

/**
 * Glides the camera along the rail to whichever piece is active. This is the
 * "smooth camera transition" between garments — the pieces themselves never
 * move laterally, the camera travels past them, which keeps the parallax
 * between the rail and the background honest.
 */
function RailCamera({ activeIndex }: { activeIndex: number }) {
  const { camera } = useThree();
  const lookAt = useRef(new THREE.Vector3());

  useFrame((_, delta) => {
    const targetX = activeIndex * RAIL_SPACING;
    const k = Math.min(1, delta * 2.6);

    camera.position.x += (targetX - camera.position.x) * k;
    // A slight lateral overshoot of the look-at point adds a touch of swing
    // to the move, the way a dolly shot settles.
    lookAt.current.lerp(new THREE.Vector3(targetX, 0, 0), k * 1.15);
    camera.lookAt(lookAt.current);
  });

  return null;
}

export default function WardrobeCanvas({
  activeIndex,
  hoveredId,
  onHover,
  rotationRef,
}: {
  activeIndex: number;
  hoveredId: string | null;
  onHover: (id: string | null) => void;
  rotationRef: MutableRefObject<number>;
}) {
  return (
    <Canvas
      dpr={[1, 2]}
      camera={{ position: [0, 0, 6.4], fov: 38 }}
      gl={{ antialias: true, alpha: true }}
      // Physically-correct tone mapping is what keeps the leather from blowing
      // out when the inspection state pushes reflections up.
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.05;
      }}
    >
      <RailCamera activeIndex={activeIndex} />

      {/* -- Studio rig ---------------------------------------------------- */}
      <ambientLight intensity={0.35} />
      <directionalLight position={[4, 6, 5]} intensity={2.1} />
      <directionalLight position={[-6, 2, 3]} intensity={0.7} />
      {/* Rim light from behind separates the matte black from the black set. */}
      <directionalLight position={[0, 3, -6]} intensity={1.4} />

      {/*
        A procedural environment built from Lightformers rather than an HDRI
        file: no network fetch, no CDN dependency, and it gives exactly the
        long softbox reflections a product viewer wants.
      */}
      <Environment resolution={256} frames={1}>
        <Lightformer
          form="rect"
          intensity={3.2}
          position={[0, 4, 2]}
          scale={[10, 4, 1]}
          rotation={[-Math.PI / 2.2, 0, 0]}
          color="#ffffff"
        />
        <Lightformer
          form="rect"
          intensity={1.4}
          position={[-5, 0, 1]}
          scale={[3, 8, 1]}
          rotation={[0, Math.PI / 2, 0]}
          color="#d8d8d4"
        />
        <Lightformer
          form="rect"
          intensity={1.1}
          position={[5, 0, 1]}
          scale={[3, 8, 1]}
          rotation={[0, -Math.PI / 2, 0]}
          color="#c8c8c4"
        />
        <Lightformer
          form="ring"
          intensity={2.0}
          position={[0, 0, -6]}
          scale={5}
          color="#ffffff"
        />
      </Environment>

      {/* -- The rail ------------------------------------------------------- */}
      {WARDROBE.map((garment, index) => (
        <group
          key={garment.id}
          position={[index * RAIL_SPACING, 0, 0]}
          onPointerOver={(event) => {
            event.stopPropagation();
            onHover(garment.id);
          }}
          onPointerOut={() => onHover(null)}
        >
          <GarmentMesh
            garment={garment}
            isActive={index === activeIndex}
            hovered={hoveredId === garment.id}
            rotationRef={rotationRef}
          />
        </group>
      ))}

      {/* Grounding shadow travels with the camera so every piece gets one. */}
      <ContactShadows
        position={[activeIndex * RAIL_SPACING, -1.62, 0]}
        opacity={0.55}
        scale={12}
        blur={2.6}
        far={4}
        resolution={512}
        color="#000000"
      />
    </Canvas>
  );
}
