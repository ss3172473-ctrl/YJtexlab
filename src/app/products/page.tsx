import type { Metadata } from "next";
import MotionHouseShowcase from "@/components/products/MotionHouseShowcase";
import PagePreloadGate from "@/components/products/PagePreloadGate";
import { getFabricDesktopPreloadSrc } from "@/components/products/fabricImageVariants";
import Header from "@/components/site/Header";
import StructuredData from "@/components/site/StructuredData";
import { productsCriticalPreloadAssets } from "@/lib/preload-assets";
import {
  createBreadcrumbJsonLd,
  createPageMetadata,
  createProductsPageJsonLd,
} from "@/lib/seo";

const PRODUCT_OPENING_PRELOAD_COUNT = 0;
const productOpeningPreloadAssets = productsCriticalPreloadAssets
  .slice(0, PRODUCT_OPENING_PRELOAD_COUNT)
  .map(getFabricDesktopPreloadSrc);

export const metadata: Metadata = createPageMetadata({
  title: "Products",
  path: "/products",
  description:
    "YJ TexLab의 체크, 스트라이프, 기타 프리미엄 면원단 아카이브를 탐색하고 문의로 연결할 수 있는 제품 페이지입니다.",
  keywords: ["fabric archive", "checks fabric", "stripes fabric", "premium cotton fabrics"],
});

export default function ProductsPage() {
  return (
    <PagePreloadGate
      assets={productOpeningPreloadAssets}
      title="Preparing Products"
      note="Loading only the opening fabrics first so the archive can stream in as you explore."
    >
      <div className="min-h-screen bg-white">
        <Header />
        <div className="pt-20 md:pt-28" />
        <StructuredData
          data={[
            createProductsPageJsonLd(),
            createBreadcrumbJsonLd([
              { name: "Home", path: "/" },
              { name: "Products", path: "/products" },
            ]),
          ]}
        />
        <div className="bg-white">
          <MotionHouseShowcase railStudySlug="orbital-inspection-board" />
        </div>
      </div>
    </PagePreloadGate>
  );
}
