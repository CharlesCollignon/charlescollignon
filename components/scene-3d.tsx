"use client";

import { Suspense, useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import { onSceneCovered } from "@/lib/scene-bus";
import { useMediaQuery } from "@/hooks/use-media-query";
import { CharacterModel } from "./character/character-model";
import { Torus } from "./character/torus";

/**
 * The fixed 3D background: one three.js canvas with the character (animated
 * by character/rig.ts) and, on capable desktops, the orbiting torus. Rendering stops
 * while opaque sections cover it or the tab is hidden.
 */
export default function Scene3D() {
  const [covered, setCovered] = useState(false);
  const [hidden, setHidden] = useState(false);
  const richScene = useMediaQuery(
    "(min-width: 768px) and (pointer: fine) and (prefers-reduced-motion: no-preference)",
  );

  useEffect(() => {
    const onVisibility = () => setHidden(document.visibilityState !== "visible");
    document.addEventListener("visibilitychange", onVisibility);
    const offCovered = onSceneCovered(setCovered);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      offCovered();
    };
  }, []);

  const paused = covered || hidden;

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 h-dvh w-screen bg-white dark:bg-black"
    >
      <Canvas
        frameloop={paused ? "never" : "always"}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        // Looks straight ahead (an explicit rotation stops R3F aiming it at
        // the origin); the poses in character/rig.ts are framed for this zoom.
        camera={{ fov: 45, zoom: 1.7, near: 10, far: 20000, position: [0, 160, 900], rotation: [0, 0, 0] }}
      >
        {/* Studio lighting baked into an environment map (no HDR download).
            The chrome shows little but these reflections: a softbox above,
            tall strips either side of the camera, side bars, a floor bounce
            and a blue ring. */}
        <Environment resolution={512} frames={1}>
          <Lightformer intensity={3} position={[0, 6, -8]} scale={[12, 6, 1]} />
          <Lightformer intensity={3.5} rotation-x={Math.PI / 2} position={[0, 7, 0]} scale={[8, 8, 1]} />
          <Lightformer intensity={2.2} rotation-y={Math.PI / 2} position={[-6, 1, 0]} scale={[20, 1.2, 1]} />
          <Lightformer intensity={2.2} rotation-y={-Math.PI / 2} position={[6, 1, 0]} scale={[20, 1.2, 1]} />
          <Lightformer intensity={4} position={[-3.2, 0, 6]} target={[0, 0, 0]} scale={[0.7, 14, 1]} />
          <Lightformer intensity={4} position={[3.6, 0, 5.5]} target={[0, 0, 0]} scale={[0.5, 14, 1]} />
          <Lightformer intensity={1.2} position={[0, 2, 8]} scale={[6, 3, 1]} />
          <Lightformer intensity={0.8} rotation-x={-Math.PI / 2} position={[0, -5, 0]} scale={[10, 10, 1]} />
          <Lightformer form="ring" color="#6b8cff" intensity={5} scale={3} position={[-4, 3, 6]} target={[0, 0, 0]} />
        </Environment>
        {/* A cool rim from behind and a soft key, to separate black on black. */}
        <directionalLight position={[-400, 600, -700]} intensity={2.4} color="#cfd8ff" />
        <directionalLight position={[500, 400, 900]} intensity={0.6} />
        <ambientLight intensity={0.15} />

        <Suspense fallback={null}>
          <CharacterModel paused={paused} />
        </Suspense>
        {richScene && <Torus />}
      </Canvas>
    </div>
  );
}
