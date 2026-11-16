import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { featuredProjects, getProject } from "@/content/projects";
import { Header } from "@/components/header";
import { Footer } from "@/components/sections/footer";
import { CaseStudy } from "@/components/case/case-study";
import { JsonLd } from "@/lib/json-ld";
import { SITE, SITE_URL } from "@/lib/site";

type Props = { params: Promise<{ locale: string; slug: string }> };

export function generateStaticParams() {
  return routing.locales.flatMap((locale) =>
    featuredProjects.map((p) => ({ locale, slug: p.slug })),
  );
}


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
  const t = await getTranslations({ locale });

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "CreativeWork",
          name: t(`projects.${slug}.title`),
          description: t(`caseStudies.${slug}.intro`),
          url: `${SITE_URL}${locale === routing.defaultLocale ? "" : `/${locale}`}/work/${slug}`,
          inLanguage: locale,
          dateCreated: project.year,
          creator: { "@type": "Person", name: SITE.name, url: SITE_URL },
          ...(project.url ? { sameAs: project.url } : {}),
          keywords: project.stack.join(", "),
        }}
      />
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
