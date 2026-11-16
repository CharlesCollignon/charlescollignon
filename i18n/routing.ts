import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "fr"],
  defaultLocale: "en",
  // English lives at `/`, French at `/fr`.
  localePrefix: "as-needed",
  // English is the default for everyone; French is opt-in via the switcher.
  localeDetection: false,
  // hreflang alternates come from page metadata; skip the duplicate Link header.
  alternateLinks: false,
});

export type Locale = (typeof routing.locales)[number];
