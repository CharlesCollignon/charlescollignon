"use client";

import { useTranslations } from "next-intl";
import FadeContent from "@/components/FadeContent";
import TextType from "@/components/TextType";
import { Magnetic } from "@/components/motion/magnetic";
import { SplitReveal } from "@/components/motion/split-reveal";

export function Hero() {
  const t = useTranslations("hero");
  const lines = t.raw("lines") as string[];

  return (
    <section className="flex min-h-dvh flex-col items-center justify-center">
      <div className="page-x flex flex-col items-center text-center">
        <FadeContent blur delay={0.2} duration={1.2}>
          <p className="eyebrow mb-4 text-zinc-300 mix-blend-difference dark:text-zinc-400">
            {t("role")}
          </p>
        </FadeContent>

        <SplitReveal
          as="h1"
          by="chars"
          immediate
          delay={0.35}
          className="mb-6 text-display font-normal text-zinc-300 mix-blend-difference dark:text-zinc-200"
        >
          Charles Collignon
        </SplitReveal>

        <div className="flex min-h-15 max-w-xl items-center justify-center md:min-h-17.5">
          <FadeContent delay={0.9} duration={1.2}>
            <TextType
              text={lines}
              initialDelay={900}
              typingSpeed={60}
              deletingSpeed={35}
              pauseDuration={2200}
              showCursor
              cursorCharacter="_"
              cursorBlinkDuration={0.7}
              className="text-lead text-zinc-300 mix-blend-difference dark:text-zinc-200"
            />
          </FadeContent>
        </div>

        <FadeContent delay={1.3} duration={1.2}>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3 md:mt-12 md:gap-4">
            <Magnetic>
              <a
                href="#work"
                className="inline-flex items-center justify-center rounded-full bg-zinc-900/50 px-7 py-3 text-sm font-medium text-white backdrop-blur-md transition-colors hover:bg-zinc-800 md:px-8 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                {t("ctaWork")}
              </a>
            </Magnetic>
            <Magnetic>
              <a
                href="#contact"
                className="inline-flex items-center justify-center rounded-full border border-zinc-400 px-7 py-3 text-sm font-medium text-zinc-400 mix-blend-difference transition-colors hover:bg-zinc-900/50 hover:text-white hover:backdrop-blur-md md:px-8 dark:border-zinc-100 dark:text-zinc-100 dark:hover:bg-zinc-100 dark:hover:text-zinc-900"
              >
                {t("ctaContact")}
              </a>
            </Magnetic>
          </div>
        </FadeContent>
      </div>
    </section>
  );
}
