"use client";

import dynamic from "next/dynamic";

/**
 * The 3D background loads after the page content, never blocking it. Until
 * then a plain backdrop in the scene's own colour keeps the page from shifting.
 */
export const SceneLoader = dynamic(() => import("./scene-3d"), {
  ssr: false,
  loading: () => (
    <div aria-hidden className="fixed inset-0 -z-10 bg-white dark:bg-black" />
  ),
});
