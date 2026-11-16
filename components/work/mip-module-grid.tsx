"use client";

import { useTranslations } from "next-intl";
import { motion } from "motion/react";
import { mipCategories } from "@/content/mip";
import { cn } from "@/lib/utils";

/**
 * Compact version of the MIP module diagram for narrow screens: the engine
 * on top, then one tile per category with a dot per module.
 */
export function MipModuleGrid({
  accent,
  className,
}: {
  accent: string;
  className?: string;
}) {
  const t = useTranslations("caseStudies.mip.diagram");

  return (
    <div className={cn("grid w-full grid-cols-2 gap-1.5 text-[13px]", className)}>
      <div
        className="col-span-2 flex items-center justify-between rounded-xl px-4 py-3 text-white"
        style={{ backgroundColor: accent }}
      >
        <span className="font-mono">defineModule()</span>
        <span className="text-[11px] uppercase tracking-[0.15em] opacity-80">
          {t("engine")}
        </span>
      </div>
      {mipCategories.map((c, i) => (
        <motion.div
          key={c.key}
          className="flex flex-col gap-2 rounded-xl border border-current/10 px-3 py-2.5"
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: i * 0.04 }}
        >
          <span className="truncate opacity-80">{t(`categories.${c.key}`)}</span>
          <span className="flex gap-1" aria-label={String(c.modules)}>
            {Array.from({ length: c.modules }, (_, j) => (
              <span
                key={j}
                className="size-1.5 rounded-full"
                style={{ backgroundColor: accent }}
              />
            ))}
          </span>
        </motion.div>
      ))}
    </div>
  );
}
