import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "fr"],
  defaultLocale: "en",
  // English lives at `/`, French at `/fr`.
  localePrefix: "as-needed",
  // English is the default for everyone; French is opt-in via the switcher.
  localeDetection: false,
});

export type Locale = (typeof routing.locales)[number];
