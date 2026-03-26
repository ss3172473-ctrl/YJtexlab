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

function familyKey(name: string) {
  const match = name.match(/^([A-Z]+)_([A-Z]+)\d+$/);
  return match ? `${match[1]}_${match[2]}` : name;
}

const excludedExact = new Set(["ETC_A01", "ST_M02", "ETC_C01"]);
const excludedFamilies = new Set(["ETC_C", "ST_M"]);

const homeFirstFrameAssets = uniqueAssets([
  "/homepage-fabrics/slow-field-first-frame/desktop/ck_d-ck_d03.webp",
  "/homepage-fabrics/slow-field-first-frame/mobile/ck_d-ck_d03.webp",
  "/homepage-fabrics/slow-field-first-frame/desktop/ck_o-ck_o03.webp",
  "/homepage-fabrics/slow-field-first-frame/mobile/ck_o-ck_o03.webp",
  "/homepage-fabrics/slow-field-first-frame/desktop/st_n-st_n06.webp",
  "/homepage-fabrics/slow-field-first-frame/mobile/st_n-st_n06.webp",
  "/homepage-fabrics/slow-field-first-frame/desktop/ck_af-ck_af03.webp",
  "/homepage-fabrics/slow-field-first-frame/mobile/ck_af-ck_af03.webp",
  "/homepage-fabrics/slow-field-first-frame/desktop/st_g-st_g05.webp",
  "/homepage-fabrics/slow-field-first-frame/mobile/st_g-st_g05.webp",
  "/homepage-fabrics/slow-field-first-frame/desktop/ck_ac-ck_ac03.webp",
  "/homepage-fabrics/slow-field-first-frame/mobile/ck_ac-ck_ac03.webp",
  "/homepage-fabrics/slow-field-first-frame/desktop/st_b-st_b04.webp",
  "/homepage-fabrics/slow-field-first-frame/mobile/st_b-st_b04.webp",
  "/homepage-fabrics/slow-field-first-frame/desktop/ck_t-ck_t05.webp",
  "/homepage-fabrics/slow-field-first-frame/mobile/ck_t-ck_t05.webp",
  "/homepage-fabrics/slow-field-first-frame/desktop/ck_ai-ck_ai02.webp",
  "/homepage-fabrics/slow-field-first-frame/mobile/ck_ai-ck_ai02.webp",
  "/homepage-fabrics/slow-field-first-frame/desktop/ck_s-ck_s03.webp",
  "/homepage-fabrics/slow-field-first-frame/mobile/ck_s-ck_s03.webp",
  "/homepage-fabrics/slow-field-first-frame/desktop/st_a-st_a04.webp",
  "/homepage-fabrics/slow-field-first-frame/mobile/st_a-st_a04.webp",
  "/homepage-fabrics/slow-field-first-frame/desktop/etc_b-etc_b02.webp",
  "/homepage-fabrics/slow-field-first-frame/mobile/etc_b-etc_b02.webp",
  "/homepage-fabrics/slow-field-first-frame/desktop/ck_am-ck_am01.webp",
  "/homepage-fabrics/slow-field-first-frame/mobile/ck_am-ck_am01.webp",
]);

const productManifestAssets = uniqueAssets(
  [typedManifest.checks, typedManifest.stripes, typedManifest.others]
    .flat()
    .map((entry) => entry?.src),
);

export const productsPreloadAssets = productManifestAssets;

export const homeCategoriesPreloadAssets = uniqueAssets([
  ...[typedManifest.checks, typedManifest.stripes, typedManifest.others]
    .flat()
    .filter((entry): entry is ManifestEntry => Boolean(entry?.src && entry?.name))
    .filter((entry) => !excludedExact.has(entry.name!))
    .filter((entry) => !excludedFamilies.has(familyKey(entry.name!)))
    .map((entry) => entry.src),
  ...homeFirstFrameAssets,
]);
