"use client";

import { useTranslations } from "next-intl";
import FadeContent from "@/components/FadeContent";
import { SplitReveal } from "@/components/motion/split-reveal";
import { projects, type Project } from "@/content/projects";

export function Work() {
  const t = useTranslations("work");
  const featured = projects.filter((p) => p.featured);
  const minor = projects.filter((p) => !p.featured);

  return (
    <section
      id="work"
      className="flex min-h-dvh w-full items-center py-section"
    >
      <div className="page-x flex flex-col gap-12 md:gap-16">
        <div className="flex flex-col items-center text-center">
          <p className="eyebrow text-zinc-900 dark:text-zinc-400">
            {t("eyebrow")}
          </p>
          <SplitReveal
            as="h2"
            className="mt-2 text-h2 font-bold text-zinc-900 dark:text-zinc-100"
          >
            {t("title")}
          </SplitReveal>
        </div>

        <div className="grid gap-6 md:grid-cols-3 md:gap-8">
          {featured.map((project, i) => (
            <FadeContent key={project.slug} delay={i * 0.1}>
              <FeaturedCard project={project} />
            </FadeContent>
          ))}
        </div>

        {minor.map((project) => (
          <FadeContent key={project.slug}>
            <MinorRow project={project} />
          </FadeContent>
        ))}
      </div>
    </section>
  );
}

function FeaturedCard({ project }: { project: Project }) {
  const t = useTranslations();
  const href = project.url;
  const Tag = href ? "a" : "div";

  return (
    <Tag
      {...(href
        ? { href, target: "_blank", rel: "noopener noreferrer" }
        : {})}
      data-cursor={href ? t("work.visit") : undefined}
      className="group relative flex aspect-4/5 flex-col justify-between overflow-hidden rounded-2xl p-6 transition-transform duration-500 ease-out-expo hover:-translate-y-1 md:p-8"
      style={{ backgroundColor: project.accent, color: project.onAccent }}
    >
      <div className="flex items-center justify-between text-xs font-medium uppercase tracking-[0.2em] opacity-70">
        <span>{project.year}</span>
        {!href && <span>{t("work.private")}</span>}
      </div>
      <div>
        <h3 className="text-h3 font-semibold">
          {t(`projects.${project.slug}.title`)}
        </h3>
        <p className="mt-3 text-sm leading-relaxed opacity-80">
          {t(`projects.${project.slug}.tagline`)}
        </p>
        <p className="mt-6 text-xs opacity-60">{project.stack.join(" · ")}</p>
      </div>
    </Tag>
  );
}

function MinorRow({ project }: { project: Project }) {
  const t = useTranslations();

  return (
    <a
      href={project.url}
      target="_blank"
      rel="noopener noreferrer"
      data-cursor={t("work.visit")}
      className="group flex flex-col gap-4 border-t border-zinc-300 pt-6 md:flex-row md:items-center md:justify-between dark:border-zinc-800"
    >
      <div>
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          {t(`projects.${project.slug}.title`)}
        </h3>
        <p className="mt-1 text-sm text-zinc-700 dark:text-zinc-400">
          {t(`projects.${project.slug}.tagline`)}
        </p>
      </div>
      <p className="text-xs text-zinc-500">
        {project.year} · {project.stack.join(" · ")}
      </p>
    </a>
  );
}
