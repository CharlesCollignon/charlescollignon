"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { motion } from "motion/react";
import { mipCategories } from "@/content/mip";
import { cn } from "@/lib/utils";

const W = 800;
const H = 560;
const CX = W / 2;
const CY = H / 2;
const RX = 290;
const RY = 200;
const EASE = [0.16, 1, 0.3, 1] as const;
/** Round so server and client serialise identical SVG attributes. */
const r2 = (n: number) => Math.round(n * 100) / 100;

const nodes = mipCategories.map((c, i) => {
  const angle = -Math.PI / 2 + (i / mipCategories.length) * Math.PI * 2;
  const x = r2(CX + Math.cos(angle) * RX);
  const y = r2(CY + Math.sin(angle) * RY);
  // Module dots sit on a small ring around the category node.
  const dots = Array.from({ length: c.modules }, (_, j) => {
    const a = angle + Math.PI + ((j - (c.modules - 1) / 2) * Math.PI) / 7;
    return { x: r2(x + Math.cos(a) * 24), y: r2(y + Math.sin(a) * 24) };
  });
  return { ...c, angle, x, y, dots };
});

/**
 * Redrawn, data-free diagram of the MIP module engine: one defineModule()
 * core feeding 11 categories, each ringed by its modules (32 in all).
 * Hover or focus a category to trace its link to the engine.
 */
export function MipConstellation({
  accent,
  className,
}: {
  accent: string;
  className?: string;
}) {
  const t = useTranslations("caseStudies.mip.diagram");
  const [hover, setHover] = useState<string | null>(null);

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      role="group"
      aria-label={t("engine")}
      className={cn("h-auto w-full overflow-visible", className)}
    >
      <defs>
        <radialGradient id="mip-core" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={accent} stopOpacity="0.55" />
          <stop offset="100%" stopColor={accent} stopOpacity="0" />
        </radialGradient>
      </defs>

      <ellipse
        cx={CX}
        cy={CY}
        rx={RX}
        ry={RY}
        fill="none"
        stroke="currentColor"
        strokeOpacity="0.08"
        strokeDasharray="2 6"
      />

      {nodes.map((n, i) => (
        <motion.line
          key={`l-${n.key}`}
          x1={CX}
          y1={CY}
          x2={n.x}
          y2={n.y}
          stroke={hover === n.key ? accent : "currentColor"}
          strokeOpacity={hover === null ? 0.18 : hover === n.key ? 0.9 : 0.06}
          strokeWidth={hover === n.key ? 1.5 : 1}
          initial={{ pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true, margin: "-15%" }}
          transition={{ duration: 1.2, delay: 0.2 + i * 0.05, ease: EASE }}
        />
      ))}

      <circle cx={CX} cy={CY} r={120} fill="url(#mip-core)" />
      <motion.circle
        cx={CX}
        cy={CY}
        r={46}
        fill="none"
        stroke={accent}
        strokeOpacity={0.5}
        animate={{ scale: [1, 1.35], opacity: [0.8, 0] }}
        transition={{ duration: 2.6, repeat: Infinity, ease: "easeOut" }}
        style={{ transformOrigin: `${CX}px ${CY}px` }}
      />
      <circle cx={CX} cy={CY} r={46} fill={accent} />
      <text
        x={CX}
        y={CY - 4}
        textAnchor="middle"
        className="fill-white font-mono text-[13px]"
      >
        defineModule()
      </text>
      <text
        x={CX}
        y={CY + 14}
        textAnchor="middle"
        className="fill-white/70 text-[11px] uppercase tracking-[0.15em]"
      >
        {t("engine")}
      </text>

      {nodes.map((n, i) => {
        const right = Math.cos(n.angle) > 0.2;
        const left = Math.cos(n.angle) < -0.2;
        const labelX = n.x + (right ? 40 : left ? -40 : 0);
        const labelY = n.y + (right || left ? 4 : n.y < CY ? -40 : 48);
        const active = hover === n.key;
        return (
          <motion.g
            key={n.key}
            tabIndex={0}
            role="img"
            aria-label={`${t(`categories.${n.key}`)}: ${n.modules}`}
            onPointerEnter={() => setHover(n.key)}
            onPointerLeave={() => setHover(null)}
            onFocus={() => setHover(n.key)}
            onBlur={() => setHover(null)}
            className="cursor-default outline-none"
            initial={{ opacity: 0, scale: 0.6 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-15%" }}
            transition={{ duration: 0.8, delay: 0.5 + i * 0.06, ease: EASE }}
            style={{ transformOrigin: `${n.x}px ${n.y}px` }}
          >
            <circle cx={n.x} cy={n.y} r={36} fill="transparent" />
            {n.dots.map((d, j) => (
              <circle
                key={j}
                cx={d.x}
                cy={d.y}
                r={3.5}
                fill={active ? accent : "currentColor"}
                fillOpacity={active ? 1 : 0.55}
              />
            ))}
            <circle
              cx={n.x}
              cy={n.y}
              r={active ? 11 : 9}
              fill={active ? accent : "currentColor"}
              className="transition-all duration-300"
            />
            <text
              x={labelX}
              y={labelY}
              textAnchor={right ? "start" : left ? "end" : "middle"}
              className={cn(
                "text-[15px] transition-opacity duration-300",
                hover && !active ? "opacity-40" : "opacity-100",
              )}
              fill="currentColor"
            >
              {t(`categories.${n.key}`)}
              <tspan
                dx={6}
                className="font-mono text-[12px]"
                fill={accent}
              >
                {n.modules}
              </tspan>
            </text>
          </motion.g>
        );
      })}
    </svg>
  );
}
