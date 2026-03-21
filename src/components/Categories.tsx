import { headers } from "next/headers";

import FabricVariantCorridor from "@/components/fabric-corridor/FabricVariantCorridor";
import { resolveCorridorRuntimeConfig, type CorridorSearchParams } from "@/components/fabric-corridor/runtime-config";

function isMobileRequest(userAgent: string, mobileHint: string | null) {
  if (mobileHint === "?1" || mobileHint === "1") {
    return true;
  }

  return /Android|iPhone|iPad|iPod|Mobile|Opera Mini|IEMobile/i.test(userAgent);
}

export default async function Categories({
  searchParams,
}: {
  searchParams?: CorridorSearchParams;
}) {
  const headerStore = await headers();
  const runtimeConfig = resolveCorridorRuntimeConfig(await searchParams, {
    isMobileRequest: isMobileRequest(
      headerStore.get("user-agent") ?? "",
      headerStore.get("sec-ch-ua-mobile"),
    ),
  });

  return <FabricVariantCorridor runtimeConfig={runtimeConfig} />;
}
