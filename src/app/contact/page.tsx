import type { Metadata } from "next";
import ContactPage from "@/components/contact/ContactPage";
import ContactScrollLock from "@/components/contact/ContactScrollLock";
import Header from "@/components/site/Header";
import StructuredData from "@/components/site/StructuredData";
import {
  createBreadcrumbJsonLd,
  createContactPageJsonLd,
  createPageMetadata,
} from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "Contact",
  path: "/contact",
  description:
    "YJ TexLab에 원단 문의, 샘플 요청, 협업 제안을 전달할 수 있는 공식 문의 페이지입니다.",
  keywords: ["YJ TexLab contact", "fabric inquiry", "textile supplier contact"],
});

export default function Contact() {
  return (
    <>
      <ContactScrollLock />
      <Header />
      <div aria-hidden="true" className="h-[72px] md:h-[84px]" />
      <StructuredData
        data={[
          createContactPageJsonLd(),
          createBreadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Contact", path: "/contact" },
          ]),
        ]}
      />
      <ContactPage />
    </>
  );
}
