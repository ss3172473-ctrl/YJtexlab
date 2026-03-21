import { getVariantLabel, type CorridorRuntimeMode, type FabricVariantId } from "./contract";

export function ReviewLabel({
  variantId,
  mode,
  className = "",
}: {
  variantId: FabricVariantId;
  mode: CorridorRuntimeMode;
  className?: string;
}) {
  if (mode !== "review") {
    return null;
  }

  return (
    <div
      data-review-label
      className={[
        "inline-flex items-center gap-3 border border-black/10 bg-white px-3 py-2 font-sans text-[10px] uppercase tracking-[0.34em] text-black/70 shadow-[0_12px_30px_-24px_rgba(15,23,42,0.28)]",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <span>{getVariantLabel(variantId)}</span>
      <span className="h-1 w-1 rounded-full bg-black/20" />
      <span>{mode}</span>
    </div>
  );
}
