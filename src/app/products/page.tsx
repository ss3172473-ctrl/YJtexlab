import type { Metadata } from "next";
import MotionHouseShowcase from "@/components/products/MotionHouseShowcase";
import PagePreloadGate from "@/components/products/PagePreloadGate";
import Header from "@/components/site/Header";
import StructuredData from "@/components/site/StructuredData";
import { productsCriticalPreloadAssets, productsPreloadAssets } from "@/lib/preload-assets";
import {
  createBreadcrumbJsonLd,
  createPageMetadata,
  createProductsPageJsonLd,
} from "@/lib/seo";

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
      assets={productsCriticalPreloadAssets}
      backgroundAssets={productsPreloadAssets}
      title="Preparing Products"
      note="Loading the product archive before revealing the first view."
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
