"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type * as THREE from "three";

/**
 * The iridescent torus knot that orbits the character, following it around the
 * page. It shares the character's canvas, so it passes in front of and behind it
 * with real depth.
 * Units match the scene (the character is 547 units tall).
 */
export function Torus() {
  const ref = useRef<THREE.Mesh>(null);
  const bot = useRef<THREE.Object3D | null>(null);
  const center = useRef(0);

  useFrame((state, dt) => {
    const mesh = ref.current;
    if (!mesh) return;
    const t = state.clock.getElapsedTime();
    // Orbit the character wherever the choreography takes it.
    bot.current ??= state.scene.getObjectByName("Bot") ?? null;
    const target = bot.current?.position.x ?? 0;
    center.current += (target - center.current) * (1 - Math.exp(-3 * Math.min(dt, 0.05)));
    const rx = 380 + Math.sin(t * 0.3) * 160;
    const rz = 240 + Math.cos(t * 0.2) * 110;
    mesh.position.x = center.current + Math.sin(t * 0.4) * rx;
    mesh.position.z = Math.cos(t * 0.4) * rz;
    // Starts high and drifts down as the page scrolls.
    mesh.position.y = 420 - window.scrollY * 0.45 + Math.sin(t * 0.5) * 50;
    mesh.rotation.x = t * 0.3;
    mesh.rotation.y = t * 0.2;
  });

  return (
    <mesh ref={ref} position={[0, 420, 0]}>
      <torusKnotGeometry args={[60, 20, 220, 48]} />
      <meshPhysicalMaterial
        color="#3b82f6"
        emissive="#1d4ed8"
        emissiveIntensity={0.2}
        roughness={0.1}
        metalness={0.7}
        clearcoat={1}
        clearcoatRoughness={0.1}
        iridescence={1}
        iridescenceIOR={1.6}
        iridescenceThicknessMinimum={200}
        iridescenceThicknessMaximum={1000}
      />
    </mesh>
  );
}
