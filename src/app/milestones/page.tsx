import type { Metadata } from "next";
import MilestonesPageContent from "@/components/milestones/MilestonesPageContent";
import StructuredData from "@/components/site/StructuredData";
import {
  createBreadcrumbJsonLd,
  createMilestonesPageJsonLd,
  createPageMetadata,
} from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "Milestones",
  path: "/milestones",
  description:
    "YJ TexLab의 주요 연혁과 성장 궤적을 통해 브랜드의 축적된 신뢰와 제조 역량을 확인할 수 있습니다.",
  keywords: ["YJ TexLab milestones", "textile company history"],
});

export default function MilestonesPage() {
  return (
    <>
      <StructuredData
        data={[
          createMilestonesPageJsonLd(),
          createBreadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Milestones", path: "/milestones" },
          ]),
        ]}
      />
      <MilestonesPageContent />
    </>
  );
}
