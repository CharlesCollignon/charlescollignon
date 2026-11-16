"use client";

import { useSyncExternalStore } from "react";

function subscribe(cb: () => void) {
  const id = setInterval(cb, 1000);
  return () => clearInterval(id);
}

/** Live wall-clock time in a given IANA time zone (empty on the server). */
export function LocalTime({
  timeZone,
  locale,
}: {
  timeZone: string;
  locale: string;
}) {
  const time = useSyncExternalStore(
    subscribe,
    () =>
      new Intl.DateTimeFormat(locale, {
        timeZone,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }).format(new Date()),
    () => "",
  );
  return (
    <time suppressHydrationWarning className="tabular-nums">
      {time || "--:--:--"}
    </time>
  );
}
