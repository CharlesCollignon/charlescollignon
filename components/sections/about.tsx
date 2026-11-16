"use client";

import { useTranslations } from "next-intl";
import FadeContent from "@/components/FadeContent";
import { StaggerContainer, StaggerItem } from "@/components/animations";
import { SplitReveal } from "@/components/motion/split-reveal";

const skills = [
  "Product design",
  "Design systems",
  "Team leadership",
  "Next.js",
  "React",
  "TypeScript",
  "Tailwind CSS",
  "Motion & GSAP",
  "Three.js",
  "Data visualisation",
  "MapLibre",
  "ECharts",
];

export function About() {
  const t = useTranslations("about");

  return (
    <section id="about" className="flex min-h-dvh w-full items-center">
      <div className="page-x flex flex-col items-center gap-12 text-center md:gap-16">
        <div className="flex flex-col items-center">
          <p className="eyebrow text-zinc-900 dark:text-zinc-400">
            {t("eyebrow")}
          </p>
          <SplitReveal
            as="h2"
            className="mt-4 max-w-[14ch] text-h2 font-bold text-zinc-900 dark:text-zinc-100"
          >
            {t("title")}
          </SplitReveal>
        </div>

        <StaggerContainer
          className="flex max-w-3xl flex-wrap justify-center gap-2 md:gap-3"
          staggerDelay={0.05}
        >
          {skills.map((skill) => (
            <StaggerItem key={skill}>
              <p className="inline-flex rounded-full border border-zinc-300 px-4 py-2 text-xs text-zinc-900 sm:text-sm dark:border-zinc-800 dark:text-zinc-300">
                {skill}
              </p>
            </StaggerItem>
          ))}
        </StaggerContainer>

        <FadeContent delay={0.2}>
          <div className="flex max-w-2xl flex-col gap-6 text-body text-zinc-900 dark:text-zinc-400">
            <p>{t("p1")}</p>
            <p>{t("p2")}</p>
          </div>
        </FadeContent>
      </div>
    </section>
  );
}
