"use client";

import { useRef } from "react";
import { useTranslations } from "next-intl";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { SplitReveal } from "@/components/motion/split-reveal";
import { ProjectPanel } from "@/components/work/project-panel";
import { AlsoList } from "@/components/work/also-list";
import { featuredProjects, projects } from "@/content/projects";
import { setSceneCovered } from "@/lib/scene-bus";

gsap.registerPlugin(ScrollTrigger, useGSAP);

export function Work() {
  const t = useTranslations("work");
  const sectionRef = useRef<HTMLElement>(null);
  const stackRef = useRef<HTMLDivElement>(null);
  const minor = projects.filter((p) => !p.featured);

  useGSAP(
    () => {
      const stack = stackRef.current;
      if (!stack) return;

      // From the first panel to the end of the section everything is opaque:
      // let the 3D background rest meanwhile.
      ScrollTrigger.create({
        trigger: stack,
        start: "top top",
        endTrigger: sectionRef.current,
        end: "bottom bottom",
        onToggle: (self) => setSceneCovered(self.isActive),
      });

      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      const slots = gsap.utils.toArray<HTMLElement>("[data-slot]", stack);
      slots.forEach((slot, i) => {
        const panel = slot.querySelector<HTMLElement>("[data-panel]");
        const next = slots[i + 1];
        if (!panel) return;

        // The product rises a little slower than the copy as a panel arrives.
        const visual = panel.querySelector("[data-depth]");
        if (visual) {
          gsap.fromTo(
            visual,
            { yPercent: 30 },
            {
              yPercent: 0,
              ease: "none",
              scrollTrigger: { trigger: slot, start: "top bottom", end: "top top", scrub: true },
            },
          );
        }

        // As the next panel slides over, this one sinks back and dims.
        if (next) {
          gsap.to(panel, {
            scale: 0.92,
            filter: "brightness(0.55)",
            borderRadius: "2.5rem",
            ease: "none",
            scrollTrigger: { trigger: next, start: "top bottom", end: "top top", scrub: true },
          });
        }
      });
    },
    { scope: stackRef },
  );

  return (
    <section ref={sectionRef} id="work" data-camera="work" className="relative pt-section">
      <div className="page-x mb-12 flex flex-col gap-2 md:mb-20">
        <p className="eyebrow text-zinc-500 dark:text-zinc-400">{t("eyebrow")}</p>
        <SplitReveal
          as="h2"
          by="words"
          className="text-h2 font-semibold text-zinc-900 dark:text-zinc-50"
        >
          {t("title")}
        </SplitReveal>
      </div>

      <div ref={stackRef} className="relative">
        {featuredProjects.map((project, i) => (
          <div
            key={project.slug}
            data-slot
            className="sticky top-0 h-dvh"
          >
            <ProjectPanel
              project={project}
              index={i}
              total={featuredProjects.length}
            />
          </div>
        ))}
      </div>

      <div className="relative bg-white py-section dark:bg-black">
        <div className="page-x">
          <AlsoList projects={minor} />
        </div>
      </div>
    </section>
  );
}
