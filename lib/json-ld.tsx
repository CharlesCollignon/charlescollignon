import { SITE, SITE_URL } from "@/lib/site";

/** Renders a JSON-LD block. Input is our own static data, never user content. */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}

export const personLd = (jobTitle: string, description: string) => ({
  "@context": "https://schema.org",
  "@type": "Person",
  name: SITE.name,
  url: SITE_URL,
  jobTitle,
  description,
  email: `mailto:${SITE.email}`,
  worksFor: { "@type": "Organization", name: "QuantCube Technology", url: "https://quant-cube.com" },
  sameAs: SITE.socials.map((s) => s.href),
});
