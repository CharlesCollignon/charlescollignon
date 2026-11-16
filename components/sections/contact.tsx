"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import FadeContent from "@/components/FadeContent";
import { HoverLink } from "@/components/animations";
import { Magnetic } from "@/components/motion/magnetic";
import { SplitReveal } from "@/components/motion/split-reveal";
import { LocalTime } from "@/components/motion/local-time";
import { SITE } from "@/lib/site";

export function Contact() {
  const t = useTranslations("contact");
  const locale = useLocale();
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(SITE.email);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      window.location.href = `mailto:${SITE.email}`;
    }
  };

  return (
    <section
      id="contact"
      data-camera="contact"
      className="relative flex min-h-dvh flex-col justify-center py-section"
    >
      <div className="page-x flex flex-col gap-10 md:gap-14">
        <p className="eyebrow text-zinc-400 mix-blend-difference">{t("eyebrow")}</p>

        <SplitReveal
          as="h2"
          by="chars"
          stagger={0.02}
          className="text-display font-semibold text-zinc-200 mix-blend-difference"
        >
          {t("title")}
        </SplitReveal>

        <FadeContent delay={0.2} className="flex max-w-2xl flex-col gap-8">
          <p className="text-lead text-zinc-300 mix-blend-difference">{t("lead")}</p>

          <div className="flex flex-wrap items-center gap-3">
            <Magnetic strength={0.2}>
              <a
                href={`mailto:${SITE.email}`}
                className="inline-flex items-center rounded-full bg-zinc-100 px-7 py-4 text-base font-semibold text-zinc-950 transition-colors hover:bg-white md:text-lg"
              >
                {SITE.email}
              </a>
            </Magnetic>
            <button
              type="button"
              onClick={copy}
              className="rounded-full border border-zinc-500 px-5 py-4 text-sm font-medium text-zinc-200 mix-blend-difference transition-colors hover:border-zinc-200"
            >
              <span aria-live="polite">{copied ? t("copied") : t("copy")}</span>
            </button>
          </div>
        </FadeContent>

        <FadeContent
          delay={0.3}
          className="grid grid-cols-2 gap-6 border-t border-zinc-500/40 pt-6 text-sm text-zinc-300 mix-blend-difference md:grid-cols-4"
        >
          <div className="flex flex-col gap-1">
            <span className="eyebrow text-zinc-500">{t("localTime")}</span>
            <LocalTime timeZone="Europe/Paris" locale={locale} />
          </div>
          <div className="flex flex-col gap-1 md:col-span-2">
            <span className="eyebrow text-zinc-500">{t("elsewhere")}</span>
            <div className="flex gap-6">
              {SITE.socials.map((link) => (
                <HoverLink key={link.name} href={link.href} external>
                  {link.name}
                </HoverLink>
              ))}
            </div>
          </div>
        </FadeContent>
      </div>
    </section>
  );
}
