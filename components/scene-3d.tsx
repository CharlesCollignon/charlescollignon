"use client";

import { useRef, useEffect, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment } from "@react-three/drei";
import Spline from "@splinetool/react-spline";
import type { Application, SPEObject } from "@splinetool/runtime";
import type * as THREE from "three";
import { onSceneCovered } from "@/lib/scene-bus";

const SCENE_URL =
  "https://prod.spline.design/wBbmkii5XDthay9E/scene.splinecode";

const CAMERA_NAMES = [
  "Camera 2",
  "Camera",
  "Personal Camera",
  "Main Camera",
  "Default Camera",
];
const GROUP_NAMES = ["Scene", "Group", "Robot", "Character"];

/**
 * Camera keyframes, keyed by the `data-camera` attribute of page sections.
 * The camera eases from one pose to the next as each section reaches the top
 * of the viewport, whatever the sections' heights.
 */
const CAMERA_POSES: Record<string, { x: number; y: number; z: number }> = {
  hero: { x: 0, y: 160, z: 900 },
  about: { x: 0, y: -340, z: 12000 },
  work: { x: -50, y: 280, z: 200 },
  contact: { x: 0, y: 160, z: 900 },
};

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const smoothstep = (t: number) => t * t * (3 - 2 * t);

function findFirst(spline: Application, names: string[]) {
  for (const name of names) {
    const obj = spline.findObjectByName(name);
    if (obj) return obj;
  }
  return undefined;
}

export function Scene3D() {
  const targetRef = useRef<{ obj: SPEObject; isCamera: boolean } | null>(null);
  const applyRef = useRef<() => void>(() => {});
  const splineRef = useRef<Application | null>(null);

  function onLoad(spline: Application) {
    splineRef.current = spline;
    // Let Spline receive pointer events even though it sits behind the page.
    spline.setGlobalEvents(true);

    const camera = findFirst(spline, CAMERA_NAMES);
    const group = camera ? undefined : findFirst(spline, GROUP_NAMES);
    const obj = camera ?? group;
    if (!obj) {
      console.warn("Scene3D: no camera or root group found in Spline scene");
      return;
    }
    targetRef.current = { obj, isCamera: Boolean(camera) };
    applyRef.current();
  }

  useEffect(() => {
    let frame = 0;
    let stops: { top: number; pose: (typeof CAMERA_POSES)[string] }[] = [];

    const measure = () => {
      stops = Array.from(
        document.querySelectorAll<HTMLElement>("[data-camera]"),
      )
        .map((el) => ({
          top: el.getBoundingClientRect().top + window.scrollY,
          pose: CAMERA_POSES[el.dataset.camera ?? ""],
        }))
        .filter((s) => s.pose)
        .sort((a, b) => a.top - b.top);
    };

    const apply = () => {
      frame = 0;
      const target = targetRef.current;
      if (!target || stops.length === 0) return;

      const y = window.scrollY;
      let i = 0;
      while (i < stops.length - 2 && y >= stops[i + 1].top) i++;
      const from = stops[i];
      const to = stops[Math.min(i + 1, stops.length - 1)];
      const span = Math.max(to.top - from.top, 1);
      const t = smoothstep(Math.min(Math.max((y - from.top) / span, 0), 1));

      const px = lerp(from.pose.x, to.pose.x, t);
      const py = lerp(from.pose.y, to.pose.y, t);
      const pz = lerp(from.pose.z, to.pose.z, t);

      if (target.isCamera) {
        target.obj.position.x = px;
        target.obj.position.y = py;
        target.obj.position.z = pz;
      } else {
        // Moving the scene instead of the camera: invert, assuming a default camera z of 1200.
        target.obj.position.x = -px;
        target.obj.position.y = -py;
        target.obj.position.z = 1200 - pz;
      }
    };
    applyRef.current = apply;

    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(apply);
    };
    const onResize = () => {
      measure();
      onScroll();
    };

    // Section heights change with fonts, images and breakpoints.
    const ro = new ResizeObserver(onResize);
    ro.observe(document.body);

    window.addEventListener("scroll", onScroll, { passive: true });
    measure();
    apply();

    return () => {
      ro.disconnect();
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);

  // Stop rendering while opaque sections fully cover the scene.
  const [covered, setCovered] = useState(false);
  useEffect(
    () =>
      onSceneCovered((value) => {
        setCovered(value);
        if (value) splineRef.current?.stop();
        else splineRef.current?.play();
      }),
    [],
  );

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 h-dvh w-screen bg-white dark:bg-black"
    >
      <Spline scene={SCENE_URL} onLoad={onLoad} className="size-full" />
      <ForegroundScene3D paused={covered} />
    </div>
  );
}

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

function ForegroundScene3D({ paused }: { paused: boolean }) {
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
        <Environment preset="city" />
        <FloatingObject onDepthChange={onDepthChange} />
      </Canvas>
    </div>
  );
}
