"use client";

import { useFormatter, useTranslations } from "next-intl";
import type { Project } from "@/content/projects";
import { Magnetic } from "@/components/motion/magnetic";
import { Tilt } from "@/components/motion/tilt";
import { BrowserFrame, PhoneFrame } from "./frames";
import { MipConstellation } from "./mip-constellation";
import { MipModuleGrid } from "./mip-module-grid";

/**
 * One full-viewport project slide: copy on the left, the product on the right,
 * painted in the project's own surface and accent colours.
 */
export function ProjectPanel({
  project,
  index,
  total,
}: {
  project: Project;
  index: number;
  total: number;
}) {
  const t = useTranslations();
  const format = useFormatter();
  const title = t(`projects.${project.slug}.title`);
  const phone = project.shots.find((s) => s.device === "mobile");

  return (
    <article
      data-panel
      className="relative flex h-full flex-col overflow-hidden rounded-t-[1.75rem] md:rounded-t-[2.5rem]"
      style={{ backgroundColor: project.surface, color: project.onSurface }}
    >
      {/* Soft accent light behind the product */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-1/4 top-1/4 size-[70vmax] rounded-full opacity-25 blur-3xl"
        style={{
          background: `radial-gradient(closest-side, ${project.accent}, transparent)`,
        }}
      />

      <div className="page-x relative grid h-full min-h-0 grid-rows-[auto_1fr] gap-6 pb-6 pt-20 md:pt-24 lg:grid-cols-12 lg:grid-rows-1 lg:items-center lg:gap-10 lg:pb-12">
        {/* Copy */}
        <div className="flex flex-col gap-4 lg:col-span-5 lg:gap-6">
          <div className="flex items-center gap-3 font-mono text-xs opacity-60">
            <span>
              {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
            </span>
            <span className="h-px w-8 bg-current" />
            <span>{project.year}</span>
            {!project.url && <span>· {t("caseStudy.private")}</span>}
          </div>

          <h3 className="text-h2 font-semibold">{title}</h3>

          <p className="max-w-md text-body opacity-75 max-md:line-clamp-3">
            {t(`projects.${project.slug}.tagline`)}
          </p>

          <dl className="grid max-w-md grid-cols-2 gap-x-6 gap-y-3 max-lg:hidden">
            {project.metrics.slice(0, 4).map((m) => (
              <div key={m.key} className="border-t border-current/15 pt-3">
                <dt className="sr-only">
                  {t(`caseStudies.${project.slug}.metrics.${m.key}`)}
                </dt>
                <dd>
                  <span
                    className="block text-2xl font-semibold tabular-nums"
                    style={{ color: project.slug === "phronesis" ? undefined : project.accent }}
                  >
                    {m.prefix}
                    {format.number(m.value)}
                    {m.suffix}
                  </span>
                  <span aria-hidden className="mt-1 block text-xs leading-snug opacity-60">
                    {t(`caseStudies.${project.slug}.metrics.${m.key}`)}
                  </span>
                </dd>
              </div>
            ))}
          </dl>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            {project.url && (
              <Magnetic strength={0.25}>
                <a
                  href={project.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition-transform"
                  style={{ backgroundColor: project.accent, color: project.onAccent }}
                >
                  {t("work.viewLive")}
                  <span aria-hidden>↗</span>
                </a>
              </Magnetic>
            )}
            <ul className="flex flex-wrap gap-x-3 gap-y-1 text-xs opacity-55 max-md:hidden">
              {project.stack.slice(0, 4).map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Product */}
        <div className="relative flex min-h-0 items-center justify-center lg:col-span-7">
          {project.slug === "mip" ? (
            <>
              <MipConstellation
                accent={project.accent}
                className="max-h-full w-full max-w-3xl max-md:hidden"
              />
              <MipModuleGrid accent={project.accent} className="md:hidden" />
            </>
          ) : project.scroll && project.url ? (
            <Tilt className="relative w-full max-w-[min(100%,calc((100dvh-22rem)*1.6))] lg:max-w-3xl" max={6}>
              <a
                href={project.url}
                target="_blank"
                rel="noopener noreferrer"
                tabIndex={-1}
                data-cursor={t("work.visit")}
                className="block"
              >
                <BrowserFrame image={project.scroll} url={project.url} alt={title} />
              </a>
              {phone && (
                <div data-depth className="absolute -bottom-6 -right-2 w-[24%] md:-right-6 lg:-bottom-10 lg:-right-10">
                  <PhoneFrame image={phone} alt="" />
                </div>
              )}
            </Tilt>
          ) : null}
        </div>
      </div>
    </article>
  );
}
