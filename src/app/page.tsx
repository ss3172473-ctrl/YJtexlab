import type { Metadata } from "next";
import Categories from "@/components/home/Categories";
import GlobalPresence from "@/components/home/GlobalPresence";
import Locations from "@/components/home/Locations";
import OriginalLoopVideoHero from "@/components/home/OriginalLoopVideoHero";
import Partners from "@/components/home/Partners";
import StructuredData from "@/components/site/StructuredData";
import Footer from "@/components/site/Footer";
import Header from "@/components/site/Header";
import {
  createBreadcrumbJsonLd,
  createHomePageJsonLd,
  createPageMetadata,
} from "@/lib/seo";

type PageSearchParams = Record<string, string | string[] | undefined>;

export const metadata: Metadata = createPageMetadata({
  title: "YJ TexLab | Premium Yarn-Dyed Cotton Fabrics Since 1962",
  absoluteTitle: true,
  path: "/",
  description:
    "YJ TexLab은 1962년부터 이어진 선염 면원단 전문 기업으로, 서울과 대구 거점을 통해 프리미엄 코튼 패브릭을 공급합니다.",
  keywords: ["premium yarn-dyed cotton fabrics", "Korean textile manufacturer"],
});

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
      <StructuredData
        data={[
          createHomePageJsonLd(),
          createBreadcrumbJsonLd([{ name: "Home", path: "/" }]),
        ]}
      />
      <main className="pt-[calc(env(safe-area-inset-top)+5rem)] md:pt-[calc(env(safe-area-inset-top)+7rem)]">
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
