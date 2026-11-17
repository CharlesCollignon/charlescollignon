"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { gsap } from "gsap";
import { useLenis } from "@/components/providers/smooth-scroll";
import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";

/**
 * An endless, interactive ticker.
 *
 * - One set of items is measured and repeated as many times as the viewport
 *   needs, then wrapped seamlessly, so it never shows a gap at any width.
 * - It drifts on its own; page scrolling speeds it up and flips its
 *   direction; hovering or focusing an item eases it to a stop.
 * - It can be dragged (mouse or touch) and keeps its momentum. A drag never
 *   counts as a click on an item.
 * - Only the first copy is reachable by keyboard and screen readers.
 * - With reduced motion it is a plain horizontally scrollable row.
 */
export function Marquee({
  items,
  speed = 40,
  reverse = false,
  className,
}: {
  /** Render one copy of the items; `interactive` is false for the clones. */
  items: (interactive: boolean) => ReactNode;
  /** Drift speed in px/s. */
  speed?: number;
  reverse?: boolean;
  className?: string;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const setRef = useRef<HTMLDivElement>(null);
  const [copies, setCopies] = useState(2);
  const still = useMediaQuery("(prefers-reduced-motion: reduce)");
  const lenis = useLenis();

  // Enough copies to cover the row twice over, whatever the screen width.
  useEffect(() => {
    const root = rootRef.current;
    const set = setRef.current;
    if (!root || !set) return;
    const ro = new ResizeObserver(() => {
      const w = set.offsetWidth || 1;
      setCopies(Math.max(2, Math.ceil(root.offsetWidth / w) + 1));
    });
    ro.observe(root);
    ro.observe(set);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    const track = trackRef.current;
    const set = setRef.current;
    if (!root || !track || !set || still) return;

    const dir = reverse ? 1 : -1;
    let x = 0;
    let rate = 1; // 1 = drifting, 0 = stopped (hover/focus)
    let boost = 0; // extra speed from page scrolling (signed)
    let held = false; // hovered or focused
    let visible = true;
    let lastScroll = window.scrollY;

    // Dragging
    let dragging = false;
    let dragStartX = 0;
    let dragLastX = 0;
    let dragLastT = 0;
    let fling = 0; // px/s left over after a drag
    let moved = 0;

    const wrap = () => {
      const w = set.offsetWidth;
      if (w > 0) x = ((x % w) + w) % w - w; // keep x in [-w, 0)
    };

    const tick = (_time: number, deltaMs: number) => {
      if (!visible) return;
      const dt = Math.min(deltaMs / 1000, 0.05);

      // Page scroll speed (px/s), from Lenis when available.
      const scroll = window.scrollY;
      const v = lenis ? lenis.velocity * 60 : (scroll - lastScroll) / Math.max(dt, 1e-3);
      lastScroll = scroll;
      boost += (Math.max(-1500, Math.min(1500, v)) * 0.25 - boost) * Math.min(1, dt * 6);

      rate += ((held ? 0 : 1) - rate) * Math.min(1, dt * 5);

      if (!dragging) {
        // Scrolling down pushes the row along its drift direction; up reverses it.
        x += (dir * speed * rate + dir * boost) * dt + fling * dt;
        fling *= Math.exp(-dt * 3);
      }
      wrap();
      track.style.transform = `translate3d(${x}px, 0, 0)`;
    };

    const onDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      dragging = true;
      moved = 0;
      fling = 0;
      dragStartX = dragLastX = e.clientX;
      dragLastT = performance.now();
    };
    const onMove = (e: PointerEvent) => {
      if (!dragging) return;
      const now = performance.now();
      const dx = e.clientX - dragLastX;
      x += dx;
      moved = Math.max(moved, Math.abs(e.clientX - dragStartX));
      if (moved > 4) root.setPointerCapture(e.pointerId);
      fling = (dx / Math.max(now - dragLastT, 1)) * 1000;
      dragLastX = e.clientX;
      dragLastT = now;
    };
    const onUp = (e: PointerEvent) => {
      if (!dragging) return;
      dragging = false;
      if (root.hasPointerCapture(e.pointerId)) root.releasePointerCapture(e.pointerId);
      fling = Math.max(-3000, Math.min(3000, fling));
    };
    // A drag is not a click.
    const onClick = (e: MouseEvent) => {
      if (moved > 4) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    const hold = () => (held = true);
    const release = (e: Event) => {
      if (e.type === "focusout" && root.contains((e as FocusEvent).relatedTarget as Node)) return;
      held = false;
    };

    const io = new IntersectionObserver(([entry]) => (visible = entry.isIntersecting));
    io.observe(root);

    root.addEventListener("pointerdown", onDown);
    root.addEventListener("pointermove", onMove);
    root.addEventListener("pointerup", onUp);
    root.addEventListener("pointercancel", onUp);
    root.addEventListener("click", onClick, true);
    root.addEventListener("pointerenter", hold);
    root.addEventListener("pointerleave", release);
    root.addEventListener("focusin", hold);
    root.addEventListener("focusout", release);
    gsap.ticker.add(tick);

    return () => {
      gsap.ticker.remove(tick);
      io.disconnect();
      root.removeEventListener("pointerdown", onDown);
      root.removeEventListener("pointermove", onMove);
      root.removeEventListener("pointerup", onUp);
      root.removeEventListener("pointercancel", onUp);
      root.removeEventListener("click", onClick, true);
      root.removeEventListener("pointerenter", hold);
      root.removeEventListener("pointerleave", release);
      root.removeEventListener("focusin", hold);
      root.removeEventListener("focusout", release);
    };
  }, [still, reverse, speed, lenis]);

  if (still) {
    return (
      <div className={cn("flex gap-3 overflow-x-auto px-gutter pb-2", className)}>
        {items(true)}
      </div>
    );
  }

  return (
    <div
      ref={rootRef}
      className={cn(
        "flex cursor-grab touch-pan-y select-none overflow-hidden mask-x-from-90% mask-x-to-100% active:cursor-grabbing",
        className,
      )}
    >
      <div ref={trackRef} className="flex will-change-transform">
        {Array.from({ length: copies }, (_, i) => (
          <div
            key={i}
            ref={i === 0 ? setRef : undefined}
            aria-hidden={i > 0 || undefined}
            className="flex shrink-0 items-center gap-3 pr-3"
          >
            {items(i === 0)}
          </div>
        ))}
      </div>
    </div>
  );
}
