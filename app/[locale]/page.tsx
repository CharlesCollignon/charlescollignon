import { setRequestLocale } from "next-intl/server";
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

  return (
    <>
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
