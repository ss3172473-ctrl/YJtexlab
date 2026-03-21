import { VARIANT_IDS, type VariantId } from "./contract";

export type CorridorMode = "production" | "review";

export type CorridorRuntimeConfig = {
  mode: CorridorMode;
  promotedVariant: VariantId;
  reviewVariant?: VariantId;
  showReviewTools: boolean;
  reviewLayout: "compare" | "single";
};

export type CorridorSearchParams =
  | Record<string, string | string[] | undefined>
  | URLSearchParams
  | undefined;

export type CorridorRuntimeContext = {
  isMobileRequest?: boolean;
};

const TRUE_VALUES = new Set(["1", "true", "yes", "on"]);
const FALSE_VALUES = new Set(["0", "false", "no", "off"]);
const REVIEW_ENABLED =
  process.env.NODE_ENV !== "production" ||
  process.env.ENABLE_CORRIDOR_REVIEW === "true";

function toSingleValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function fromParams(
  searchParams: Record<string, string | string[] | undefined> | URLSearchParams,
  key: string,
) {
  return searchParams instanceof URLSearchParams
    ? searchParams.get(key) ?? undefined
    : toSingleValue(searchParams[key]);
}

function parseVariantId(value: string | undefined, fallback: VariantId): VariantId {
  if (!value) {
    return fallback;
  }

  const normalized = value.toUpperCase();

  return VARIANT_IDS.includes(normalized as VariantId)
    ? (normalized as VariantId)
    : fallback;
}

function parseMode(value: string | undefined): CorridorMode {
  return value?.toLowerCase() === "review" ? "review" : "production";
}

function parseBoolean(value: string | undefined, fallback = false) {
  if (value == null) {
    return fallback;
  }

  const normalized = value.toLowerCase();

  if (TRUE_VALUES.has(normalized)) {
    return true;
  }

  if (FALSE_VALUES.has(normalized)) {
    return false;
  }

  return fallback;
}

export function resolveCorridorRuntimeConfig(
  searchParams: CorridorSearchParams,
  context: CorridorRuntimeContext = {},
): CorridorRuntimeConfig {
  const modeValue =
    searchParams && typeof searchParams === "object"
      ? fromParams(searchParams, "corridor") ??
        fromParams(searchParams, "mode") ??
        fromParams(searchParams, "corridorMode")
      : undefined;
  const promotedValue =
    searchParams && typeof searchParams === "object"
      ? fromParams(searchParams, "promotedVariant") ??
        fromParams(searchParams, "promoted") ??
        fromParams(searchParams, "variant")
      : undefined;
  const reviewValue =
    searchParams && typeof searchParams === "object"
      ? fromParams(searchParams, "reviewVariant") ??
        fromParams(searchParams, "review")
      : undefined;
  const showReviewToolsValue =
    searchParams && typeof searchParams === "object"
      ? fromParams(searchParams, "showReviewTools") ??
        fromParams(searchParams, "reviewTools")
      : undefined;
  const reviewLayoutValue =
    searchParams && typeof searchParams === "object"
      ? fromParams(searchParams, "reviewLayout") ??
        fromParams(searchParams, "layout")
      : undefined;

  const requestedMode = parseMode(modeValue);
  const promotedVariant = parseVariantId(promotedValue, "C");
  const reviewVariant = parseVariantId(reviewValue, promotedVariant);
  const mode: CorridorMode =
    REVIEW_ENABLED && requestedMode === "review" ? "review" : "production";
  const reviewLayout =
    mode === "review"
      ? reviewLayoutValue === "compare" || reviewLayoutValue === "desktop"
        ? "compare"
        : reviewLayoutValue === "single" || reviewLayoutValue === "mobile"
          ? "single"
          : context.isMobileRequest
            ? "single"
            : "compare"
      : "single";

  return {
    mode,
    promotedVariant,
    reviewVariant: mode === "review" ? reviewVariant : undefined,
    showReviewTools:
      mode === "review" && REVIEW_ENABLED
        ? parseBoolean(showReviewToolsValue, true)
        : false,
    reviewLayout,
  };
}
