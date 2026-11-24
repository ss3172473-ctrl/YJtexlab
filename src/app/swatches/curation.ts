import type { Pattern, Variant, VisualKind } from "./catalog";
import { chip } from "./swatch-color";

type Lab = readonly [number, number, number];
type Candidate = { variant: Variant; lab: Lab; kind: VisualKind; family: string };
type Group = { group: Pattern; candidates: Candidate[] };

export type CuratedSpecimen = {
  group: Pattern;
  representative: Variant;
};

function colorFamily(color: string) {
  const name = color.trim().toLowerCase();
  if (/emerald|mint|green|khaki|jade/.test(name)) return "green";
  if (/blue|navy|indigo/.test(name)) return "blue";
  return name
    .replace(/^(?:dark|deep|light) /, "")
    .replace(/^optical white$/, "white");
}

function rgbToLab(hex: string): Lab {
  if (hex.length === 3) hex = Array.from(hex, (digit) => digit + digit).join("");
  const [r, g, b] = [0, 2, 4].map((offset) => {
    const value = Number.parseInt(hex.slice(offset, offset + 2), 16) / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [
    0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s,
  ];
}

function namedKind(name: string): VisualKind | undefined {
  if (/무지|plain|solid|無地|无地|素色/i.test(name)) return "plain";
  if (/체크|격자|check|plaid|gingham|格纹|格紋/i.test(name)) return "check";
  if (/스트라이프|줄무늬|stripe|\bST\b|條紋|条纹/i.test(name)) return "stripe";
}

function makeCandidate(group: Pattern, variant: Variant): Candidate {
  const type = group.patternType ?? "";
  const visual = variant.visual;
  const filterColor = chip(variant.color);
  const lab = visual?.lab?.length === 3 && visual.lab.every(Number.isFinite)
    ? visual.lab
    : rgbToLab(filterColor.startsWith("#") ? filterColor.slice(1) : "aaaab0");
  return {
    variant,
    lab,
    family: colorFamily(variant.color),
    kind: namedKind(type) ?? namedKind(variant.productName) ?? visual?.kind ?? "other",
  };
}

function distance(a: Lab, b: Lab) {
  return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
}

function readiness(candidate: Candidate) {
  return (candidate.variant.image ? 0.025 : 0)
    + (candidate.variant.rolls.length ? 0.018 : 0);
}

function displayScore(candidate: Candidate, recent: Candidate[]) {
  const contrast = recent.length
    ? Math.min(...recent.map(({ lab }) => Math.min(0.31, distance(candidate.lab, lab))))
    : Math.min(0.17, Math.hypot(candidate.lab[1], candidate.lab[2])) * 0.8;
  const last = recent[recent.length - 1];
  const sameKindCount = recent.filter(({ kind }) => kind === candidate.kind).length;
  const sameFamilyCount = recent.filter(({ family }) => family === candidate.family).length;

  const consecutiveKind = candidate.kind !== "other" && last?.kind === candidate.kind ? 0.13 : 0;
  const repeatedKind = candidate.kind === "plain" ? 0.052 : candidate.kind === "other" ? 0.01 : 0.024;
  const crowdedPlains = candidate.kind === "plain" && sameKindCount >= 2 ? 0.1 : 0;
  return contrast + readiness(candidate)
    - consecutiveKind - sameKindCount * repeatedKind - crowdedPlains - sameFamilyCount * 0.34;
}

export function curateSpecimens(patterns: Pattern[]): CuratedSpecimen[] {
  const pending: Group[] = patterns
    .filter(({ variants }) => variants.length > 0)
    .map((group) => ({
      group,
      candidates: group.variants.map((variant) => makeCandidate(group, variant)),
    }));
  const result: CuratedSpecimen[] = [];
  const recent: Candidate[] = [];

  // A four-card window limits repetitions on both desktop and two-column mobile layouts.
  while (pending.length > 0) {
    let best: { index: number; candidate: Candidate; score: number } | undefined;
    for (let index = 0; index < pending.length; index++) {
      const { candidates } = pending[index];
      const photographed = candidates.filter(({ variant }) => Boolean(variant.image));
      const source = photographed.length > 0 ? photographed : candidates;
      for (const candidate of source) {
        const score = displayScore(candidate, recent);
        if (!best || score > best.score) best = { index, candidate, score };
      }
    }

    if (!best) break;
    const [{ group }] = pending.splice(best.index, 1);
    const representative = best.candidate;
    result.push({
      group,
      representative: representative.variant,
    });
    recent.push(representative);
    if (recent.length > 4) recent.shift();
  }
  return result;
}

export function arrangeSpecimens(curated: CuratedSpecimen[], order?: string[], covers?: Record<string, string>) {
  const rank = new Map((order ?? []).map((name, index) => [name, index]));
  const specimens = rank.size
    ? [...curated].sort((a, b) => (rank.get(a.group.name) ?? Number.MAX_SAFE_INTEGER) - (rank.get(b.group.name) ?? Number.MAX_SAFE_INTEGER))
    : curated;
  return specimens.map((item) => {
    const cover = item.group.variants.find((variant) => variant.sku === covers?.[item.group.name]);
    return cover ? { ...item, representative: cover } : item;
  });
}
