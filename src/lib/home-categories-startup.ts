export type ResponsiveImageVariant = {
  src: string;
  width: number;
  height: number;
};

export type ResponsivePreloadAsset = {
  desktopSrc: string;
  mobileSrc: string;
  breakpointPx?: number;
};

export type ResponsiveImageAsset = {
  desktop: ResponsiveImageVariant;
  mobile: ResponsiveImageVariant;
  breakpointPx?: number;
  sizes: string;
};

export type HomeCategoriesStartupFrameEntry = {
  zoneKey: string;
  itemName: string;
  source: string;
  responsive: ResponsiveImageAsset;
  loading: "eager" | "lazy";
  fetchPriority: "high" | "auto";
};

export const HOME_CATEGORIES_STARTUP_PROGRESS = 0.08;
export const HOME_CATEGORIES_STARTUP_BREAKPOINT_PX = 720;
export const HOME_CATEGORIES_STARTUP_SIZES =
  "(max-width: 720px) 118px, (max-width: 1200px) 148px, 198px";

function createResponsiveAsset(
  desktopSrc: string,
  mobileSrc: string,
): ResponsiveImageAsset {
  return {
    desktop: { src: desktopSrc, width: 400, height: 533 },
    mobile: { src: mobileSrc, width: 256, height: 341 },
    breakpointPx: HOME_CATEGORIES_STARTUP_BREAKPOINT_PX,
    sizes: HOME_CATEGORIES_STARTUP_SIZES,
  };
}

export const homeCategoriesStartupFrameEntries = [
  {
    zoneKey: "CK_D",
    itemName: "CK_D05",
    source: "/new-stage-fabrics/checks/27-ck_d05.webp",
    responsive: createResponsiveAsset(
      "/homepage-fabrics/startup-frame/desktop/ck_d-ck_d05.webp",
      "/homepage-fabrics/startup-frame/mobile/ck_d-ck_d05.webp",
    ),
    loading: "eager",
    fetchPriority: "high",
  },
  {
    zoneKey: "CK_O",
    itemName: "CK_O05",
    source: "/new-stage-fabrics/checks/38-ck_o05.webp",
    responsive: createResponsiveAsset(
      "/homepage-fabrics/startup-frame/desktop/ck_o-ck_o05.webp",
      "/homepage-fabrics/startup-frame/mobile/ck_o-ck_o05.webp",
    ),
    loading: "eager",
    fetchPriority: "high",
  },
  {
    zoneKey: "ST_N",
    itemName: "ST_N09",
    source: "/new-stage-fabrics/stripes/29-st_n09.webp",
    responsive: createResponsiveAsset(
      "/homepage-fabrics/startup-frame/desktop/st_n-st_n09.webp",
      "/homepage-fabrics/startup-frame/mobile/st_n-st_n09.webp",
    ),
    loading: "eager",
    fetchPriority: "auto",
  },
  {
    zoneKey: "CK_AF",
    itemName: "CK_AF04",
    source: "/new-stage-fabrics/checks/12-ck_af04.webp",
    responsive: createResponsiveAsset(
      "/homepage-fabrics/startup-frame/desktop/ck_af-ck_af04.webp",
      "/homepage-fabrics/startup-frame/mobile/ck_af-ck_af04.webp",
    ),
    loading: "eager",
    fetchPriority: "auto",
  },
  {
    zoneKey: "ST_G",
    itemName: "ST_G01",
    source: "/new-stage-fabrics/stripes/12-st_g01.webp",
    responsive: createResponsiveAsset(
      "/homepage-fabrics/startup-frame/desktop/st_g-st_g01.webp",
      "/homepage-fabrics/startup-frame/mobile/st_g-st_g01.webp",
    ),
    loading: "lazy",
    fetchPriority: "auto",
  },
  {
    zoneKey: "CK_AC",
    itemName: "CK_AC04",
    source: "/new-stage-fabrics/checks/07-ck_ac04.webp",
    responsive: createResponsiveAsset(
      "/homepage-fabrics/startup-frame/desktop/ck_ac-ck_ac04.webp",
      "/homepage-fabrics/startup-frame/mobile/ck_ac-ck_ac04.webp",
    ),
    loading: "lazy",
    fetchPriority: "auto",
  },
  {
    zoneKey: "ST_B",
    itemName: "ST_B05",
    source: "/new-stage-fabrics/stripes/09-st_b05.webp",
    responsive: createResponsiveAsset(
      "/homepage-fabrics/startup-frame/desktop/st_b-st_b05.webp",
      "/homepage-fabrics/startup-frame/mobile/st_b-st_b05.webp",
    ),
    loading: "lazy",
    fetchPriority: "auto",
  },
  {
    zoneKey: "CK_T",
    itemName: "CK_T01",
    source: "/new-stage-fabrics/checks/45-ck_t01.webp",
    responsive: createResponsiveAsset(
      "/homepage-fabrics/startup-frame/desktop/ck_t-ck_t01.webp",
      "/homepage-fabrics/startup-frame/mobile/ck_t-ck_t01.webp",
    ),
    loading: "lazy",
    fetchPriority: "auto",
  },
  {
    zoneKey: "CK_AI",
    itemName: "CK_AI03",
    source: "/new-stage-fabrics/checks/16-ck_ai03.webp",
    responsive: createResponsiveAsset(
      "/homepage-fabrics/startup-frame/desktop/ck_ai-ck_ai03.webp",
      "/homepage-fabrics/startup-frame/mobile/ck_ai-ck_ai03.webp",
    ),
    loading: "lazy",
    fetchPriority: "auto",
  },
  {
    zoneKey: "CK_S",
    itemName: "CK_S04",
    source: "/new-stage-fabrics/checks/44-ck_s04.webp",
    responsive: createResponsiveAsset(
      "/homepage-fabrics/startup-frame/desktop/ck_s-ck_s04.webp",
      "/homepage-fabrics/startup-frame/mobile/ck_s-ck_s04.webp",
    ),
    loading: "lazy",
    fetchPriority: "auto",
  },
  {
    zoneKey: "ST_A",
    itemName: "ST_A01",
    source: "/new-stage-fabrics/stripes/01-st_a01.webp",
    responsive: createResponsiveAsset(
      "/homepage-fabrics/startup-frame/desktop/st_a-st_a01.webp",
      "/homepage-fabrics/startup-frame/mobile/st_a-st_a01.webp",
    ),
    loading: "lazy",
    fetchPriority: "auto",
  },
  {
    zoneKey: "ETC_B",
    itemName: "ETC_B03",
    source: "/new-stage-fabrics/others/03-etc_b03.webp",
    responsive: createResponsiveAsset(
      "/homepage-fabrics/startup-frame/desktop/etc_b-etc_b03.webp",
      "/homepage-fabrics/startup-frame/mobile/etc_b-etc_b03.webp",
    ),
    loading: "lazy",
    fetchPriority: "auto",
  },
  {
    zoneKey: "CK_AM",
    itemName: "CK_AM01",
    source: "/new-stage-fabrics/checks/18-ck_am01.webp",
    responsive: createResponsiveAsset(
      "/homepage-fabrics/startup-frame/desktop/ck_am-ck_am01.webp",
      "/homepage-fabrics/startup-frame/mobile/ck_am-ck_am01.webp",
    ),
    loading: "lazy",
    fetchPriority: "auto",
  },
] as const satisfies readonly HomeCategoriesStartupFrameEntry[];

export const homeCategoriesStartupFrameEntriesByZoneKey = new Map<string, HomeCategoriesStartupFrameEntry>(
  homeCategoriesStartupFrameEntries.map((entry) => [entry.zoneKey, entry]),
);

export const homeCategoriesStartupZoneKeys = homeCategoriesStartupFrameEntries.map(
  (entry) => entry.zoneKey,
);

export function buildResponsiveSrcSet(asset: ResponsiveImageAsset) {
  return `${asset.mobile.src} ${asset.mobile.width}w, ${asset.desktop.src} ${asset.desktop.width}w`;
}

export function toResponsivePreloadAsset(
  asset: ResponsiveImageAsset,
): ResponsivePreloadAsset {
  return {
    desktopSrc: asset.desktop.src,
    mobileSrc: asset.mobile.src,
    breakpointPx: asset.breakpointPx ?? HOME_CATEGORIES_STARTUP_BREAKPOINT_PX,
  };
}
