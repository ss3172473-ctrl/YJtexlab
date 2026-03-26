import manifest from "../../public/new-stage-fabrics/manifest.json";

type ManifestEntry = {
  src?: string;
  name?: string;
};

type FabricManifestLike = {
  checks?: ManifestEntry[];
  stripes?: ManifestEntry[];
  others?: ManifestEntry[];
};

const typedManifest = manifest as FabricManifestLike;

function uniqueAssets(entries: Array<string | null | undefined>) {
  return Array.from(
    new Set(entries.filter((entry): entry is string => typeof entry === "string" && entry.length > 0)),
  );
}

const productManifestAssets = uniqueAssets(
  [typedManifest.checks, typedManifest.stripes, typedManifest.others]
    .flat()
    .map((entry) => entry?.src),
);

export const productsPreloadAssets = productManifestAssets;
