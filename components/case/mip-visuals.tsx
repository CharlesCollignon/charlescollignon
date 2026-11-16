"use client";

import { useTranslations } from "next-intl";
import { motion, useReducedMotion } from "motion/react";
import { mipBeforeAfter } from "@/content/mip";
import { CountUp } from "@/components/motion/count-up";
import { cn } from "@/lib/utils";

const EASE = [0.16, 1, 0.3, 1] as const;
const VIEW = { once: true, margin: "-10%" } as const;

/* ----------------------------------------------------------------------------
 * Engine: config → registry → engine → every surface
 * ------------------------------------------------------------------------- */

const TARGETS = ["route", "views", "exports", "menu", "dashboards"] as const;

export function MipEngineDiagram({ accent }: { accent: string }) {
  const t = useTranslations("caseStudies.mip.diagram");
  const reduce = useReducedMotion();
  const W = 960;
  const H = 440;
  const engine = { x: 470, y: H / 2 };
  const targets = TARGETS.map((key, i) => ({
    key,
    x: 820,
    y: 60 + i * ((H - 120) / (TARGETS.length - 1)),
  }));
  const paths = [
    `M 210 ${H / 2} L 290 ${H / 2}`,
    `M 410 ${H / 2} L ${engine.x - 70} ${H / 2}`,
    ...targets.map(
      (tg) =>
        `M ${engine.x + 70} ${engine.y} C ${engine.x + 170} ${engine.y}, ${tg.x - 170} ${tg.y}, ${tg.x - 70} ${tg.y}`,
    ),
  ];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label={t("engine")}>
      {/* Config cards */}
      {[2, 1, 0].map((i) => (
        <motion.g
          key={i}
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={VIEW}
          transition={{ duration: 0.8, delay: (2 - i) * 0.1, ease: EASE }}
        >
          <rect
            x={30 + i * 12}
            y={H / 2 - 80 - i * 12}
            width={170}
            height={150}
            rx={14}
            fill="currentColor"
            fillOpacity={0.04 + (2 - i) * 0.03}
            stroke="currentColor"
            strokeOpacity={0.18}
          />
          {i === 0 &&
            [0, 1, 2, 3, 4].map((l) => (
              <rect
                key={l}
                x={50 + (l % 2) * 14}
                y={H / 2 - 50 + l * 20}
                width={[90, 70, 110, 60, 80][l]}
                height={6}
                rx={3}
                fill={l === 0 ? accent : "currentColor"}
                fillOpacity={l === 0 ? 0.9 : 0.25}
              />
            ))}
        </motion.g>
      ))}
      <text x={115} y={H / 2 + 105} textAnchor="middle" className="fill-current font-mono text-[13px] opacity-70">
        {t("config")}
      </text>

      {/* Links */}
      {paths.map((d, i) => (
        <g key={d}>
          <motion.path
            d={d}
            fill="none"
            stroke="currentColor"
            strokeOpacity={0.25}
            strokeWidth={1.5}
            initial={{ pathLength: 0 }}
            whileInView={{ pathLength: 1 }}
            viewport={VIEW}
            transition={{ duration: 1, delay: 0.3 + i * 0.08, ease: EASE }}
          />
          {!reduce && (
            <circle r={3.5} fill={accent}>
              <animateMotion dur={`${2.2 + (i % 3) * 0.4}s`} begin={`${i * 0.3}s`} repeatCount="indefinite" path={d} />
            </circle>
          )}
        </g>
      ))}

      {/* Registry */}
      <rect x={290} y={H / 2 - 32} width={120} height={64} rx={12} fill="currentColor" fillOpacity={0.06} stroke="currentColor" strokeOpacity={0.25} />
      <text x={350} y={H / 2 + 5} textAnchor="middle" className="fill-current text-[14px]">
        {t("registry")}
      </text>

      {/* Engine */}
      <motion.g
        initial={{ scale: 0.8, opacity: 0 }}
        whileInView={{ scale: 1, opacity: 1 }}
        viewport={VIEW}
        transition={{ duration: 0.9, delay: 0.4, ease: EASE }}
        style={{ transformOrigin: `${engine.x}px ${engine.y}px` }}
      >
        <rect x={engine.x - 70} y={engine.y - 44} width={140} height={88} rx={18} fill={accent} />
        <text x={engine.x} y={engine.y + 5} textAnchor="middle" className="fill-white text-[15px] font-semibold">
          {t("engine")}
        </text>
      </motion.g>

      {/* Targets */}
      {targets.map((tg, i) => (
        <motion.g
          key={tg.key}
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={VIEW}
          transition={{ duration: 0.7, delay: 0.8 + i * 0.08, ease: EASE }}
        >
          <rect x={tg.x - 70} y={tg.y - 22} width={140} height={44} rx={22} fill="currentColor" fillOpacity={0.06} stroke="currentColor" strokeOpacity={0.25} />
          <text x={tg.x} y={tg.y + 5} textAnchor="middle" className="fill-current text-[14px]">
            {t(tg.key)}
          </text>
        </motion.g>
      ))}
    </svg>
  );
}

/* ----------------------------------------------------------------------------
 * Anatomy of a module page (abstract wireframe, no data)
 * ------------------------------------------------------------------------- */

export function MipAnatomy({ accent }: { accent: string }) {
  const t = useTranslations("caseStudies.mip.diagram");
  const W = 960;
  const H = 560;
  const line =
    "M 340 380 C 380 360, 400 300, 440 310 S 500 250, 540 270 S 600 330, 640 290 S 700 200, 740 220 S 800 180, 860 150";

  const label = (x: number, y: number, tx: number, ty: number, text: string, i: number) => (
    <motion.g
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={VIEW}
      transition={{ duration: 0.6, delay: 1 + i * 0.12 }}
    >
      <line x1={x} y1={y} x2={tx} y2={ty} stroke={accent} strokeWidth={1} />
      <circle cx={x} cy={y} r={4} fill={accent} />
      <text x={tx + (tx > x ? 8 : -8)} y={ty + 4} textAnchor={tx > x ? "start" : "end"} className="fill-current text-[14px]">
        {text}
      </text>
    </motion.g>
  );

  return (
    <svg viewBox={`-120 0 ${W + 240} ${H}`} className="h-auto w-full" role="img" aria-label={t("tabs")}>
      <defs>
        <linearGradient id="mip-area" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={accent} stopOpacity="0.35" />
          <stop offset="100%" stopColor={accent} stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* App frame */}
      <rect x={20} y={20} width={W - 40} height={H - 40} rx={22} fill="currentColor" fillOpacity={0.04} stroke="currentColor" strokeOpacity={0.15} />
      {/* Notch tab bar */}
      <path d={`M ${W / 2 - 150} 20 h 300 v 22 a 16 16 0 0 1 -16 16 h -268 a 16 16 0 0 1 -16 -16 z`} fill="currentColor" fillOpacity={0.1} />
      {[0, 1, 2, 3].map((i) => (
        <rect key={i} x={W / 2 - 120 + i * 64} y={30} width={44} height={8} rx={4} fill={i === 1 ? accent : "currentColor"} fillOpacity={i === 1 ? 1 : 0.3} />
      ))}

      {/* Filters + entity list */}
      <rect x={50} y={80} width={220} height={440} rx={14} fill="currentColor" fillOpacity={0.04} />
      {[0, 1, 2].map((i) => (
        <rect key={i} x={66 + i * 66} y={98} width={56} height={22} rx={11} fill="currentColor" fillOpacity={i === 0 ? 0.22 : 0.1} />
      ))}
      {Array.from({ length: 9 }, (_, i) => (
        <g key={i}>
          <rect x={66} y={146 + i * 40} width={18} height={12} rx={2} fill="currentColor" fillOpacity={0.2} />
          <rect x={94} y={148 + i * 40} width={[90, 70, 110, 80, 60, 100, 75, 95, 65][i]} height={8} rx={4} fill="currentColor" fillOpacity={i === 2 ? 0.6 : 0.2} />
          {i === 2 && <rect x={58} y={138 + i * 40} width={204} height={28} rx={8} fill={accent} fillOpacity={0.15} />}
        </g>
      ))}

      {/* View tabs */}
      {[0, 1, 2, 3, 4].map((i) => (
        <rect key={i} x={300 + i * 92} y={88} width={80} height={28} rx={14} fill={i === 0 ? accent : "currentColor"} fillOpacity={i === 0 ? 1 : 0.08} />
      ))}
      {/* Export */}
      <rect x={W - 150} y={88} width={90} height={28} rx={14} fill="none" stroke="currentColor" strokeOpacity={0.3} />

      {/* Chart card */}
      <rect x={300} y={136} width={W - 360} height={300} rx={14} fill="currentColor" fillOpacity={0.03} stroke="currentColor" strokeOpacity={0.1} />
      {[0, 1, 2, 3].map((i) => (
        <line key={i} x1={320} x2={W - 80} y1={180 + i * 60} y2={180 + i * 60} stroke="currentColor" strokeOpacity={0.07} />
      ))}
      <motion.path
        d={`${line} L 860 420 L 340 420 Z`}
        fill="url(#mip-area)"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={VIEW}
        transition={{ duration: 1, delay: 1.2 }}
      />
      <motion.path
        d={line}
        fill="none"
        stroke={accent}
        strokeWidth={3}
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        whileInView={{ pathLength: 1 }}
        viewport={VIEW}
        transition={{ duration: 1.8, delay: 0.3, ease: "easeInOut" }}
      />
      <path d="M 340 400 C 420 395, 520 380, 600 370 S 760 340, 860 320" fill="none" stroke="currentColor" strokeOpacity={0.35} strokeDasharray="4 6" strokeWidth={2} />

      {/* Range navigator */}
      <rect x={300} y={452} width={W - 360} height={56} rx={12} fill="currentColor" fillOpacity={0.04} />
      <rect x={640} y={456} width={220} height={48} rx={8} fill={accent} fillOpacity={0.15} stroke={accent} strokeOpacity={0.6} />

      {label(160, 109, -10, 109, t("filters"), 0)}
      {label(66, 226, -10, 226, t("entities"), 1)}
      {label(500, 102, 500, -2, t("tabs"), 2)}
      {label(W - 60, 102, W + 10, 102, t("export"), 3)}
    </svg>
  );
}

/* ----------------------------------------------------------------------------
 * Before / after bars
 * ------------------------------------------------------------------------- */

export function MipBeforeAfter({ accent }: { accent: string }) {
  const t = useTranslations("caseStudies.mip.diagram");
  const rows = [
    { key: "files", before: mipBeforeAfter.before.files, after: mipBeforeAfter.after.files },
    { key: "lines", before: mipBeforeAfter.before.lines, after: mipBeforeAfter.after.lines },
  ] as const;

  return (
    <div className="grid gap-10 md:grid-cols-2 md:gap-14">
      {rows.map((row) => (
        <div key={row.key} className="flex flex-col gap-5">
          <span className="eyebrow opacity-60">{t(row.key)}</span>
          {(["before", "after"] as const).map((side) => {
            const value = row[side];
            return (
              <div key={side} className="flex flex-col gap-2">
                <div className="flex items-baseline justify-between gap-4 text-sm">
                  <span className="opacity-70">{t(side)}</span>
                  <CountUp value={value} className="font-mono text-lg tabular-nums" />
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-current/10">
                  <motion.div
                    className="h-full origin-left rounded-full"
                    style={{
                      width: `${(value / row.before) * 100}%`,
                      backgroundColor: side === "after" ? accent : "currentColor",
                      opacity: side === "after" ? 1 : 0.35,
                    }}
                    initial={{ scaleX: 0 }}
                    whileInView={{ scaleX: 1 }}
                    viewport={VIEW}
                    transition={{ duration: 1.4, delay: side === "after" ? 0.3 : 0, ease: EASE }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

/* ----------------------------------------------------------------------------
 * Sign-in horizon (a nod to the login backdrop, redrawn in SVG)
 * ------------------------------------------------------------------------- */

// Deterministic star field (no Math.random, so server and client agree).
const STARS = Array.from({ length: 90 }, (_, i) => {
  const r = (n: number) => ((Math.sin(i * 12.9898 + n * 78.233) * 43758.5453) % 1 + 1) % 1;
  return { x: r(1) * 960, y: r(2) * 300, s: 0.6 + r(3) * 1.4, d: 2 + r(4) * 4 };
});

export function MipHorizon({ accent, className }: { accent: string; className?: string }) {
  const t = useTranslations("caseStudies.mip.visuals");
  const reduce = useReducedMotion();
  const W = 960;
  const H = 420;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={cn("h-auto w-full rounded-2xl bg-[#05040a]", className)} role="img" aria-label={t("horizon")}>
      <defs>
        <radialGradient id="mip-planet" cx="50%" cy="0%" r="80%">
          <stop offset="0%" stopColor="#1d3b6e" />
          <stop offset="45%" stopColor="#0b1a33" />
          <stop offset="100%" stopColor="#020308" />
        </radialGradient>
        <radialGradient id="mip-sun" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fff6e0" stopOpacity="1" />
          <stop offset="30%" stopColor="#ffcf8a" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#ff9a3c" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="mip-atmo" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#7fb4ff" stopOpacity="0" />
          <stop offset="100%" stopColor="#7fb4ff" stopOpacity="0.35" />
        </linearGradient>
      </defs>

      {STARS.map((s, i) => (
        <circle key={i} cx={s.x} cy={s.y} r={s.s} fill="#fff" opacity={0.6}>
          {!reduce && (
            <animate attributeName="opacity" values="0.15;0.9;0.15" dur={`${s.d}s`} repeatCount="indefinite" />
          )}
        </circle>
      ))}

      <ellipse cx={W / 2} cy={H + 640} rx={980} ry={700} fill="url(#mip-atmo)" />
      <ellipse cx={W / 2} cy={H + 660} rx={960} ry={700} fill="url(#mip-planet)" />
      <ellipse cx={W / 2} cy={H + 660} rx={960} ry={700} fill="none" stroke="#9cc6ff" strokeOpacity={0.5} strokeWidth={1.5} />

      {/* Data flows arcing over the planet */}
      {[0, 1, 2, 3].map((i) => (
        <path
          key={i}
          d={`M ${160 + i * 110} ${H - 30 + i * 4} Q ${W / 2} ${120 + i * 30} ${W - 160 - i * 90} ${H - 26 + i * 3}`}
          fill="none"
          stroke={accent}
          strokeWidth={1.5}
          strokeOpacity={0.8}
          strokeDasharray="6 10"
        >
          {!reduce && (
            <animate attributeName="stroke-dashoffset" from="0" to="-160" dur={`${3 + i}s`} repeatCount="indefinite" />
          )}
        </path>
      ))}

      <motion.circle
        cx={W / 2}
        cy={H - 40}
        r={150}
        fill="url(#mip-sun)"
        initial={{ opacity: 0, scale: 0.6 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={VIEW}
        transition={{ duration: 2.4, ease: EASE }}
        style={{ transformOrigin: `${W / 2}px ${H - 40}px` }}
      />
    </svg>
  );
}
