import type { Metadata } from "next";
import Footer from "@/components/site/Footer";
import Header from "@/components/site/Header";
import LegalHoldingPage from "@/components/site/LegalHoldingPage";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "Terms of Service",
  path: "/terms",
  description:
    "YJ TexLab의 이용약관 안내 페이지입니다. 현재 상세 약관 문서를 준비 중입니다.",
  noIndex: true,
});

export default function TermsPage() {
  return (
    <>
      <Header />
      <LegalHoldingPage slug="Terms of Service" title="Terms of Service" />
      <Footer />
    </>
  );
}
