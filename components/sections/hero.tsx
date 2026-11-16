"use client";

import { useRef } from "react";
import { useTranslations } from "next-intl";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import TextType from "@/components/TextType";
import { Magnetic } from "@/components/motion/magnetic";
import { CssReveal } from "@/components/motion/css-reveal";

gsap.registerPlugin(ScrollTrigger, useGSAP);

export function Hero() {
  const t = useTranslations("hero");
  const lines = t.raw("lines") as string[];
  const ref = useRef<HTMLElement>(null);

  // As the hero scrolls away its content drifts up and fades, ahead of the page.
  useGSAP(
    () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      gsap.to("[data-hero-content]", {
        yPercent: -18,
        opacity: 0,
        ease: "none",
        scrollTrigger: {
          trigger: ref.current,
          start: "top top",
          end: "bottom top",
          scrub: true,
        },
      });
    },
    { scope: ref },
  );

  return (
    <section
      ref={ref}
      data-camera="hero"
      className="relative flex min-h-dvh flex-col items-center justify-center"
    >
      <div data-hero-content className="page-x flex flex-col items-center text-center">
        <p
          className="css-fade eyebrow mb-4 text-zinc-300 mix-blend-difference dark:text-zinc-400"
          style={{ animationDelay: "0.2s" }}
        >
          {t("role")}
        </p>

        <CssReveal
          text="Charles Collignon"
          delay={0.35}
          className="mb-6 text-display font-normal text-zinc-300 mix-blend-difference dark:text-zinc-200"
        />

        <div className="flex min-h-15 max-w-xl items-center justify-center md:min-h-17.5">
          <div className="css-fade" style={{ animationDelay: "0.9s" }}>
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
          </div>
        </div>

        <div
          className="css-fade mt-8 flex flex-wrap items-center justify-center gap-3 md:mt-12 md:gap-4"
          style={{ animationDelay: "1.3s" }}
        >
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
      </div>

      <div
        className="css-fade absolute bottom-6 left-1/2 -translate-x-1/2 md:bottom-8"
        style={{ animationDelay: "2s" }}
      >
        <a
          href="#about"
          className="flex flex-col items-center gap-3 text-[11px] font-medium uppercase tracking-[0.25em] text-zinc-400 mix-blend-difference"
        >
          {t("scroll")}
          <span className="relative block h-10 w-px overflow-hidden bg-zinc-400/30">
            <span className="scroll-cue absolute inset-x-0 top-0 h-1/2 bg-zinc-300" />
          </span>
        </a>
      </div>
    </section>
  );
}
