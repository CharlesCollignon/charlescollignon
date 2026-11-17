"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type * as THREE from "three";

/**
 * The iridescent torus knot that orbits the robot. It shares the robot's
 * canvas, so it passes in front of and behind it with real depth.
 * Units match the robot scene (Spline units).
 */
export function Torus() {
  const ref = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const mesh = ref.current;
    if (!mesh) return;
    const t = state.clock.getElapsedTime();
    const rx = 380 + Math.sin(t * 0.3) * 160;
    const rz = 240 + Math.cos(t * 0.2) * 110;
    mesh.position.x = Math.sin(t * 0.4) * rx;
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
