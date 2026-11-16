"use client";

import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import type * as THREE from "three";

/** The iridescent torus knot that orbits the robot, in front of and behind it. */
function FloatingObject({
  onDepthChange,
}: {
  onDepthChange: (front: boolean) => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const isFrontRef = useRef(true);

  useFrame((state) => {
    const mesh = meshRef.current;
    if (!mesh) return;

    const t = state.clock.getElapsedTime();
    const radiusX = 3.5 + Math.sin(t * 0.3) * 1.5;
    const radiusZ = 2 + Math.cos(t * 0.2) * 1;

    mesh.position.x = Math.sin(t * 0.4) * radiusX;
    const z = Math.cos(t * 0.4) * radiusZ;
    mesh.position.z = z;

    const isFront = z > 0;
    if (isFront !== isFrontRef.current) {
      isFrontRef.current = isFront;
      onDepthChange(isFront);
    }

    // Starts near the top and drifts down as the page scrolls.
    mesh.position.y = 3 - window.scrollY * 0.005 + Math.sin(t * 0.5) * 0.5;
    mesh.rotation.x = t * 0.3;
    mesh.rotation.y = t * 0.2;
  });

  return (
    <mesh ref={meshRef} position={[0, 4, 0]}>
      <torusKnotGeometry args={[0.6, 0.2, 256, 64]} />
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

export default function SceneTorus({ paused }: { paused: boolean }) {
  const layerRef = useRef<HTMLDivElement>(null);

  // Swap the layer's z-index directly so depth changes don't re-render the canvas.
  const onDepthChange = (front: boolean) => {
    if (layerRef.current) layerRef.current.style.zIndex = front ? "-5" : "-20";
  };

  return (
    <div
      ref={layerRef}
      className="pointer-events-none fixed inset-0 transition-opacity duration-500"
      style={{ zIndex: -5, opacity: paused ? 0 : 1 }}
    >
      <Canvas
        camera={{ position: [0, 0, 8], fov: 50 }}
        frameloop={paused ? "never" : "always"}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={1} />
        <directionalLight position={[5, 2, 5]} intensity={1} />
        {/* Procedural studio lighting: no HDR download. */}
        <Environment resolution={128} frames={1}>
          <Lightformer intensity={2} position={[0, 5, -9]} scale={[10, 10, 1]} />
          <Lightformer intensity={2} rotation-y={Math.PI / 2} position={[-5, 1, -1]} scale={[20, 0.5, 1]} />
          <Lightformer intensity={1.5} rotation-y={-Math.PI / 2} position={[10, 1, 0]} scale={[20, 1, 1]} />
          <Lightformer form="ring" color="#6b8cff" intensity={6} scale={3} position={[-4, 3, 6]} target={[0, 0, 0]} />
        </Environment>
        <FloatingObject onDepthChange={onDepthChange} />
      </Canvas>
    </div>
  );
}
