import Image from "next/image";

import {
  getCoverageAuditAttributes,
  type CorridorRuntimeMode,
  type FabricCategoryId,
  type FabricCoverageCard,
  type FabricVariantId,
} from "./contract";

export function FabricMediaFrame({
  card,
  variantId,
  categoryId,
  mode,
  className = "",
  imageClassName = "",
  sizes = "(min-width: 1600px) 14vw, (min-width: 1280px) 16vw, (min-width: 768px) 20vw, 44vw",
}: {
  card: FabricCoverageCard;
  variantId: FabricVariantId;
  categoryId: FabricCategoryId;
  mode: CorridorRuntimeMode;
  className?: string;
  imageClassName?: string;
  sizes?: string;
}) {
  return (
    <article
      {...getCoverageAuditAttributes({
        variantId,
        categoryId,
        manifestIndex: card.manifestIndex,
        manifestKey: card.manifestKey,
        mode,
      })}
      className={[
        "relative aspect-[4/3] overflow-hidden border border-black/10 bg-white",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <Image
        src={card.src}
        alt={card.name}
        fill
        sizes={sizes}
        className={["object-cover", imageClassName].filter(Boolean).join(" ")}
        priority={card.manifestIndex < 2}
      />
    </article>
  );
}
