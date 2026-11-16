import { getTranslations } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { featuredProjects, getProject } from "@/content/projects";
import { OG_SIZE, ogCard } from "@/lib/og";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "Case study";

export function generateStaticParams() {
  return routing.locales.flatMap((locale) =>
    featuredProjects.map((p) => ({ locale, slug: p.slug })),
  );
}

export default async function Image({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const project = getProject(slug)!;
  const t = await getTranslations({ locale });
  return ogCard({
    eyebrow: `${t("caseStudy.caseStudy")} · ${project.year}`,
    title: t(`projects.${slug}.title`),
    subtitle: t(`projects.${slug}.tagline`),
    background: project.surface,
    color: project.onSurface,
    accent: project.accent,
  });
}
