"use client";

import { useRef, type ElementType } from "react";
import { gsap } from "gsap";
import { SplitText } from "gsap/SplitText";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { cn } from "@/lib/utils";

gsap.registerPlugin(SplitText, ScrollTrigger, useGSAP);

/**
 * Text whose words light up one after another as the paragraph scrolls
 * through the viewport (scrubbed, so scrolling back dims them again).
 */
export function ScrollWords({
  text,
  as: Tag = "p",
  className,
  dim = 0.14,
}: {
  text: string;
  as?: ElementType;
  className?: string;
  /** Opacity of words that haven't been reached yet. */
  dim?: number;
}) {
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches)
        return;

      const split = SplitText.create(el, {
        type: "words",
        aria: "none",
        autoSplit: true,
        onSplit(self) {
          return gsap.fromTo(
            self.words,
            { opacity: dim },
            {
              opacity: 1,
              ease: "none",
              stagger: 0.1,
              scrollTrigger: {
                trigger: el,
                start: "top 80%",
                end: "bottom 50%",
                scrub: 0.6,
              },
            },
          );
        },
      });

      return () => split.revert();
    },
    { scope: ref, dependencies: [text] },
  );

  return (
    <Tag ref={ref} className={cn(className)}>
      {text}
    </Tag>
  );
}
