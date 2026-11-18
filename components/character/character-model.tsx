"use client";

import { useLayoutEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { createRig, type Rig } from "./rig";

export const CHARACTER_URL = "/models/character.glb";

/**
 * The character: a skinned mesh in its own brushed-silver material, with Mixamo
 * motion capture (built by scripts/build-character.mjs), animated by
 * rig.ts. The model is CC BY 4.0, credited in the footer (CHARACTER_CREDIT
 * in lib/site.ts).
 */
export function CharacterModel({ paused }: { paused: boolean }) {
  const { scene, animations } = useGLTF(CHARACTER_URL, false, true);
  const camera = useThree((s) => s.camera);
  const rigRef = useRef<Rig | null>(null);

  // Before the first frame: attach the rig.
  useLayoutEffect(() => {
    scene.traverse((o) => {
      const mesh = o as THREE.SkinnedMesh;
      if (mesh.isMesh) {
        // The skinned pose moves outside the bind-pose bounds.
        mesh.frustumCulled = false;
        // Keep the sculpted detail sharp at grazing angles.
        const material = mesh.material as THREE.MeshStandardMaterial;
        if (material.normalMap) material.normalMap.anisotropy = 8;
      }
    });
    const rig = createRig(scene, camera, animations);
    rigRef.current = rig;
    // Development-only handle for tuning poses from the console.
    if (process.env.NODE_ENV === "development") {
      (window as unknown as { __character: unknown }).__character = { scene, rig };
    }
    return () => {
      rig?.dispose();
      rigRef.current = null;
    };
  }, [scene, animations, camera]);

  useFrame((state, dt) => {
    if (paused) return;
    if (process.env.NODE_ENV === "development" && (window as unknown as { __characterFreeze?: boolean }).__characterFreeze) return;
    rigRef.current?.update(dt, state.clock.elapsedTime);
  });

  return <primitive object={scene} />;
}

useGLTF.preload(CHARACTER_URL, false, true);
