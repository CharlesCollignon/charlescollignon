"use client";

import { useLocale, useTranslations } from "next-intl";
import { ThemeToggle } from "./theme-toggle";
import { HoverLink } from "./animations";
import FadeContent from "@/components/FadeContent";
import { Link, usePathname } from "@/i18n/navigation";

export function Header() {
  const t = useTranslations("nav");
  const locale = useLocale();
  const pathname = usePathname();
  const other = locale === "en" ? "fr" : "en";

  const linkClass =
    "transition-colors hover:text-zinc-900 dark:hover:text-zinc-100";

  return (
    <FadeContent
      blur
      delay={1.3}
      duration={1.2}
      className="fixed inset-x-0 top-4 z-50 mx-auto w-max rounded-full p-2 pl-6 backdrop-blur-md md:pl-8"
    >
      <nav className="flex items-center gap-6 text-sm font-medium text-zinc-600 md:gap-8 dark:text-zinc-400">
        <HoverLink href="#about" className={linkClass}>
          {t("about")}
        </HoverLink>
        <HoverLink href="#work" className={linkClass}>
          {t("work")}
        </HoverLink>
        <HoverLink href="#contact" className={linkClass}>
          {t("contact")}
        </HoverLink>
        <div className="flex items-center gap-2">
          <Link
            href={pathname}
            locale={other}
            aria-label={t("switchTo")}
            className="flex size-10 items-center justify-center rounded-full text-xs font-semibold uppercase tracking-wider transition-colors hover:bg-zinc-200 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
          >
            {other}
          </Link>
          <ThemeToggle label={t("theme")} />
        </div>
      </nav>
    </FadeContent>
  );
}
