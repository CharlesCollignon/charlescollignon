import { getTranslations, setRequestLocale } from "next-intl/server";
import { JsonLd, personLd } from "@/lib/json-ld";
import { SceneLoader } from "@/components/scene-loader";
import { Header } from "@/components/header";
import { Hero } from "@/components/sections/hero";
import { About } from "@/components/sections/about";
import { Work } from "@/components/sections/work";
import { Contact } from "@/components/sections/contact";
import { Footer } from "@/components/sections/footer";

export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale });

  return (
    <>
      <JsonLd data={personLd(t("hero.role"), t("meta.description"))} />
      <SceneLoader />
      <Header />
      <main id="main" className="relative w-full">
        <Hero />
        <About />
        <Work />
        <Contact />
        <Footer />
      </main>
    </>
  );
}
