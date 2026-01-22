"use client";

import { useRef, useEffect, useState, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment } from "@react-three/drei";
import Spline from "@splinetool/react-spline";
import type { Application } from "@splinetool/runtime";
import * as THREE from "three";

const SCENE_URL =
  "https://prod.spline.design/wBbmkii5XDthay9E/scene.splinecode";

export function Scene3D() {
  const splineRef = useRef<Application | null>(null);

  function onLoad(spline: Application) {
    splineRef.current = spline;
    // Enable global events so Spline can receive mouse events even when behind other elements
    spline.setGlobalEvents(true);
  }

  // Linear interpolation helper
  function lerp(start: number, end: number, t: number) {
    return start * (1 - t) + end * t;
  }

  useEffect(() => {
    // Scroll animation logic
    const handleScrollAnimation = () => {
      if (!splineRef.current) return;
      const spline = splineRef.current;

      // Find the Camera to animate
      // Try multiple common names
      // Strategy: Find explicit Camera OR fall back to moving the 'Scene'/'Group'
      let targetObj =
        spline.findObjectByName("Camera 2") ||
        spline.findObjectByName("Camera") ||
        spline.findObjectByName("Personal Camera") ||
        spline.findObjectByName("Main Camera") ||
        spline.findObjectByName("Default Camera");

      let isCamera = true;

      // Fallback: If no Camera, find the robot's head (which we know exists)
      // and get the Root Group (Scene) to move that instead.
      if (!targetObj) {
        // Try finding "Scene" or "Group" directly
        targetObj =
          spline.findObjectByName("Scene") || spline.findObjectByName("Group");

        if (!targetObj) {
          // Try to use the Head as a reference to find the parent
          const head =
            spline.findObjectByName("Head") || spline.findObjectByName("head");
          if (head) {
            // Try to grab a parent if exposed, otherwise we are stuck directly modifying head?
            // No, that would be weird.
            // Let's assume there is an object named "Robot" or "Character".
            targetObj =
              spline.findObjectByName("Robot") ||
              spline.findObjectByName("Character");
          }
        }

        if (targetObj) {
          isCamera = false;
        }
      }

      if (!targetObj) {
        if (Math.random() < 0.05)
          console.warn("Scene3D: No target object found (Camera or Group)!");
        return;
      }

      const h = window.innerHeight;
      const scrollY = window.scrollY;

      const progress = scrollY / h;

      // Target Coordinates (for Camera)
      // Hero (0,0,1200) -> About (600,0,1600) -> Work (-500,100,700) -> Contact (0,0,1200)
      const states = [
        { x: 0, y: 160, z: 900 },
        { x: 0, y: 50, z: 8000 },
        { x: -50, y: 280, z: 200 },
        { x: 0, y: 160, z: 900 },
      ];

      const target = { ...states[0] };

      if (progress < 1) {
        const t = Math.min(progress, 1);
        const easeT = t * t * (3 - 2 * t);
        target.x = lerp(states[0].x, states[1].x, easeT);
        target.y = lerp(states[0].y, states[1].y, easeT);
        target.z = lerp(states[0].z, states[1].z, easeT);
      } else if (progress < 2) {
        const t = Math.min(progress - 1, 1);
        const easeT = t * t * (3 - 2 * t);
        target.x = lerp(states[1].x, states[2].x, easeT);
        target.y = lerp(states[1].y, states[2].y, easeT);
        target.z = lerp(states[1].z, states[2].z, easeT);
      } else {
        const t = Math.min(progress - 2, 1);
        const easeT = t * t * (3 - 2 * t);
        target.x = lerp(states[2].x, states[3].x, easeT);
        target.y = lerp(states[2].y, states[3].y, easeT);
        target.z = lerp(states[2].z, states[3].z, easeT);
      }

      // Apply transformation
      if (isCamera) {
        targetObj.position.x = target.x;
        targetObj.position.y = target.y;
        targetObj.position.z = target.z;
      } else {
        // Invert logic if moving the Object instead of Camera
        // To make object appear "Right" (Camera Left), we move Object Right? No.
        // Camera move Right (+X) -> Object appears Left.
        // So if we want Object Left, we move Object to -X (Relative to Camera).
        // Actually, if Camera moves +X, Object stays at 0.
        // If Camera frozen at 0, and we want same view, we move Object -X.

        targetObj.position.x = -target.x;
        targetObj.position.y = -target.y;

        // Z Logic:
        // Camera at 1200 (default). Object at 0. Diff = 1200.
        // Target Z = 1600 (Farther).
        // Move Object to -400. (1200 - (-400) = 1600).
        // So Object Z = DefaultCamZ - TargetZ.
        // Assuming DefaultCamZ is around 1000-1200. Let's assume 1200 for math consistency.
        targetObj.position.z = 1200 - target.z;
      }
    };

    window.addEventListener("scroll", handleScrollAnimation);
    // Trigger once on mount
    handleScrollAnimation();

    return () => window.removeEventListener("scroll", handleScrollAnimation);
  }, []);

  return (
    <div
      className="fixed inset-0 h-screen w-screen"
      style={{
        backgroundColor: "transparent",
        zIndex: -10,
        pointerEvents: "none",
      }}
    >
      <Suspense
        fallback={
          <div
            className="w-full h-full flex items-center justify-center text-zinc-500"
            style={{ backgroundColor: "transparent" }}
          >
            Loading 3D Scene...
          </div>
        }
      >
        <Spline
          scene={SCENE_URL}
          onLoad={onLoad}
          style={{
            width: "100%",
            height: "100%",
            backgroundColor: "transparent",
          }}
        />
      </Suspense>
    </div>
  );
}

function BackgroundFloatingObject({
  scrollY,
  onDepthChange,
}: {
  scrollY: number;
  onDepthChange: (front: boolean) => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const isFrontRef = useRef(true);

  useFrame((state) => {
    if (!meshRef.current) return;

    const t = state.clock.getElapsedTime();

    // Random orbit parameters
    const radiusX = 3.5 + Math.sin(t * 0.3) * 1.5; // Radius fluctuates
    const radiusZ = 2 + Math.cos(t * 0.2) * 1;

    // Orbit around center (0,0)
    meshRef.current.position.x = Math.sin(t * 0.4) * radiusX;

    // Simulate depth by moving in Z
    const zPos = Math.cos(t * 0.4) * radiusZ;
    meshRef.current.position.z = zPos;

    // Check depth to toggle z-index
    // If z > 0, it's in front. If z < 0, it's behind.
    const isNowFront = zPos > 0;
    if (isNowFront !== isFrontRef.current) {
      isFrontRef.current = isNowFront;
      onDepthChange(isNowFront);
    }

    // Vertical movement:
    // Start at top (y=3) and move down with scroll
    const scrollOffset = scrollY * 0.005;
    meshRef.current.position.y = 3 - scrollOffset + Math.sin(t * 0.5) * 0.5;

    // Random rotation
    meshRef.current.rotation.x = t * 0.3;
    meshRef.current.rotation.y = t * 0.2;
  });

  const materialProps = {
    roughness: 0.1,
    metalness: 0.2,
    clearcoat: 1,
    clearcoatRoughness: 0.1,
    iridescence: 1,
    iridescenceIOR: 1.6,
    iridescenceThicknessRange: [200, 1000] as [number, number],
  };

  return (
    <mesh ref={meshRef} position={[0, 4, 0]}>
      {" "}
      {/* Start higher up */}
      <torusKnotGeometry args={[0.6, 0.2, 256, 64]} />
      <meshPhysicalMaterial
        color="#3b82f6"
        emissive="#1d4ed8"
        emissiveIntensity={0.2}
        {...materialProps}
      />
    </mesh>
  );
}

export function ForegroundScene3D() {
  const [scrollY, setScrollY] = useState(0);
  const [zIndex, setZIndex] = useState(-5); // Start in front

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none" style={{ zIndex }}>
      <Canvas
        camera={{ position: [0, 0, 8], fov: 50 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={1} />
        <directionalLight position={[5, 2, 5]} intensity={1} />
        <Environment preset="city" />
        <BackgroundFloatingObject
          scrollY={scrollY}
          onDepthChange={(front) => setZIndex(front ? -5 : -20)}
        />
      </Canvas>
    </div>
  );
}
