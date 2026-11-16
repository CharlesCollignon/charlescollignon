import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * An endless horizontal ticker. The track is rendered twice and slid by
 * exactly one copy's width, so the loop is seamless. Pauses on hover and
 * stops for reduced motion (see `.marquee-track` in globals.css).
 */
export function Marquee({
  children,
  reverse = false,
  seconds = 40,
  className,
}: {
  children: ReactNode;
  reverse?: boolean;
  /** Duration of one full loop. */
  seconds?: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "group flex overflow-hidden mask-x-from-85% mask-x-to-100%",
        className,
      )}
    >
      {[0, 1].map((copy) => (
        <div
          key={copy}
          aria-hidden={copy === 1}
          className="marquee-track flex shrink-0 items-center gap-3 pr-3 group-hover:[animation-play-state:paused]"
          style={{
            animationDuration: `${seconds}s`,
            animationDirection: reverse ? "reverse" : "normal",
          }}
        >
          {children}
        </div>
      ))}
    </div>
  );
}
