import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { featuredProjects, getProject } from "@/content/projects";
import { Header } from "@/components/header";
import { Footer } from "@/components/sections/footer";
import { CaseStudy } from "@/components/case/case-study";

type Props = { params: Promise<{ locale: string; slug: string }> };

export function generateStaticParams() {
  return routing.locales.flatMap((locale) =>
    featuredProjects.map((p) => ({ locale, slug: p.slug })),
  );
}

export const dynamicParams = false;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const project = getProject(slug);
  if (!project) return {};
  const t = await getTranslations({ locale });
  const title = `${t(`projects.${slug}.title`)} | ${t("caseStudy.caseStudy")} | Charles Collignon`;
  const description = t(`caseStudies.${slug}.intro`);
  const path = `${locale === routing.defaultLocale ? "" : `/${locale}`}/work/${slug}`;

  return {
    title,
    description,
    alternates: {
      canonical: path,
      languages: { en: `/work/${slug}`, fr: `/fr/work/${slug}`, "x-default": `/work/${slug}` },
    },
    openGraph: { type: "article", url: path, title, description },
  };
}

export default async function CaseStudyPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const project = getProject(slug);
  if (!project?.featured) notFound();

  return (
    <>
      <Header />
      <main id="main">
        <CaseStudy project={project} />
      </main>
      <div style={{ backgroundColor: project.surface, color: project.onSurface }}>
        <Footer />
      </div>
    </>
  );
}
