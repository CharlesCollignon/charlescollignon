"use client";

import { useTranslations } from "next-intl";
import FadeContent from "@/components/FadeContent";
import { Marquee } from "@/components/motion/marquee";
import { ScrollWords } from "@/components/motion/scroll-words";

const SKILLS = [
  "Product design",
  "Design systems",
  "Team leadership",
  "Design ops",
  "Accessibility",
  "Motion design",
  "Prototyping",
  "Figma",
];
const STACK = [
  "TypeScript",
  "React",
  "Next.js",
  "TanStack",
  "Tailwind CSS",
  "Motion",
  "GSAP",
  "Three.js",
  "ECharts",
  "MapLibre",
  "Postgres",
  "Supabase",
];

const PILLARS = ["lead", "design", "build"] as const;

function Chip({ children }: { children: string }) {
  return (
    <span className="whitespace-nowrap rounded-full border border-zinc-300 px-5 py-2.5 text-sm text-zinc-800 dark:border-zinc-800 dark:text-zinc-300">
      {children}
    </span>
  );
}

export function About() {
  const t = useTranslations("about");

  return (
    <section
      id="about"
      data-camera="about"
      className="relative flex min-h-dvh w-full flex-col justify-center gap-section py-section"
    >
      <div className="page-x">
        <p className="eyebrow mb-8 text-zinc-500 md:mb-12 dark:text-zinc-400">
          {t("eyebrow")}
        </p>
        <ScrollWords
          text={t("manifesto")}
          className="max-w-[22ch] text-[clamp(2rem,1rem+4.2vw,5.5rem)] font-medium leading-[1.04] tracking-[-0.035em] text-zinc-900 dark:text-zinc-50"
        />
      </div>

      <div className="page-x">
        <h2 className="eyebrow mb-8 text-zinc-500 md:mb-12 dark:text-zinc-400">
          {t("pillarsTitle")}
        </h2>
        <ol className="grid gap-10 md:grid-cols-3 md:gap-8 lg:gap-14">
          {PILLARS.map((key, i) => (
            <li key={key}>
              <FadeContent
                delay={i * 0.12}
                duration={0.9}
                className="flex flex-col gap-4 border-t border-zinc-300 pt-6 dark:border-zinc-800"
              >
                <span className="font-mono text-xs text-zinc-500">0{i + 1}</span>
                <h3 className="text-h3 font-semibold text-zinc-900 dark:text-zinc-50">
                  {t(`pillars.${key}.title`)}
                </h3>
                <p className="text-body text-zinc-700 dark:text-zinc-400">
                  {t(`pillars.${key}.body`)}
                </p>
              </FadeContent>
            </li>
          ))}
        </ol>
      </div>

      <div className="flex flex-col gap-3">
        <Marquee seconds={45}>
          {SKILLS.map((s) => (
            <Chip key={s}>{s}</Chip>
          ))}
        </Marquee>
        <Marquee seconds={55} reverse>
          {STACK.map((s) => (
            <Chip key={s}>{s}</Chip>
          ))}
        </Marquee>
      </div>
    </section>
  );
}
