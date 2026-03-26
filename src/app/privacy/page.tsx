import type { Metadata } from "next";
import Footer from "@/components/site/Footer";
import Header from "@/components/site/Header";
import LegalHoldingPage from "@/components/site/LegalHoldingPage";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "Privacy Policy",
  path: "/privacy",
  description:
    "YJ TexLab의 개인정보 처리 안내 페이지입니다. 현재 상세 정책 문서를 준비 중입니다.",
  noIndex: true,
});

export default function PrivacyPage() {
  return (
    <>
      <Header />
      <LegalHoldingPage slug="Privacy Policy" title="Privacy Policy" />
      <Footer />
    </>
  );
}
