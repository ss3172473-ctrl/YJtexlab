const ORIGINAL_PREFIX = "/new-stage-fabrics/";
const OPTIMIZED_PREFIX = "/new-stage-fabrics-optimized/";

export type FabricImageVariantSet = {
  mobileSrc: string;
  desktopSrc: string;
};

function replaceExtension(pathname: string, suffix: string) {
  return pathname.replace(/\.webp$/i, `${suffix}.webp`);
}

export function getFabricImageVariantSet(src: string): FabricImageVariantSet {
  if (!src.startsWith(ORIGINAL_PREFIX)) {
    return {
      mobileSrc: src,
      desktopSrc: src,
    };
  }

  const optimizedBase = src.replace(ORIGINAL_PREFIX, OPTIMIZED_PREFIX);

  return {
    mobileSrc: replaceExtension(optimizedBase, "-mobile"),
    desktopSrc: replaceExtension(optimizedBase, "-desktop"),
  };
}

export function getFabricDesktopPreloadSrc(src: string) {
  return getFabricImageVariantSet(src).desktopSrc;
}
