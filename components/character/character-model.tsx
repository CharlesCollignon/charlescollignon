"use client";

import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { createRig, type Rig } from "./rig";

export const CHARACTER_URL = "/models/humanoid.glb";

/** Glossy white ceramic: reads on both themes and catches the studio lights. */
const makeMaterial = () =>
  new THREE.MeshPhysicalMaterial({
    color: "#f2f1ee",
    metalness: 0,
    roughness: 0.3,
    clearcoat: 1,
    clearcoatRoughness: 0.08,
    envMapIntensity: 0.65,
  });

/**
 * The character: a skinned mesh with Mixamo motion capture (built by
 * scripts/build-humanoid.mjs), animated by rig.ts. The model is CC BY 4.0,
 * credited in the footer (CHARACTER_CREDIT in lib/site.ts).
 */
export function CharacterModel({ paused }: { paused: boolean }) {
  const { scene, animations } = useGLTF(CHARACTER_URL, false, true);
  const camera = useThree((s) => s.camera);
  const material = useMemo(() => makeMaterial(), []);
  const rigRef = useRef<Rig | null>(null);

  // Before the first frame: dress the model and attach the rig.
  useLayoutEffect(() => {
    scene.traverse((o) => {
      const mesh = o as THREE.SkinnedMesh;
      if (mesh.isMesh) {
        mesh.material = material;
        // The skinned pose moves outside the bind-pose bounds.
        mesh.frustumCulled = false;
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
  }, [scene, animations, camera, material]);

  useEffect(() => () => material.dispose(), [material]);

  useFrame((state, dt) => {
    if (paused) return;
    if (process.env.NODE_ENV === "development" && (window as unknown as { __characterFreeze?: boolean }).__characterFreeze) return;
    rigRef.current?.update(dt, state.clock.elapsedTime);
  });

  return <primitive object={scene} />;
}

useGLTF.preload(CHARACTER_URL, false, true);
