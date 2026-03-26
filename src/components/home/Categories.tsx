import ProductsCorridorPreview from "@/components/products/home-preview/ProductsCorridorPreview";

export default function Categories({
  verifyMode = false,
}: {
  verifyMode?: boolean;
}) {
  return (
    <div data-home-section="categories">
      <ProductsCorridorPreview verifyMode={verifyMode} />
    </div>
  );
}
