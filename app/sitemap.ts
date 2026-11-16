import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { featuredProjects } from "@/content/projects";

export default function sitemap(): MetadataRoute.Sitemap {
  const entry = (path: string, priority: number): MetadataRoute.Sitemap[number] => ({
    url: `${SITE_URL}${path}`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority,
    alternates: {
      languages: { en: `${SITE_URL}${path}`, fr: `${SITE_URL}/fr${path}` },
    },
  });

  return [
    entry("", 1),
    ...featuredProjects.map((p) => entry(`/work/${p.slug}`, 0.8)),
  ];
}
