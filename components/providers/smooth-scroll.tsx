"use client";

import { createContext, useContext, useEffect, useState } from "react";
import Lenis from "lenis";
import { MotionConfig } from "motion/react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import "lenis/dist/lenis.css";
import { usePathname } from "next/navigation";

gsap.registerPlugin(ScrollTrigger);

const LenisContext = createContext<Lenis | null>(null);

/** The active Lenis instance, or null (reduced motion, or before mount). */
export const useLenis = () => useContext(LenisContext);

/**
 * Smooth, inertial scrolling with Lenis, driven by GSAP's ticker so
 * ScrollTrigger animations and the scroll position stay in lockstep.
 * Disabled entirely when the user prefers reduced motion.
 */
export function SmoothScroll({ children }: { children: React.ReactNode }) {
  const [lenis, setLenis] = useState<Lenis | null>(null);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduce.matches) return;

    const instance = new Lenis({
      autoRaf: false,
      anchors: { offset: 0 },
      lerp: 0.1,
      wheelMultiplier: 1,
    });

    instance.on("scroll", ScrollTrigger.update);
    const tick = (time: number) => instance.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    // Exposing the instance to consumers once it exists is the point of this effect.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLenis(instance);

    return () => {
      gsap.ticker.remove(tick);
      instance.destroy();
      setLenis(null);
    };
  }, []);

  // New page: re-measure triggers, then jump to the anchor in the URL if
  // there is one (e.g. "/#work" from a case study), otherwise to the top.
  const pathname = usePathname();
  useEffect(() => {
    let raf = requestAnimationFrame(() => {
      ScrollTrigger.refresh();
      raf = requestAnimationFrame(() => {
        const hash = decodeURIComponent(window.location.hash.slice(1));
        const target = hash ? document.getElementById(hash) : null;
        const y = target
          ? target.getBoundingClientRect().top + window.scrollY
          : 0;
        if (lenis) lenis.scrollTo(y, { immediate: true, force: true });
        else window.scrollTo(0, y);
      });
    });
    return () => cancelAnimationFrame(raf);
  }, [pathname, lenis]);

  return (
    <LenisContext.Provider value={lenis}>
      {/* Motion animations honour the OS "reduce motion" setting site-wide. */}
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </LenisContext.Provider>
  );
}
