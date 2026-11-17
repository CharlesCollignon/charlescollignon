"use client";

import { useSyncExternalStore } from "react";

/**
 * A once-a-second clock shared by every <LocalTime>. React reads the cached
 * timestamp, so repeated reads within a render always agree.
 */
let now = 0;
const listeners = new Set<() => void>();
let timer: ReturnType<typeof setInterval> | undefined;

function subscribe(cb: () => void) {
  listeners.add(cb);
  if (!timer) {
    now = Date.now();
    timer = setInterval(() => {
      now = Date.now();
      listeners.forEach((l) => l());
    }, 1000);
  }
  return () => {
    listeners.delete(cb);
    if (!listeners.size && timer) {
      clearInterval(timer);
      timer = undefined;
    }
  };
}

const getSnapshot = () => now;
const getServerSnapshot = () => 0;

/** Live wall-clock time in a given IANA time zone (empty on the server). */
export function LocalTime({
  timeZone,
  locale,
}: {
  timeZone: string;
  locale: string;
}) {
  const time = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const label = time
    ? new Intl.DateTimeFormat(locale, {
        timeZone,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }).format(time)
    : "--:--:--";
  return (
    <time suppressHydrationWarning className="tabular-nums">
      {label}
    </time>
  );
}
