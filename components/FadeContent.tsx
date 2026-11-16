"use client";

import * as React from "react";
import { useRef, useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

interface FadeContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  container?: Element | string | null;
  blur?: boolean;
  /** Seconds */
  duration?: number;
  ease?: string;
  /** Seconds */
  delay?: number;
  threshold?: number;
  initialOpacity?: number;
  /** Seconds. 0 = never disappear */
  disappearAfter?: number;
  /** Seconds */
  disappearDuration?: number;
  disappearEase?: string;
  onComplete?: () => void;
  onDisappearanceComplete?: () => void;
}

/**
 * Fades (and optionally un-blurs) its children in when scrolled into view.
 * The hidden state is rendered on the server via `data-fade` so there is no
 * flash of visible content before hydration; a <noscript> rule in the root
 * layout reveals everything when JavaScript is disabled.
 */
const FadeContent: React.FC<FadeContentProps> = ({
  children,
  container,
  blur = false,
  duration = 1,
  ease = "power2.out",
  delay = 0,
  threshold = 0.1,
  initialOpacity = 0,
  disappearAfter = 0,
  disappearDuration = 0.5,
  disappearEase = "power2.in",
  onComplete,
  onDisappearanceComplete,
  className = "",
  style,
  ...props
}) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (reduceMotion) {
      gsap.set(el, { autoAlpha: 1, filter: "none" });
      onComplete?.();
      return;
    }

    let scrollerTarget: Element | string | null =
      container || document.getElementById("snap-main-container") || null;
    if (typeof scrollerTarget === "string") {
      scrollerTarget = document.querySelector(scrollerTarget);
    }

    const hiddenFilter = blur ? "blur(10px)" : "blur(0px)";

    gsap.set(el, {
      autoAlpha: initialOpacity,
      filter: hiddenFilter,
      willChange: "opacity, filter",
    });

    const tl = gsap.timeline({
      paused: true,
      delay,
      onComplete: () => {
        gsap.set(el, { clearProps: "willChange,filter" });
        onComplete?.();
        if (disappearAfter > 0) {
          gsap.to(el, {
            autoAlpha: initialOpacity,
            filter: hiddenFilter,
            delay: disappearAfter,
            duration: disappearDuration,
            ease: disappearEase,
            onComplete: () => onDisappearanceComplete?.(),
          });
        }
      },
    });

    tl.to(el, { autoAlpha: 1, filter: "blur(0px)", duration, ease });

    const st = ScrollTrigger.create({
      trigger: el,
      scroller: scrollerTarget || window,
      start: `top ${(1 - threshold) * 100}%`,
      once: true,
      onEnter: () => tl.play(),
    });

    return () => {
      st.kill();
      tl.kill();
      gsap.killTweensOf(el);
    };
    // Animation is configured once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={ref}
      data-fade=""
      className={className}
      style={{ opacity: initialOpacity, visibility: "hidden", ...style }}
      {...props}
    >
      {children}
    </div>
  );
};

export default FadeContent;
