"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useMotionValue, useSpring } from "motion/react";
import { useTranslations } from "next-intl";
import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";

/**
 * A follower ring that grows over interactive elements and shows a label for
 * anything with `data-cursor="Label"`. Only mounts for fine pointers without
 * reduced motion; the native cursor stays visible for accessibility.
 */
export function Cursor() {
  const characterLabel = useTranslations("cursor")("character");
  const enabled = useMediaQuery(
    "(pointer: fine) and (prefers-reduced-motion: no-preference)",
  );
  const [visible, setVisible] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [label, setLabel] = useState<string | null>(null);

  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const sx = useSpring(x, { stiffness: 500, damping: 40, mass: 0.4 });
  const sy = useSpring(y, { stiffness: 500, damping: 40, mass: 0.4 });

  useEffect(() => {
    if (!enabled) return;

    const onMove = (e: PointerEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
      setVisible(true);

      const target = e.target instanceof Element ? e.target : null;
      const labelled = target?.closest<HTMLElement>("[data-cursor]");
      // The 3D character sets this class while the pointer is over it.
      const overCharacter = document.documentElement.classList.contains("character-hover");
      setLabel(labelled?.dataset.cursor || (overCharacter ? characterLabel : null));
      setHovering(
        Boolean(labelled || overCharacter || target?.closest("a, button, [role='button']")),
      );
    };
    const onLeave = () => setVisible(false);

    window.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    return () => {
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
    };
  }, [enabled, x, y, characterLabel]);

  if (!enabled) return null;

  const size = label ? 88 : hovering ? 48 : 12;

  return (
    <motion.div
      aria-hidden
      className={cn(
        "pointer-events-none fixed left-0 top-0 z-200 flex items-center justify-center rounded-full text-[11px] font-semibold uppercase tracking-[0.12em] transition-colors duration-200",
        // Plain dot/ring inverts whatever is under it; a labelled cursor is a solid pill so the label stays legible on any colour.
        label
          ? "bg-zinc-950 text-white shadow-lg dark:bg-white dark:text-zinc-950"
          : "bg-white mix-blend-difference",
      )}
      style={{ x: sx, y: sy, translateX: "-50%", translateY: "-50%" }}
      animate={{ width: size, height: size, opacity: visible ? 1 : 0 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
    >
      <AnimatePresence>
        {label && (
          <motion.span
            key={label}
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.6 }}
            transition={{ duration: 0.15 }}
          >
            {label}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
