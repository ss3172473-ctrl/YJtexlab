import Header from "@/components/Header";
import OriginalLoopVideoHero from "@/components/OriginalLoopVideoHero";
import Categories from "@/components/Categories";
import Footer from "@/components/Footer";
import Locations from "@/components/Locations";
import Partners from "@/components/Partners";
import GlobalPresence from "@/components/GlobalPresence";

type PageSearchParams = Record<string, string | string[] | undefined>;

export default async function Home({
  searchParams,
}: {
  searchParams?: Promise<PageSearchParams>;
}) {
  const resolvedSearchParams = await searchParams;

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <div className="pt-20 md:pt-28" />
      <main>
        <OriginalLoopVideoHero />
        <Categories searchParams={resolvedSearchParams} />
        <Partners />
        <GlobalPresence />
        <Locations />
      </main>
      <Footer />
    </div>
  );
}
