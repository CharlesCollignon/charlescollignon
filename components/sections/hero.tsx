"use client";

import { useRef } from "react";
import { useTranslations } from "next-intl";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import TextType from "@/components/TextType";
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
      // Animate `top`, not a transform: a transform would isolate the content
      // in its own stacking context and break its mix-blend-difference text.
      gsap.to("[data-hero-content]", {
        top: "-16vh",
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
      className="relative flex min-h-dvh flex-col justify-end pb-24 md:pb-20"
    >
      {/* The character takes the top-left corner (character/rig.ts) and turns toward
          the text, which sits bottom right. */}
      <div data-hero-content className="page-x relative flex flex-col items-end text-right">
        <p
          className="css-fade eyebrow mb-4 text-zinc-300 mix-blend-difference dark:text-zinc-400"
          style={{ animationDelay: "0.2s" }}
        >
          {t("role")}
        </p>

        <CssReveal
          text="Charles Collignon"
          delay={0.35}
          className="mb-4 text-display font-normal text-zinc-300 mix-blend-difference dark:text-zinc-200"
        />

        <div className="flex min-h-15 max-w-xl items-center justify-end md:min-h-17.5">
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
      </div>

      <div
        className="css-fade absolute bottom-6 left-gutter md:bottom-8"
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
