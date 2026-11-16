"use client";

import { useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { AnimatePresence, motion, useMotionValue, useSpring } from "motion/react";
import type { Project } from "@/content/projects";
import { useMediaQuery } from "@/hooks/use-media-query";

/**
 * Smaller projects as a list. On hover (mouse only) a preview of the project
 * floats next to the pointer.
 */
export function AlsoList({ projects }: { projects: Project[] }) {
  const t = useTranslations();
  const [hovered, setHovered] = useState<Project | null>(null);
  const finePointer = useMediaQuery("(pointer: fine)");
  const x = useSpring(useMotionValue(0), { stiffness: 300, damping: 30 });
  const y = useSpring(useMotionValue(0), { stiffness: 300, damping: 30 });

  return (
    <div
      className="relative"
      onPointerMove={(e) => {
        x.set(e.clientX + 24);
        y.set(e.clientY - 90);
      }}
    >
      <h3 className="eyebrow mb-6 text-zinc-500 dark:text-zinc-400">
        {t("work.also")}
      </h3>
      <ul>
        {projects.map((p) => (
          <li key={p.slug}>
            <a
              href={p.url}
              target="_blank"
              rel="noopener noreferrer"
              data-cursor={t("work.visit")}
              onPointerEnter={() => setHovered(p)}
              onPointerLeave={() => setHovered(null)}
              className="group grid grid-cols-[1fr_auto] items-baseline gap-x-6 gap-y-1 border-t border-zinc-300 py-6 transition-colors last:border-b md:grid-cols-[1fr_2fr_auto] md:py-8 dark:border-zinc-800"
            >
              <span className="col-start-1 row-start-1 text-h3 font-semibold text-zinc-900 transition-transform duration-500 ease-out-expo group-hover:translate-x-2 dark:text-zinc-50">
                {t(`projects.${p.slug}.title`)}
              </span>
              <span className="col-span-2 col-start-1 row-start-2 text-sm text-zinc-600 md:col-span-1 md:col-start-2 md:row-start-1 dark:text-zinc-400">
                {t(`projects.${p.slug}.tagline`)}
              </span>
              <span className="col-start-2 row-start-1 font-mono text-xs text-zinc-600 md:col-start-3 dark:text-zinc-400">
                {p.year} ↗
              </span>
            </a>
          </li>
        ))}
      </ul>

      <AnimatePresence>
        {finePointer && hovered?.cover && (
          <motion.div
            key={hovered.slug}
            aria-hidden
            className="pointer-events-none fixed left-0 top-0 z-40 w-80 overflow-hidden rounded-xl shadow-2xl ring-1 ring-black/10"
            style={{ x, y }}
            initial={{ opacity: 0, scale: 0.85, rotate: -4 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            exit={{ opacity: 0, scale: 0.85 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          >
            <Image
              src={hovered.cover.src}
              width={hovered.cover.width}
              height={hovered.cover.height}
              alt=""
              sizes="320px"
              className="h-auto w-full"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
