"use client";

import { useRef, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Spline from "@splinetool/react-spline";
import type { Application } from "@splinetool/runtime";
import { onSceneCovered } from "@/lib/scene-bus";
import { useMediaQuery } from "@/hooks/use-media-query";
import { createRobotRig, whenAtRest, type RobotRig } from "./robot-rig";

// The floating torus pulls in its own three.js: only load it where it's worth it.
const SceneTorus = dynamic(() => import("./scene-torus"), { ssr: false });

const SCENE_URL =
  "https://prod.spline.design/wBbmkii5XDthay9E/scene.splinecode";

/**
 * The fixed 3D background: the Spline robot, brought to life by the robot rig
 * (see robot-rig.ts), plus a floating torus on capable desktops. Rendering
 * pauses while opaque sections cover it or the tab is hidden.
 */
export default function Scene3D() {
  const [loaded, setLoaded] = useState(false);
  const [covered, setCovered] = useState(false);
  const richScene = useMediaQuery(
    "(min-width: 768px) and (pointer: fine) and (prefers-reduced-motion: no-preference)",
  );
  const splineRef = useRef<Application | null>(null);
  const rigRef = useRef<RobotRig | null>(null);
  const coveredRef = useRef(false);
  const cancelRestRef = useRef<() => void>(() => {});

  const sync = () => {
    const active = !coveredRef.current && document.visibilityState === "visible";
    if (active) {
      splineRef.current?.play();
      rigRef.current?.start();
    } else {
      rigRef.current?.stop();
      splineRef.current?.stop();
    }
  };

  function onLoad(spline: Application) {
    splineRef.current = spline;
    // Let Spline receive pointer events (head look-at) though it sits behind the page.
    spline.setGlobalEvents(true);
    setLoaded(true);
    sync();
    // Take over once the scene's own intro (the robot rising in) has played.
    cancelRestRef.current = whenAtRest(spline, () => {
      if (splineRef.current !== spline) return;
      rigRef.current = createRobotRig(spline);
      if (!rigRef.current) console.warn("Scene3D: robot rig not found in Spline scene");
      sync();
    });
  }

  useEffect(() => {
    const offCovered = onSceneCovered((value) => {
      coveredRef.current = value;
      setCovered(value);
      sync();
    });
    document.addEventListener("visibilitychange", sync);
    return () => {
      offCovered();
      document.removeEventListener("visibilitychange", sync);
      cancelRestRef.current();
      rigRef.current?.stop();
      splineRef.current = null;
    };
  }, []);

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 h-dvh w-screen bg-white dark:bg-black"
    >
      <Spline
        scene={SCENE_URL}
        onLoad={onLoad}
        className="size-full transition-opacity duration-1000"
        style={{ opacity: loaded ? 1 : 0 }}
      />
      {richScene && loaded && <SceneTorus paused={covered} />}
    </div>
  );
}
