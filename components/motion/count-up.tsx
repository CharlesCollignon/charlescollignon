"use client";

import { useRef } from "react";
import { useLocale } from "next-intl";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger, useGSAP);

/**
 * A number that counts up from zero the first time it scrolls into view.
 * The final value is server-rendered, so it reads correctly without JS.
 */
export function CountUp({
  value,
  prefix = "",
  suffix = "",
  duration = 1.8,
  className,
}: {
  value: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
  className?: string;
}) {
  const locale = useLocale();
  const ref = useRef<HTMLSpanElement>(null);
  const fmt = new Intl.NumberFormat(locale);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches)
        return;
      const state = { v: 0 };
      gsap.to(state, {
        v: value,
        duration,
        ease: "expo.out",
        scrollTrigger: { trigger: el, start: "top 90%", once: true },
        onUpdate: () => {
          el.textContent = `${prefix}${fmt.format(Math.round(state.v))}${suffix}`;
        },
      });
    },
    { dependencies: [value, locale] },
  );

  return (
    <span ref={ref} className={className}>
      {prefix}
      {fmt.format(value)}
      {suffix}
    </span>
  );
}
