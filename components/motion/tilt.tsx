"use client";

import { useRef, type ReactNode } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "motion/react";
import { cn } from "@/lib/utils";

const SPRING = { stiffness: 150, damping: 20, mass: 0.5 };

/**
 * Tilts its content in 3D toward the pointer. Listens on its own box, ignores
 * touch, and does nothing for reduced motion (springs stay at rest).
 */
export function Tilt({
  children,
  max = 8,
  className,
}: {
  children: ReactNode;
  /** Maximum rotation in degrees. */
  max?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const rotateY = useSpring(useTransform(px, [-0.5, 0.5], [-max, max]), SPRING);
  const rotateX = useSpring(useTransform(py, [-0.5, 0.5], [max, -max]), SPRING);

  const onPointerMove = (e: React.PointerEvent) => {
    if (e.pointerType === "touch" || !ref.current) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const r = ref.current.getBoundingClientRect();
    px.set((e.clientX - r.left) / r.width - 0.5);
    py.set((e.clientY - r.top) / r.height - 0.5);
  };
  const reset = () => {
    px.set(0);
    py.set(0);
  };

  return (
    <div
      ref={ref}
      className={cn("perspective-[1600px]", className)}
      onPointerMove={onPointerMove}
      onPointerLeave={reset}
    >
      <motion.div
        className="size-full transform-3d"
        style={{ rotateX, rotateY }}
      >
        {children}
      </motion.div>
    </div>
  );
}
