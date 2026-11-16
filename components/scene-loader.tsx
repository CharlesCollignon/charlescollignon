"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { ScenePoster } from "./scene-poster";

/** Plain backdrop in the scene's own colour, so nothing shifts while it loads. */
function Backdrop() {
  return (
    <div aria-hidden className="fixed inset-0 -z-10 bg-white dark:bg-black" />
  );
}

const Scene3D = dynamic(() => import("./scene-3d"), {
  ssr: false,
  loading: Backdrop,
});

type NavigatorHints = Navigator & {
  connection?: { saveData?: boolean };
  deviceMemory?: number;
};

/** Whether this device should get the still poster instead of live WebGL. */
function prefersPoster() {
  const nav = navigator as NavigatorHints;
  return (
    window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
    nav.connection?.saveData === true ||
    (nav.deviceMemory !== undefined && nav.deviceMemory < 4) ||
    (nav.hardwareConcurrency !== undefined && nav.hardwareConcurrency < 4)
  );
}

/**
 * The 3D background is the heaviest thing on the page. It starts loading once
 * the browser is idle after the first paint (or after 2 s at the latest), so
 * the hero text never competes with it. Constrained devices get a still frame.
 */
export function SceneLoader() {
  const [mode, setMode] = useState<"wait" | "live" | "poster">("wait");

  useEffect(() => {
    const decide = () => setMode(prefersPoster() ? "poster" : "live");
    if ("requestIdleCallback" in window) {
      const id = window.requestIdleCallback(decide, { timeout: 2000 });
      return () => window.cancelIdleCallback(id);
    }
    const id = setTimeout(decide, 600);
    return () => clearTimeout(id);
  }, []);

  if (mode === "live") return <Scene3D />;
  if (mode === "poster") return <ScenePoster />;
  return <Backdrop />;
}
