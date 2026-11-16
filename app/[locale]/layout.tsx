import type { Metadata } from "next";
import { Figtree } from "next/font/google";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { routing } from "@/i18n/routing";
import { ThemeProvider } from "@/components/theme-provider";
import { SmoothScroll } from "@/components/providers/smooth-scroll";
import { Cursor } from "@/components/motion/cursor";
import { SITE_URL } from "@/lib/site";
import "../globals.css";

// Variable font: one file covers every weight.
const figtree = Figtree({
  variable: "--font-figtree",
  subsets: ["latin"],
});

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  const path = locale === routing.defaultLocale ? "/" : `/${locale}`;

  return {
    metadataBase: new URL(SITE_URL),
    title: t("title"),
    description: t("description"),
    alternates: {
      canonical: path,
      languages: { en: "/", fr: "/fr", "x-default": "/" },
    },
    openGraph: {
      type: "website",
      url: path,
      siteName: "Charles Collignon",
      title: t("title"),
      description: t("description"),
      locale: locale === "fr" ? "fr_FR" : "en_US",
    },
    twitter: { card: "summary_large_image" },
  };
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "nav" });

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <noscript>
          <style>{`[data-fade]{opacity:1!important;visibility:visible!important}`}</style>
        </noscript>
      </head>
      <body
        className={`${figtree.variable} font-sans antialiased`}
        suppressHydrationWarning
      >
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-100 focus:rounded-full focus:bg-zinc-900 focus:px-4 focus:py-2 focus:text-sm focus:text-white dark:focus:bg-zinc-100 dark:focus:text-zinc-900"
        >
          {t("skip")}
        </a>
        <NextIntlClientProvider>
          <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
            <SmoothScroll>
              {children}
              <Cursor />
            </SmoothScroll>
          </ThemeProvider>
        </NextIntlClientProvider>
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}
