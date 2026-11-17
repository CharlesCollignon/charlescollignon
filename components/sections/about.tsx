"use client";

import { useTranslations } from "next-intl";
import { Marquee } from "@/components/motion/marquee";
import { ScrollWords } from "@/components/motion/scroll-words";
import { Link } from "@/i18n/navigation";
import { SKILLS, STACK, isExternal, type SkillLink } from "@/content/skills";

/** A ticker chip: a link to the tool's site or to the case study showing the skill. */
function Chip({ item, interactive }: { item: SkillLink; interactive: boolean }) {
  const className =
    "group/chip inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-zinc-300 px-5 py-2.5 text-sm text-zinc-800 transition-colors duration-300 hover:border-zinc-900 hover:bg-zinc-900 hover:text-white dark:border-zinc-800 dark:text-zinc-300 dark:hover:border-zinc-100 dark:hover:bg-zinc-100 dark:hover:text-zinc-900";
  const tabIndex = interactive ? undefined : -1;
  const arrow = (
    <span
      aria-hidden
      className="-mr-1 w-0 overflow-hidden opacity-0 transition-all duration-300 group-hover/chip:w-3 group-hover/chip:opacity-100"
    >
      {isExternal(item.href) ? "↗" : "→"}
    </span>
  );

  return isExternal(item.href) ? (
    <a
      href={item.href}
      target="_blank"
      rel="noopener noreferrer"
      tabIndex={tabIndex}
      draggable={false}
      className={className}
    >
      {item.label}
      {arrow}
    </a>
  ) : (
    <Link href={item.href} tabIndex={tabIndex} draggable={false} className={className}>
      {item.label}
      {arrow}
    </Link>
  );
}

export function About() {
  const t = useTranslations("about");

  return (
    <section id="about" className="relative w-full">
      {/* The robot stands on the left (see robot/rig.ts); the text takes the right. */}
      <div data-camera="about" className="page-x flex min-h-dvh flex-col justify-center py-section">
        <div className="md:ml-auto md:w-[min(56%,52rem)]">
          <p className="eyebrow mb-8 text-zinc-500 md:mb-12 dark:text-zinc-400">
            {t("eyebrow")}
          </p>
          <ScrollWords
            text={t("manifesto")}
            className="max-w-[22ch] text-[clamp(2rem,1rem+3.6vw,5rem)] font-medium leading-[1.04] tracking-[-0.035em] text-zinc-900 dark:text-zinc-50"
          />
        </div>
      </div>

      {/* The robot runs across while these scroll by. */}
      <div data-camera="run" className="flex min-h-dvh flex-col justify-center gap-3">
        <Marquee
          speed={38}
          items={(interactive) =>
            SKILLS.map((item) => (
              <Chip key={item.label} item={item} interactive={interactive} />
            ))
          }
        />
        <Marquee
          speed={46}
          reverse
          items={(interactive) =>
            STACK.map((item) => (
              <Chip key={item.label} item={item} interactive={interactive} />
            ))
          }
        />
      </div>
    </section>
  );
}
