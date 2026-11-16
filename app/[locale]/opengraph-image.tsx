import { getTranslations } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { OG_SIZE, ogCard } from "@/lib/og";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "Charles Collignon";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function Image({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  return ogCard({
    eyebrow: t("hero.role"),
    title: "Charles Collignon",
    subtitle: t("about.manifesto"),
  });
}
