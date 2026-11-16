"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import FadeContent from "@/components/FadeContent";
import { HoverLink } from "@/components/animations";
import { Magnetic } from "@/components/motion/magnetic";
import { SplitReveal } from "@/components/motion/split-reveal";
import { SITE } from "@/lib/site";

export function Contact() {
  const t = useTranslations("contact");
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
    <section id="contact" className="flex min-h-dvh items-center">
      <div className="page-x flex flex-col items-center gap-10 text-center md:gap-12">
        <div className="flex flex-col items-center">
          <p className="eyebrow text-zinc-900 dark:text-zinc-400">
            {t("eyebrow")}
          </p>
          <SplitReveal
            as="h2"
            className="mt-4 max-w-[12ch] text-h2 font-bold text-zinc-400 mix-blend-difference dark:text-zinc-200"
          >
            {t("title")}
          </SplitReveal>
        </div>

        <FadeContent delay={0.2}>
          <div className="flex flex-col items-center gap-4">
            <Magnetic strength={0.15}>
              <a
                href={`mailto:${SITE.email}`}
                className="break-all text-lead font-medium text-zinc-400 mix-blend-difference transition-colors hover:text-zinc-600 md:text-3xl dark:text-zinc-200 dark:hover:text-zinc-400"
              >
                {SITE.email}
              </a>
            </Magnetic>
            <button
              type="button"
              onClick={copy}
              data-cursor={copied ? t("copied") : t("copy")}
              className="rounded-full border border-zinc-300 px-4 py-1.5 text-xs font-medium text-zinc-700 transition-colors hover:border-zinc-500 dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-zinc-400"
            >
              <span aria-live="polite">{copied ? t("copied") : t("copy")}</span>
            </button>
          </div>
        </FadeContent>

        <FadeContent delay={0.3}>
          <div className="flex items-center justify-center gap-6 md:gap-8">
            {SITE.socials.map((link) => (
              <HoverLink
                key={link.name}
                href={link.href}
                external
                className="text-sm font-medium text-zinc-900 transition-colors hover:text-zinc-700 md:text-base dark:text-zinc-400 dark:hover:text-zinc-100"
              >
                {link.name}
              </HoverLink>
            ))}
          </div>
        </FadeContent>
      </div>
    </section>
  );
}
