import {
  type CorridorRuntimeMode,
  type FabricCategoryId,
  type FabricCoverageCard,
  type FabricVariantId,
} from "./contract";
import { FabricMediaFrame } from "./FabricMediaFrame";

export function CoverageGrid({
  cards,
  variantId,
  categoryId,
  mode,
  className = "",
  cardClassName = "",
  imageClassName = "",
}: {
  cards: FabricCoverageCard[];
  variantId: FabricVariantId;
  categoryId: FabricCategoryId;
  mode: CorridorRuntimeMode;
  className?: string;
  cardClassName?: string;
  imageClassName?: string;
}) {
  return (
    <div
      className={[
        "grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-5 xl:gap-4",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {cards.map((card) => (
        <FabricMediaFrame
          key={card.manifestKey}
          card={card}
          variantId={variantId}
          categoryId={categoryId}
          mode={mode}
          className={cardClassName}
          imageClassName={imageClassName}
        />
      ))}
    </div>
  );
}
