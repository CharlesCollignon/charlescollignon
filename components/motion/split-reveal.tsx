"use client";

import { useRef, type ElementType, type ReactNode } from "react";
import { gsap } from "gsap";
import { SplitText } from "gsap/SplitText";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { cn } from "@/lib/utils";

gsap.registerPlugin(SplitText, ScrollTrigger, useGSAP);

type SplitRevealProps = {
  children: ReactNode;
  as?: ElementType;
  className?: string;
  /** Unit that slides up from behind its line mask. */
  by?: "lines" | "words" | "chars";
  /** Seconds. */
  delay?: number;
  /** Seconds between units. */
  stagger?: number;
  /** Play on mount instead of when scrolled into view. */
  immediate?: boolean;
};

/**
 * Splits text with GSAP SplitText and slides each unit up from behind a line
 * mask. Re-splits on resize and font load; screen readers get the original
 * text via the aria-label SplitText adds.
 */
export function SplitReveal({
  children,
  as: Tag = "div",
  className,
  by = "lines",
  delay = 0,
  stagger,
  immediate = false,
}: SplitRevealProps) {
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;

      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        gsap.set(el, { autoAlpha: 1 });
        return;
      }

      const split = SplitText.create(el, {
        type: by === "lines" ? "lines" : `lines,${by}`,
        mask: "lines",
        linesClass: "split-line",
        // aria-label is only allowed on elements with a role (e.g. headings);
        // whole lines/words read fine as they are.
        aria: by === "chars" ? "auto" : "none",
        autoSplit: true,
        onSplit(self) {
          gsap.set(el, { autoAlpha: 1 });
          const targets = self[by];
          return gsap.from(targets, {
            yPercent: 110,
            duration: 1.1,
            ease: "expo.out",
            delay,
            stagger: stagger ?? (by === "chars" ? 0.025 : by === "words" ? 0.05 : 0.1),
            scrollTrigger: immediate
              ? undefined
              : { trigger: el, start: "top 88%", once: true },
          });
        },
      });

      return () => split.revert();
    },
    { scope: ref },
  );

  return (
    <Tag
      ref={ref}
      data-fade=""
      className={cn("invisible", className)}
    >
      {children}
    </Tag>
  );
}
