import FabricMotionLab from "@/components/home/FabricMotionLab";

export default function Categories({
  verifyMode = false,
}: {
  verifyMode?: boolean;
}) {
  return (
    <div data-home-section="categories">
      <FabricMotionLab verifyMode={verifyMode} />
    </div>
  );
}
