"use client";

import { useRef } from "react";
import { useTranslations } from "next-intl";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { motion } from "motion/react";
import type { Project, Visual } from "@/content/projects";
import { featuredProjects } from "@/content/projects";
import { Link } from "@/i18n/navigation";
import FadeContent from "@/components/FadeContent";
import { SplitReveal } from "@/components/motion/split-reveal";
import { CountUp } from "@/components/motion/count-up";
import { Magnetic } from "@/components/motion/magnetic";
import { Tilt } from "@/components/motion/tilt";
import { BrowserFrame, PhoneFrame } from "@/components/work/frames";
import { MipConstellation } from "@/components/work/mip-constellation";
import { MipModuleGrid } from "@/components/work/mip-module-grid";
import {
  MipAnatomy,
  MipBeforeAfter,
  MipEngineDiagram,
  MipHorizon,
} from "./mip-visuals";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const EASE = [0.16, 1, 0.3, 1] as const;

export function CaseStudy({ project }: { project: Project }) {
  const t = useTranslations();
  const c = (key: string) => t(`caseStudies.${project.slug}.${key}`);
  const title = t(`projects.${project.slug}.title`);
  const nextProject =
    featuredProjects[
      (featuredProjects.findIndex((p) => p.slug === project.slug) + 1) %
        featuredProjects.length
    ];

  const desktopShots = project.shots.filter((s) => s.device === "desktop");
  const mobileShots = project.shots.filter((s) => s.device === "mobile");
  const heroPhone = mobileShots[0];

  return (
    <div
      className="relative min-h-dvh"
      style={
        {
          backgroundColor: project.surface,
          color: project.onSurface,
          "--accent": project.accent,
        } as React.CSSProperties
      }
    >
      {/* Entrance curtain in the project's accent */}
      <motion.div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-70 origin-top"
        style={{ backgroundColor: project.accent }}
        initial={{ scaleY: 1 }}
        animate={{ scaleY: 0 }}
        transition={{ duration: 0.9, ease: [0.76, 0, 0.24, 1], delay: 0.1 }}
      />

      {/* Hero */}
      <header className="page-x flex min-h-dvh flex-col justify-end gap-10 pb-12 pt-28 md:gap-14 md:pb-16">
        <div className="flex flex-col gap-6">
          <Link
            href="/#work"
            className="eyebrow w-fit opacity-60 transition-opacity hover:opacity-100"
          >
            ← {t("caseStudy.back")}
          </Link>
          <SplitReveal
            as="h1"
            by="chars"
            immediate
            delay={0.6}
            className="max-w-[16ch] text-display font-semibold"
          >
            {title}
          </SplitReveal>
          <FadeContent delay={1} duration={1}>
            <p className="max-w-3xl text-lead opacity-80">{c("intro")}</p>
          </FadeContent>
        </div>

        <FadeContent
          delay={1.2}
          duration={1}
          className="grid gap-6 border-t border-current/15 pt-6 text-sm sm:grid-cols-2 lg:grid-cols-4"
        >
          <Meta label={t("caseStudy.role")}>{c("role")}</Meta>
          <Meta label={t("caseStudy.year")}>{project.year}</Meta>
          <Meta label={t("caseStudy.stack")}>{project.stack.slice(0, 6).join(", ")}</Meta>
          <div className="flex flex-col items-start gap-2">
            {project.url ? (
              <Magnetic strength={0.2}>
                <a
                  href={project.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold"
                  style={{ backgroundColor: project.accent, color: project.onAccent }}
                >
                  {t("caseStudy.visit")} <span aria-hidden>↗</span>
                </a>
              </Magnetic>
            ) : (
              <span className="eyebrow opacity-60">{t("caseStudy.private")}</span>
            )}
            {project.repo && (
              <a
                href={project.repo}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm underline decoration-current/30 underline-offset-4 hover:decoration-current"
              >
                {t("caseStudy.source")} ↗
              </a>
            )}
          </div>
        </FadeContent>
      </header>

      {/* Hero visual */}
      <section className="page-x pb-section">
        {project.slug === "mip" ? (
          <FadeContent duration={1.2}>
            <MipConstellation accent={project.accent} className="mx-auto max-w-5xl max-md:hidden" />
            <MipModuleGrid accent={project.accent} className="md:hidden" />
          </FadeContent>
        ) : project.scroll && project.url ? (
          <FadeContent duration={1.2} className="relative mx-auto max-w-6xl">
            <Tilt max={4}>
              <a href={project.url} target="_blank" rel="noopener noreferrer" tabIndex={-1} data-cursor={t("work.visit")} className="block">
                <BrowserFrame image={project.scroll} url={project.url} alt={title} />
              </a>
              {heroPhone && (
                <div className="absolute -bottom-8 -right-2 w-[22%] md:-right-8">
                  <PhoneFrame image={heroPhone} alt="" />
                </div>
              )}
            </Tilt>
          </FadeContent>
        ) : null}
      </section>

      {/* In numbers */}
      {project.metrics.length > 0 && (
        <section className="page-x pb-section">
          <h2 className="eyebrow mb-8 opacity-60">{t("caseStudy.inNumbers")}</h2>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-10 lg:grid-cols-4">
            {project.metrics.map((m) => (
              <div key={m.key} className="flex flex-col gap-2 border-t border-current/15 pt-5">
                <dd className="order-1 text-[clamp(2.25rem,1.5rem+3vw,4.5rem)] font-semibold leading-none tracking-tight tabular-nums">
                  <CountUp value={m.value} prefix={m.prefix} suffix={m.suffix} />
                </dd>
                <dt className="order-2 max-w-[24ch] text-sm opacity-65">{c(`metrics.${m.key}`)}</dt>
              </div>
            ))}
          </dl>
        </section>
      )}

      {/* Story */}
      <section className="page-x grid gap-14 pb-section md:grid-cols-2 md:gap-10 lg:gap-24">
        {(["challenge", "approach"] as const).map((key) => (
          <div key={key} className="flex flex-col gap-5">
            <h2 className="eyebrow opacity-60">{t(`caseStudy.${key}`)}</h2>
            <FadeContent>
              <p className="text-lead">{c(key)}</p>
            </FadeContent>
          </div>
        ))}
      </section>

      {project.slug === "mip" && <MipSection accent={project.accent} />}

      {/* Highlights */}
      {project.highlights.length > 0 && (
        <section className="page-x pb-section">
          <div className="grid gap-10 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <div className="lg:sticky lg:top-28">
                <h2 className="eyebrow opacity-60">{t("caseStudy.highlights")}</h2>
              </div>
            </div>
            <ol className="flex flex-col lg:col-span-8">
              {project.highlights.map((key, i) => (
                <li key={key} className="group border-t border-current/15 py-8 last:border-b md:py-10">
                  <FadeContent className="grid gap-3 md:grid-cols-[4rem_1fr] md:gap-6">
                    <span className="font-mono text-sm" style={{ color: project.slug === "phronesis" ? undefined : project.accent }}>
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div className="flex flex-col gap-3">
                      <h3 className="text-h3 font-semibold">{c(`highlights.${key}.title`)}</h3>
                      <p className="max-w-2xl text-body opacity-75">{c(`highlights.${key}.body`)}</p>
                    </div>
                  </FadeContent>
                </li>
              ))}
            </ol>
          </div>
        </section>
      )}

      {/* Gallery */}
      {desktopShots.length > 0 && (
        <Gallery
          title={t("caseStudy.gallery")}
          shots={desktopShots}
          caption={(key) => c(`shots.${key}`)}
          url={project.url}
        />
      )}
      {mobileShots.length > 0 && (
        <PhoneRow shots={mobileShots} caption={(key) => c(`shots.${key}`)} />
      )}

      {/* Outcome */}
      <section className="page-x pb-section">
        <div className="flex max-w-4xl flex-col gap-5">
          <h2 className="eyebrow opacity-60">{t("caseStudy.outcome")}</h2>
          <SplitReveal as="p" className="text-[clamp(1.5rem,1rem+2vw,2.75rem)] font-medium leading-tight tracking-tight">
            {c("outcome")}
          </SplitReveal>
        </div>
      </section>

      <NextProject project={nextProject} label={t("caseStudy.next")} title={t(`projects.${nextProject.slug}.title`)} />
    </div>
  );
}

function Meta({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="eyebrow opacity-55">{label}</span>
      <span className="leading-relaxed">{children}</span>
    </div>
  );
}

/** MIP: redrawn diagrams, introduced by the confidentiality notice. */
function MipSection({ accent }: { accent: string }) {
  const t = useTranslations("caseStudies.mip");
  const blocks: { key: Visual; caption: string; node: React.ReactNode }[] = [
    { key: "mip-engine", caption: t("visuals.engine"), node: <MipEngineDiagram accent={accent} /> },
    { key: "mip-anatomy", caption: t("visuals.anatomy"), node: <MipAnatomy accent={accent} /> },
    { key: "mip-before-after", caption: t("visuals.beforeAfter"), node: <MipBeforeAfter accent={accent} /> },
    { key: "mip-horizon", caption: t("visuals.horizon"), node: <MipHorizon accent={accent} /> },
  ];

  return (
    <section className="page-x flex flex-col gap-section pb-section">
      <p className="max-w-2xl border-l-2 pl-4 text-sm opacity-70" style={{ borderColor: accent }}>
        {t("notice")}
      </p>
      {blocks.map((b) => (
        <figure key={b.key} className="flex flex-col gap-6">
          <div className="rounded-3xl border border-current/10 p-4 md:p-10">{b.node}</div>
          <figcaption className="text-sm opacity-60">{b.caption}</figcaption>
        </figure>
      ))}
    </section>
  );
}

/** Desktop screens on a horizontal track, pinned and scrubbed on wide screens. */
function Gallery({
  title,
  shots,
  caption,
  url,
}: {
  title: string;
  shots: Project["shots"];
  caption: (key: string) => string;
  url?: string;
}) {
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(min-width: 768px) and (prefers-reduced-motion: no-preference)", () => {
        const track = ref.current?.querySelector<HTMLElement>("[data-track]");
        if (!track) return;
        const distance = () => track.scrollWidth - window.innerWidth;
        gsap.to(track, {
          x: () => -distance(),
          ease: "none",
          scrollTrigger: {
            trigger: ref.current,
            start: "top top",
            end: () => `+=${distance()}`,
            pin: true,
            scrub: 0.8,
            invalidateOnRefresh: true,
          },
        });
      });
      return () => mm.revert();
    },
    { scope: ref },
  );

  return (
    <section ref={ref} className="flex flex-col justify-center gap-8 pb-section md:h-dvh md:pb-0">
      <h2 className="page-x eyebrow opacity-60">{title}</h2>
      <div
        data-track
        className="flex gap-6 overflow-x-auto px-gutter pb-4 max-md:snap-x max-md:snap-mandatory md:w-max md:gap-10 md:overflow-visible"
      >
        {shots.map((s) => (
          <figure key={s.key} className="flex w-[85vw] shrink-0 snap-center flex-col gap-4 md:w-[min(62vw,1100px)]">
            <BrowserFrame image={s} url={url ?? ""} alt={caption(s.key)} />
            <figcaption className="text-sm opacity-65">{caption(s.key)}</figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}

/** Phone screens in a row, each drifting at its own speed. */
function PhoneRow({ shots, caption }: { shots: Project["shots"]; caption: (key: string) => string }) {
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      gsap.utils.toArray<HTMLElement>("[data-phone]", ref.current).forEach((el, i) => {
        gsap.fromTo(
          el,
          { y: 60 + (i % 3) * 50 },
          {
            y: -(20 + (i % 3) * 30),
            ease: "none",
            scrollTrigger: { trigger: ref.current, start: "top bottom", end: "bottom top", scrub: true },
          },
        );
      });
    },
    { scope: ref },
  );

  return (
    <section ref={ref} className="overflow-hidden pb-section">
      <div className="page-x grid grid-cols-2 gap-4 sm:grid-cols-3 md:gap-6 lg:grid-cols-6">
        {shots.map((s) => (
          <figure key={s.key} data-phone className="flex flex-col gap-3">
            <PhoneFrame image={s} alt={caption(s.key)} />
            <figcaption className="text-center text-xs opacity-60">{caption(s.key)}</figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}

function NextProject({ project, label, title }: { project: Project; label: string; title: string }) {
  return (
    <Link
      href={`/work/${project.slug}`}
      data-cursor={label}
      className="group relative block overflow-hidden"
      style={{ backgroundColor: project.accent, color: project.onAccent }}
    >
      <div className="page-x flex min-h-[60dvh] flex-col justify-between gap-10 py-12 md:py-16">
        <span className="eyebrow opacity-70">{label}</span>
        <div className="flex items-end justify-between gap-6">
          <span className="text-display font-semibold transition-transform duration-700 ease-out-expo group-hover:-translate-y-2">
            {title}
          </span>
          <motion.span
            aria-hidden
            className="mb-4 text-[clamp(2rem,1rem+4vw,5rem)] leading-none"
            initial={{ x: -10, opacity: 0.6 }}
            whileHover={{ x: 0, opacity: 1 }}
            transition={{ ease: EASE }}
          >
            →
          </motion.span>
        </div>
      </div>
    </Link>
  );
}
