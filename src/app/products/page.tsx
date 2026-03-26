import MotionHouseShowcase from "@/components/products/MotionHouseShowcase";
import PagePreloadGate from "@/components/products/PagePreloadGate";
import Header from "@/components/site/Header";
import { productsPreloadAssets } from "@/lib/preload-assets";

export default function ProductsPage() {
  return (
    <PagePreloadGate
      assets={productsPreloadAssets}
      title="Preparing The Fabric Board"
      note="We are loading the orbital fabric archive before revealing the products page."
    >
      <div className="min-h-screen bg-white">
        <Header />
        <div className="pt-20 md:pt-28" />
        <div className="bg-white">
          <MotionHouseShowcase railStudySlug="orbital-inspection-board" />
        </div>
      </div>
    </PagePreloadGate>
  );
}
