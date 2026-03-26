import Categories from "@/components/home/Categories";
import GlobalPresence from "@/components/home/GlobalPresence";
import Locations from "@/components/home/Locations";
import OriginalLoopVideoHero from "@/components/home/OriginalLoopVideoHero";
import Partners from "@/components/home/Partners";
import Footer from "@/components/site/Footer";
import Header from "@/components/site/Header";

type PageSearchParams = Record<string, string | string[] | undefined>;

export default async function Home({
  searchParams,
}: {
  searchParams?: Promise<PageSearchParams>;
}) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const verifyMode =
    resolvedSearchParams.verify === "1" ||
    resolvedSearchParams.freeze === "1";

  return (
    <div
      className="min-h-screen bg-white"
      data-home-shell-version="20260326-production-baseline"
      data-verify-mode={verifyMode ? "true" : undefined}
    >
      <Header />
      <div className="pt-20 md:pt-28" />
      <main>
        <OriginalLoopVideoHero verifyMode={verifyMode} />
        <Categories verifyMode={verifyMode} />
        <Partners />
        <GlobalPresence verifyMode={verifyMode} />
        <Locations verifyMode={verifyMode} />
      </main>
      <Footer />
    </div>
  );
}
