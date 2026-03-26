import type { Metadata } from "next";
import AboutPage from "@/components/about/AboutPage";
import StructuredData from "@/components/site/StructuredData";
import Header from "@/components/site/Header";
import {
  createAboutPageJsonLd,
  createBreadcrumbJsonLd,
  createPageMetadata,
} from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "About Us",
  path: "/about",
  description:
    "YJ TexLab의 60년 역사, 선염 중심의 제조 철학, 그리고 프리미엄 면원단 공급 역량을 소개합니다.",
  keywords: ["about YJ TexLab", "textile history", "yarn-dyed process"],
});

export default function About() {
  return (
    <>
      <Header />
      <StructuredData
        data={[
          createAboutPageJsonLd(),
          createBreadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "About Us", path: "/about" },
          ]),
        ]}
      />
      <AboutPage />
    </>
  );
}
