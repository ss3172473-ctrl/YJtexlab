import type { CorridorRuntimeConfig } from "./runtime-config";
import {
  VariantAShell,
  VariantBShell,
  VariantCShell,
} from "./variants";
import type { VariantId } from "./contract";

type VariantShellProps = {
  mode: CorridorRuntimeConfig["mode"];
};

const VARIANT_COMPONENTS: Record<VariantId, (props: VariantShellProps) => JSX.Element> = {
  A: VariantAShell,
  B: VariantBShell,
  C: VariantCShell,
};

function resolveVisibleVariantIds(runtimeConfig: CorridorRuntimeConfig) {
  if (runtimeConfig.mode === "production") {
    return [runtimeConfig.promotedVariant];
  }

  if (runtimeConfig.reviewLayout === "single") {
    return [runtimeConfig.reviewVariant ?? runtimeConfig.promotedVariant];
  }

  return ["A", "B", "C"] as VariantId[];
}

export default function FabricVariantCorridor({
  runtimeConfig,
}: {
  runtimeConfig: CorridorRuntimeConfig;
}) {
  const visibleVariantIds = resolveVisibleVariantIds(runtimeConfig);

  return (
    <section
      id="categories"
      className="bg-white pb-20 md:pb-28"
      data-corridor-mode={runtimeConfig.mode}
      data-promoted-variant={runtimeConfig.promotedVariant}
      data-review-variant={runtimeConfig.reviewVariant ?? ""}
      data-review-tools={runtimeConfig.showReviewTools}
      data-review-layout={runtimeConfig.reviewLayout}
    >
      {visibleVariantIds.map((variantId) => {
        const Component = VARIANT_COMPONENTS[variantId];

        return <Component key={variantId} mode={runtimeConfig.mode} />;
      })}
    </section>
  );
}
