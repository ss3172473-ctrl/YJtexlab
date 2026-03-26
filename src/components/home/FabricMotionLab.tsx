"use client";

import Link from "next/link";
import { type CSSProperties, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import manifest from "../../../public/new-stage-fabrics/manifest.json";
import styles from "./FabricMotionLab.module.css";

gsap.registerPlugin(ScrollTrigger);

type FabricCategory = "checks" | "stripes" | "others";
type ZoneMotion =
  | "split-h"
  | "split-v"
  | "drift"
  | "rail-left"
  | "rail-right"
  | "band"
  | "shutter"
  | "pulse";

type FabricFrame = {
  src: string;
  name: string;
  category: FabricCategory;
};

type FirstFrameAsset = {
  src: string;
  width: number;
  height: number;
  bytes: number;
};

type FirstFrameEntry = {
  zoneKey: string;
  itemName: string;
  source: string;
  desktop: FirstFrameAsset;
  mobile: FirstFrameAsset;
};

type ZoneDefinition = {
  key: string;
  x: number;
  y: number;
  motion: ZoneMotion;
  focusStart: number;
  focusEnd: number;
  cadence: number;
  drift: number;
  depth: number;
  direction: -1 | 1;
};

type LayoutDefinition = {
  key: string;
  x: number;
  y: number;
  widthRem: number;
  band: 0 | 1 | 2 | 3;
  reverse?: boolean;
};

type VariantConfig = {
  slug: string;
  layouts: LayoutDefinition[];
  trackVh: number;
  chapterVh: number;
  chapterShift: number;
  chapterWidthPx: number;
  chapterInsetRem: number;
  loopCycles: number;
  transitionGain: number;
  primarySpeed: number;
  primaryBandLag: number;
  primaryBoost: number;
  primaryDrift: number;
  primaryLiftStart: number;
  primaryLiftEnd: number;
  echoStart: number;
  echoEnd: number;
  echoSpeed: number;
  echoBias: number;
  echoDrift: number;
  echoLiftStart: number;
  echoLiftEnd: number;
  exitStart: number;
  spacingScale: number;
  waveFrequency: number;
  pulseAmplitude: number;
};

type TileState = {
  item: FabricFrame;
  visible: boolean;
  clipTop: number;
  clipRight: number;
  clipBottom: number;
  clipLeft: number;
  xShift: number;
  yShift: number;
  scale: number;
  alpha: number;
  blur: number;
  saturation: number;
};

type ResistancePreset = {
  intro: number;
  middle: number;
  outro: number;
};

const firstFrameEntries: Record<string, FirstFrameEntry> = {
  CK_D: {
    zoneKey: "CK_D",
    itemName: "CK_D03",
    source: "/new-stage-fabrics/checks/25-ck_d03.webp",
    desktop: { src: "/homepage-fabrics/slow-field-first-frame/desktop/ck_d-ck_d03.webp", width: 400, height: 533, bytes: 92052 },
    mobile: { src: "/homepage-fabrics/slow-field-first-frame/mobile/ck_d-ck_d03.webp", width: 256, height: 341, bytes: 29368 },
  },
  CK_O: {
    zoneKey: "CK_O",
    itemName: "CK_O03",
    source: "/new-stage-fabrics/checks/36-ck_o03.webp",
    desktop: { src: "/homepage-fabrics/slow-field-first-frame/desktop/ck_o-ck_o03.webp", width: 400, height: 533, bytes: 78098 },
    mobile: { src: "/homepage-fabrics/slow-field-first-frame/mobile/ck_o-ck_o03.webp", width: 256, height: 341, bytes: 17772 },
  },
  ST_N: {
    zoneKey: "ST_N",
    itemName: "ST_N06",
    source: "/new-stage-fabrics/stripes/26-st_n06.webp",
    desktop: { src: "/homepage-fabrics/slow-field-first-frame/desktop/st_n-st_n06.webp", width: 400, height: 533, bytes: 100136 },
    mobile: { src: "/homepage-fabrics/slow-field-first-frame/mobile/st_n-st_n06.webp", width: 256, height: 341, bytes: 29774 },
  },
  CK_AF: {
    zoneKey: "CK_AF",
    itemName: "CK_AF03",
    source: "/new-stage-fabrics/checks/11-ck_af03.webp",
    desktop: { src: "/homepage-fabrics/slow-field-first-frame/desktop/ck_af-ck_af03.webp", width: 400, height: 533, bytes: 95366 },
    mobile: { src: "/homepage-fabrics/slow-field-first-frame/mobile/ck_af-ck_af03.webp", width: 256, height: 341, bytes: 21154 },
  },
  ST_G: {
    zoneKey: "ST_G",
    itemName: "ST_G05",
    source: "/new-stage-fabrics/stripes/16-st_g05.webp",
    desktop: { src: "/homepage-fabrics/slow-field-first-frame/desktop/st_g-st_g05.webp", width: 400, height: 533, bytes: 89912 },
    mobile: { src: "/homepage-fabrics/slow-field-first-frame/mobile/st_g-st_g05.webp", width: 256, height: 341, bytes: 27834 },
  },
  CK_AC: {
    zoneKey: "CK_AC",
    itemName: "CK_AC03",
    source: "/new-stage-fabrics/checks/06-ck_ac03.webp",
    desktop: { src: "/homepage-fabrics/slow-field-first-frame/desktop/ck_ac-ck_ac03.webp", width: 400, height: 533, bytes: 110568 },
    mobile: { src: "/homepage-fabrics/slow-field-first-frame/mobile/ck_ac-ck_ac03.webp", width: 256, height: 341, bytes: 32204 },
  },
  ST_B: {
    zoneKey: "ST_B",
    itemName: "ST_B04",
    source: "/new-stage-fabrics/stripes/08-st_b04.webp",
    desktop: { src: "/homepage-fabrics/slow-field-first-frame/desktop/st_b-st_b04.webp", width: 400, height: 533, bytes: 71874 },
    mobile: { src: "/homepage-fabrics/slow-field-first-frame/mobile/st_b-st_b04.webp", width: 256, height: 341, bytes: 13012 },
  },
  CK_T: {
    zoneKey: "CK_T",
    itemName: "CK_T05",
    source: "/new-stage-fabrics/checks/49-ck_t05.webp",
    desktop: { src: "/homepage-fabrics/slow-field-first-frame/desktop/ck_t-ck_t05.webp", width: 400, height: 533, bytes: 84792 },
    mobile: { src: "/homepage-fabrics/slow-field-first-frame/mobile/ck_t-ck_t05.webp", width: 256, height: 341, bytes: 20392 },
  },
  CK_AI: {
    zoneKey: "CK_AI",
    itemName: "CK_AI02",
    source: "/new-stage-fabrics/checks/15-ck_ai02.webp",
    desktop: { src: "/homepage-fabrics/slow-field-first-frame/desktop/ck_ai-ck_ai02.webp", width: 400, height: 533, bytes: 110754 },
    mobile: { src: "/homepage-fabrics/slow-field-first-frame/mobile/ck_ai-ck_ai02.webp", width: 256, height: 341, bytes: 33284 },
  },
  CK_S: {
    zoneKey: "CK_S",
    itemName: "CK_S03",
    source: "/new-stage-fabrics/checks/43-ck_s03.webp",
    desktop: { src: "/homepage-fabrics/slow-field-first-frame/desktop/ck_s-ck_s03.webp", width: 400, height: 533, bytes: 51530 },
    mobile: { src: "/homepage-fabrics/slow-field-first-frame/mobile/ck_s-ck_s03.webp", width: 256, height: 341, bytes: 15638 },
  },
  ST_A: {
    zoneKey: "ST_A",
    itemName: "ST_A04",
    source: "/new-stage-fabrics/stripes/04-st_a04.webp",
    desktop: { src: "/homepage-fabrics/slow-field-first-frame/desktop/st_a-st_a04.webp", width: 400, height: 533, bytes: 70558 },
    mobile: { src: "/homepage-fabrics/slow-field-first-frame/mobile/st_a-st_a04.webp", width: 256, height: 341, bytes: 12350 },
  },
  ETC_B: {
    zoneKey: "ETC_B",
    itemName: "ETC_B02",
    source: "/new-stage-fabrics/others/02-etc_b02.webp",
    desktop: { src: "/homepage-fabrics/slow-field-first-frame/desktop/etc_b-etc_b02.webp", width: 400, height: 533, bytes: 60914 },
    mobile: { src: "/homepage-fabrics/slow-field-first-frame/mobile/etc_b-etc_b02.webp", width: 256, height: 341, bytes: 16044 },
  },
  CK_AM: {
    zoneKey: "CK_AM",
    itemName: "CK_AM01",
    source: "/new-stage-fabrics/checks/18-ck_am01.webp",
    desktop: { src: "/homepage-fabrics/slow-field-first-frame/desktop/ck_am-ck_am01.webp", width: 400, height: 533, bytes: 113374 },
    mobile: { src: "/homepage-fabrics/slow-field-first-frame/mobile/ck_am-ck_am01.webp", width: 256, height: 341, bytes: 34962 },
  },
};

const zones: ZoneDefinition[] = [
  { key: "CK_D", x: 6, y: 8, motion: "split-v", focusStart: 0.02, focusEnd: 0.28, cadence: 4.6, drift: 1.2, depth: 1.1, direction: -1 },
  { key: "CK_O", x: 23, y: 10, motion: "drift", focusStart: 0.08, focusEnd: 0.34, cadence: 4.2, drift: 1.4, depth: 0.9, direction: 1 },
  { key: "ST_N", x: 74, y: 7, motion: "rail-right", focusStart: 0.42, focusEnd: 0.78, cadence: 5.8, drift: 1.8, depth: 1.4, direction: 1 },
  { key: "CK_AF", x: 12, y: 28, motion: "split-h", focusStart: 0.1, focusEnd: 0.4, cadence: 4.3, drift: 1.1, depth: 0.8, direction: 1 },
  { key: "ST_G", x: 65, y: 25, motion: "band", focusStart: 0.48, focusEnd: 0.82, cadence: 5.4, drift: 1.6, depth: 1.2, direction: -1 },
  { key: "CK_AC", x: 36, y: 31, motion: "split-v", focusStart: 0.16, focusEnd: 0.46, cadence: 4, drift: 1.1, depth: 1, direction: -1 },
  { key: "ST_B", x: 52, y: 40, motion: "rail-left", focusStart: 0.44, focusEnd: 0.74, cadence: 5.2, drift: 1.5, depth: 1.3, direction: -1 },
  { key: "CK_T", x: 82, y: 41, motion: "drift", focusStart: 0.18, focusEnd: 0.52, cadence: 4.5, drift: 1.2, depth: 1, direction: 1 },
  { key: "CK_AI", x: 8, y: 58, motion: "split-h", focusStart: 0.22, focusEnd: 0.58, cadence: 4.1, drift: 1, depth: 0.9, direction: -1 },
  { key: "CK_S", x: 28, y: 64, motion: "pulse", focusStart: 0.26, focusEnd: 0.62, cadence: 4, drift: 0.9, depth: 0.8, direction: 1 },
  { key: "ST_A", x: 69, y: 62, motion: "rail-right", focusStart: 0.5, focusEnd: 0.84, cadence: 5, drift: 1.7, depth: 1.1, direction: 1 },
  { key: "ETC_B", x: 3, y: 88, motion: "shutter", focusStart: 0.68, focusEnd: 0.96, cadence: 3.2, drift: 0.8, depth: 0.7, direction: -1 },
  { key: "CK_AM", x: 79, y: 90, motion: "pulse", focusStart: 0.3, focusEnd: 0.68, cadence: 3.8, drift: 1, depth: 0.9, direction: 1 },
];

const layouts: LayoutDefinition[] = [
  { key: "CK_D", x: 7, y: 8, widthRem: 10.8, band: 0 },
  { key: "CK_O", x: 19, y: 12, widthRem: 10.6, band: 0 },
  { key: "ST_N", x: 66, y: 9, widthRem: 12.2, band: 0 },
  { key: "CK_AF", x: 18, y: 31, widthRem: 10.4, band: 0 },
  { key: "ST_G", x: 56, y: 30, widthRem: 10.8, band: 0 },
  { key: "CK_AC", x: 38, y: 43, widthRem: 10.3, band: 1 },
  { key: "ST_B", x: 71, y: 49, widthRem: 10.5, band: 1 },
  { key: "CK_T", x: 10, y: 56, widthRem: 10.9, band: 1 },
  { key: "CK_AI", x: 28, y: 66, widthRem: 10.1, band: 1 },
  { key: "CK_S", x: 48, y: 63, widthRem: 9.9, band: 1 },
  { key: "ST_A", x: 74, y: 72, widthRem: 11.2, band: 2 },
  { key: "ETC_B", x: 23, y: 80, widthRem: 9.6, band: 2 },
  { key: "CK_AM", x: 69, y: 83, widthRem: 10.2, band: 2 },
];

const connectedSalonConfig: VariantConfig = {
  slug: "connected-salon",
  layouts,
  trackVh: 334,
  chapterVh: 220,
  chapterShift: -8.6,
  chapterWidthPx: 1840,
  chapterInsetRem: 1,
  loopCycles: 1,
  transitionGain: 0.92,
  primarySpeed: 0.72,
  primaryBandLag: 0.018,
  primaryBoost: 0.045,
  primaryDrift: 0.88,
  primaryLiftStart: 5.2,
  primaryLiftEnd: 0.62,
  echoStart: 0.56,
  echoEnd: 0.9,
  echoSpeed: 0.36,
  echoBias: 0.04,
  echoDrift: 1.24,
  echoLiftStart: 10.5,
  echoLiftEnd: 0.92,
  exitStart: 0.94,
  spacingScale: 0.98,
  waveFrequency: 1.52,
  pulseAmplitude: 0.0015,
};

const RESISTANCE_STORAGE_KEY = "yjtexlab.fabricMotionLab.resistancePreset.v2";
const DEFAULT_RESISTANCE_PRESET: ResistancePreset = {
  intro: 1.1,
  middle: 2.2,
  outro: 3,
};

const excludedExact = new Set(["ST_M02", "ETC_C01"]);
const excludedFamilies = new Set(["ETC_C", "ST_M"]);

function clamp(value: number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

function clampResistance(value: number) {
  return clamp(value, 0.35, 3);
}

function formatResistancePreset(preset: ResistancePreset) {
  return `intro=${preset.intro.toFixed(2)}, middle=${preset.middle.toFixed(2)}, outro=${preset.outro.toFixed(2)}`;
}

function parseResistancePreset(raw: string | null): ResistancePreset | null {
  if (!raw) {
    return null;
  }

  const values = Object.fromEntries(
    raw
      .split(",")
      .map((entry) => entry.trim())
      .map((entry) => {
        const [key, value] = entry.split("=");
        return [key, Number(value)];
      }),
  ) as Partial<Record<keyof ResistancePreset, number>>;

  const intro = values.intro;
  const middle = values.middle;
  const outro = values.outro;

  if (
    typeof intro !== "number" ||
    typeof middle !== "number" ||
    typeof outro !== "number" ||
    !Number.isFinite(intro) ||
    !Number.isFinite(middle) ||
    !Number.isFinite(outro)
  ) {
    return null;
  }

  return {
    intro: clampResistance(intro),
    middle: clampResistance(middle),
    outro: clampResistance(outro),
  };
}

function getResistanceScale(preset: ResistancePreset) {
  return (preset.intro + preset.middle + preset.outro) / 3;
}

function mapTrackProgressByResistance(rawProgress: number, preset: ResistancePreset) {
  const segmentSpan = 1 / 3;
  const introWeighted = segmentSpan * preset.intro;
  const middleWeighted = segmentSpan * preset.middle;
  const outroWeighted = segmentSpan * preset.outro;
  const totalWeighted = introWeighted + middleWeighted + outroWeighted;
  const weightedProgress = clamp(rawProgress) * totalWeighted;

  if (weightedProgress <= introWeighted) {
    return clamp(weightedProgress / preset.intro);
  }

  if (weightedProgress <= introWeighted + middleWeighted) {
    return clamp(segmentSpan + (weightedProgress - introWeighted) / preset.middle);
  }

  return clamp(segmentSpan * 2 + (weightedProgress - introWeighted - middleWeighted) / preset.outro);
}

function smoothstep(value: number, start: number, end: number) {
  if (end <= start) {
    return 0;
  }

  const normalized = clamp((value - start) / (end - start));
  return normalized * normalized * (3 - 2 * normalized);
}

function familyKey(name: string) {
  const match = name.match(/^([A-Z]+)_([A-Z]+)\d+$/);
  return match ? `${match[1]}_${match[2]}` : name;
}

function serialNumber(name: string) {
  const match = name.match(/(\d+)$/);
  return match ? Number(match[1]) : Number.MAX_SAFE_INTEGER;
}

function normalizeGroup(items: unknown, category: FabricCategory): FabricFrame[] {
  if (!Array.isArray(items)) {
    return [];
  }

  return items.filter((item): item is FabricFrame => {
    if (!item || typeof item !== "object") {
      return false;
    }

    const frame = item as Partial<FabricFrame>;
    return typeof frame.src === "string" && typeof frame.name === "string" && frame.category === category;
  });
}

const framesByCategory = {
  checks: normalizeGroup(manifest.checks, "checks"),
  stripes: normalizeGroup(manifest.stripes, "stripes"),
  others: normalizeGroup(manifest.others, "others"),
};

const allFrames = [...framesByCategory.checks, ...framesByCategory.stripes, ...framesByCategory.others]
  .filter((frame) => frame.name !== "ETC_A01")
  .filter((frame) => !excludedExact.has(frame.name))
  .filter((frame) => !excludedFamilies.has(familyKey(frame.name)));

const families = new Map<string, FabricFrame[]>();
for (const frame of allFrames) {
  const key = familyKey(frame.name);
  const existing = families.get(key);
  if (existing) {
    existing.push(frame);
  } else {
    families.set(key, [frame]);
  }
}

for (const familyFrames of Array.from(families.values())) {
  familyFrames.sort((left, right) => serialNumber(left.name) - serialNumber(right.name));
}

const zoneMap = new Map(zones.map((zone) => [zone.key, zone]));

function computeTileState(
  zone: ZoneDefinition,
  items: FabricFrame[],
  progress: number,
  reducedMotion: boolean,
  gain = 1,
  pulseAmplitude = 0.012,
  isEcho = false,
): TileState {
  const focusProgress = smoothstep(progress, zone.focusStart, zone.focusEnd);
  const waveProgress = Math.sin(progress * Math.PI);
  const emphasis = 0.28 + 0.72 * focusProgress;
  const visibilityDrive = clamp(Math.max(focusProgress, waveProgress));

  if (reducedMotion) {
    return {
      item: items[0],
      visible: true,
      clipTop: 0,
      clipRight: 0,
      clipBottom: 0,
      clipLeft: 0,
      xShift: 0,
      yShift: 0,
      scale: 1,
      alpha: 1,
      blur: 0,
      saturation: 1,
    };
  }

  const hiddenSlack = isEcho ? 0 : items.length > 5 ? 2 : 1;
  const modulo = items.length + hiddenSlack;
  const rawProgress = progress * modulo * zone.cadence * gain + 0.031 * zone.x + 0.013 * zone.y;
  const wrapped = rawProgress % modulo;
  const frameIndex = Math.floor(wrapped);
  const canShow = (isEcho || frameIndex < items.length) && visibilityDrive > 0.08;
  const visibleIndex = frameIndex % items.length;
  const fallbackIndex = ((canShow ? visibleIndex : Math.floor(rawProgress)) % items.length + items.length) % items.length;
  const item = items[fallbackIndex];
  const maskMultiplier = isEcho ? 0.16 : 1;

  let clipTop = 0;
  let clipRight = 0;
  let clipBottom = 0;
  let clipLeft = 0;

  if (zone.motion === "split-h") {
    const clip = (1 - visibilityDrive) * 44 * maskMultiplier;
    clipLeft = clip;
    clipRight = clip;
  } else if (zone.motion === "split-v" || zone.motion === "band") {
    const clip = (1 - visibilityDrive) * (zone.motion === "band" ? 36 : 42) * maskMultiplier;
    clipTop = clip;
    clipBottom = clip;
  } else if (zone.motion === "shutter") {
    const clip = (1 - visibilityDrive) * 22 * maskMultiplier;
    clipTop = clip;
    clipRight = clip;
    clipBottom = clip;
    clipLeft = clip;
  } else if (zone.motion === "rail-left") {
    clipRight = (1 - visibilityDrive) * 68 * maskMultiplier;
  } else if (zone.motion === "rail-right") {
    clipLeft = (1 - visibilityDrive) * 68 * maskMultiplier;
  }

  const lateralBase =
    zone.motion === "rail-left" || zone.motion === "rail-right"
      ? (1 - visibilityDrive) * zone.direction * 12
      : zone.direction * (1 - emphasis) * zone.drift * 2.6;

  const xShift = lateralBase + (progress - 0.5) * zone.depth * 2.8;
  const yShift = (1 - emphasis) * zone.depth * 3.6 - waveProgress * zone.depth * 1.4;
  const pulse = zone.motion === "pulse" ? Math.sin(progress * Math.PI * 10 + 0.04 * zone.x) * pulseAmplitude : 0;

  return {
    item,
    visible: canShow,
    clipTop,
    clipRight,
    clipBottom,
    clipLeft,
    xShift,
    yShift,
    scale: 0.88 + 0.17 * visibilityDrive + (zone.motion === "pulse" ? 0.03 * waveProgress : 0) + pulse,
    alpha: canShow ? clamp((isEcho ? 0.78 : 0.24) + visibilityDrive * (isEcho ? 0.18 : 0.82)) : 0,
    blur: canShow ? (1 - visibilityDrive) * 5 : 10,
    saturation: isEcho ? 0.94 + 0.08 * visibilityDrive : 0.84 + 0.34 * visibilityDrive,
  };
}

function Tile({
  layout,
  zone,
  progress,
  reducedMotion,
  index,
  config,
}: {
  layout: LayoutDefinition;
  zone: ZoneDefinition;
  progress: number;
  reducedMotion: boolean;
  index: number;
  config: VariantConfig;
}) {
  const items = families.get(zone.key) ?? [];
  if (items.length === 0) {
    return null;
  }

  const isEcho = layout.band === 3;
  const emphasisProgress = isEcho
    ? clamp(1 - (progress * config.echoSpeed - config.echoBias))
    : clamp(progress * config.primarySpeed - layout.band * config.primaryBandLag + config.primaryBoost);

  const emphasisIn = smoothstep(
    progress,
    isEcho ? config.echoStart : 0.16 * layout.band,
    isEcho ? config.echoEnd : 0.44 + 0.16 * layout.band,
  );
  const exitProgress = 1 - smoothstep(progress, isEcho ? config.exitStart + 0.01 : config.exitStart + 0.02 * layout.band, 1);

  const tile = computeTileState(zone, items, emphasisProgress, reducedMotion, config.transitionGain, config.pulseAmplitude, isEcho);
  const wave = Math.sin(progress * Math.PI * config.waveFrequency + 0.74 * index);
  const embeddedXDrift = 0.48 * Math.sin(progress * Math.PI * 1.02 + 0.05 * zone.x + 0.21 * index);
  const embeddedYDrift = 0.34 * Math.cos(progress * Math.PI * 0.82 + 0.03 * zone.y);
  const embeddedImageX = 0.22 * Math.sin(progress * Math.PI * 0.88 + 0.04 * zone.x);
  const embeddedImageY = 0.3 * Math.cos(progress * Math.PI * 0.72 + 0.03 * zone.y);
  const imageScale = 1.018 + 0.006 * Math.sin(progress * Math.PI * 0.54 + 0.17 * index + 0.01 * zone.y);
  const driftX =
    wave *
      (isEcho ? config.echoDrift : config.primaryDrift) *
      emphasisIn *
      Math.max(exitProgress, isEcho ? 0.36 : 0.5) *
      (layout.reverse ? -1 : 1) +
    embeddedXDrift;
  const liftRange = isEcho
    ? config.echoLiftStart + (config.echoLiftEnd - config.echoLiftStart) * clamp(emphasisIn)
    : config.primaryLiftStart + (config.primaryLiftEnd - config.primaryLiftStart) * clamp(emphasisIn);
  const driftY = liftRange * Math.max(exitProgress, isEcho ? 0.42 : 0.58) + (isEcho ? 0 : embeddedYDrift);

  const firstFrame = firstFrameEntries[zone.key];
  const useFirstFrame = firstFrame?.itemName === tile.item.name;
  const imageSrc = useFirstFrame ? firstFrame.desktop.src : tile.item.src;
  const imageSrcSet = useFirstFrame
    ? `${firstFrame.mobile.src} ${firstFrame.mobile.width}w, ${firstFrame.desktop.src} ${firstFrame.desktop.width}w`
    : undefined;

  const style: CSSProperties = {
    "--x": `${layout.x * config.spacingScale}%`,
    "--y": `${layout.y * config.spacingScale}%`,
    "--tx": `${(tile.xShift + driftX).toFixed(3)}rem`,
    "--ty": `${(tile.yShift + driftY).toFixed(3)}rem`,
    "--scale": tile.scale.toFixed(3),
    "--alpha": tile.alpha.toFixed(3),
    "--clip-top": `${tile.clipTop.toFixed(2)}%`,
    "--clip-right": `${tile.clipRight.toFixed(2)}%`,
    "--clip-bottom": `${tile.clipBottom.toFixed(2)}%`,
    "--clip-left": `${tile.clipLeft.toFixed(2)}%`,
    "--blur": `${(0.12 * tile.blur).toFixed(2)}px`,
    "--sat": tile.saturation.toFixed(3),
    "--zone-width": `${layout.widthRem}rem`,
    "--img-tx": `${embeddedImageX.toFixed(3)}rem`,
    "--img-ty": `${embeddedImageY.toFixed(3)}rem`,
    "--img-scale": imageScale.toFixed(4),
  } as CSSProperties;

  return (
    <section
      className={`${styles.tile} ${isEcho ? styles.tileEcho : ""}`}
      data-embedded-zone="true"
      data-zone-key={zone.key}
      data-current-item={tile.item.name}
      data-first-frame-desktop-src={firstFrame?.desktop.src}
      data-first-frame-mobile-src={firstFrame?.mobile.src}
      data-loading={index < 4 ? "eager" : "lazy"}
      data-fetch-priority={index < 2 ? "high" : "auto"}
      data-loading-strategy="decode-smoothed-scrub"
      style={style}
    >
      <div className={styles.tileAnchor}>
        <figure className={styles.tileFigure}>
          <img
            alt={tile.item.name.replaceAll("_", " ")}
            className={styles.tileImage}
            decoding="async"
            fetchPriority={index < 2 ? "high" : "auto"}
            height={useFirstFrame ? firstFrame.desktop.height : 1200}
            loading={index < 4 ? "eager" : "lazy"}
            sizes={useFirstFrame ? "(max-width: 720px) 118px, (max-width: 1200px) 148px, 198px" : undefined}
            src={imageSrc}
            srcSet={imageSrcSet}
            width={useFirstFrame ? firstFrame.desktop.width : 900}
          />
        </figure>
        <div className={styles.tileCaption}>
          <span className={styles.tileCaptionTitle}>{tile.item.name.replaceAll("_", " ")}</span>
        </div>
      </div>
    </section>
  );
}

function createDebugSignature(config: VariantConfig, effectiveCycles: number | null) {
  if (effectiveCycles == null) {
    return undefined;
  }

  return [
    "embedded-slow-field-20260324-v8",
    `tvh${config.trackVh}`,
    `ch${config.chapterVh}`,
    `shift${config.chapterShift}`,
    `gain${config.transitionGain}`,
    `speed${config.primarySpeed}`,
    `drift${config.primaryDrift}`,
    `wave${config.waveFrequency}`,
    `pulse${config.pulseAmplitude}`,
    `cko${effectiveCycles.toFixed(2)}`,
  ].join("|");
}

export default function FabricMotionLab({
  verifyMode = false,
}: {
  verifyMode?: boolean;
}) {
  const rootRef = useRef<HTMLElement | null>(null);
  const [reducedMotion, setReducedMotion] = useState(verifyMode);
  const [resistancePreset, setResistancePreset] = useState<ResistancePreset>(DEFAULT_RESISTANCE_PRESET);
  const [copiedPreset, setCopiedPreset] = useState(false);
  const [rawProgress, setRawProgress] = useState(verifyMode ? 1 : 0.08);
  const [progress, setProgress] = useState(verifyMode ? 1 : 0.08);

  const renderedLayouts = useMemo(
    () =>
      connectedSalonConfig.layouts
        .map((layout) => {
          const zone = zoneMap.get(layout.key);
          return zone ? { layout, zone } : null;
        })
        .filter((entry): entry is { layout: LayoutDefinition; zone: ZoneDefinition } => Boolean(entry)),
    [],
  );

  useEffect(() => {
    if (verifyMode) {
      setReducedMotion(true);
      setRawProgress(1);
      setProgress(1);
      return;
    }

    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(query.matches);
    update();

    if (typeof query.addEventListener === "function") {
      query.addEventListener("change", update);
      return () => query.removeEventListener("change", update);
    }

    query.addListener(update);
    return () => query.removeListener(update);
  }, [verifyMode]);

  useEffect(() => {
    if (verifyMode) {
      setResistancePreset(DEFAULT_RESISTANCE_PRESET);
      return;
    }

    try {
      const parsed = parseResistancePreset(window.localStorage.getItem(RESISTANCE_STORAGE_KEY));
      if (parsed) {
        setResistancePreset(parsed);
      }
    } catch {}
  }, [verifyMode]);

  useEffect(() => {
    if (reducedMotion) {
      setRawProgress(1);
      setProgress(1);
      return;
    }

    setProgress((previous) => {
      const targetProgress = mapTrackProgressByResistance(rawProgress, resistancePreset);
      const smoothing = clamp(0.2 / Math.pow(getResistanceScale(resistancePreset), 0.65), 0.045, 0.24);
      const next = previous + (targetProgress - previous) * smoothing;
      return Math.abs(next - previous) > 0.0005 ? next : previous;
    });
  }, [rawProgress, reducedMotion, resistancePreset]);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) {
      return;
    }

    const track = root.querySelector<HTMLElement>("[data-lab-variant]");
    if (!track) {
      return;
    }

    if (reducedMotion) {
      setProgress(1);
      return;
    }

    let nextProgress = 0.08;
    let rafId: number | null = null;

    const context = gsap.context(() => {
      ScrollTrigger.create({
        trigger: track,
        start: "top top",
        end: "bottom bottom",
        scrub: 0.8,
        onUpdate: (instance) => {
          nextProgress = instance.progress;
          track.style.setProperty("--variant-progress", instance.progress.toFixed(4));
          if (rafId !== null) {
            return;
          }

          rafId = window.requestAnimationFrame(() => {
            rafId = null;
            setRawProgress((previous) => (Math.abs(previous - nextProgress) > 0.0005 ? nextProgress : previous));
          });
        },
      });
    }, root);

    const refreshTimeout = window.setTimeout(() => ScrollTrigger.refresh(), 80);

    return () => {
      window.clearTimeout(refreshTimeout);
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
      }
      context.revert();
    };
  }, [reducedMotion]);

  const ckOLayout = connectedSalonConfig.layouts.find((layout) => layout.key === "CK_O");
  const ckOZone = zoneMap.get("CK_O");
  const ckOEffectiveCycles =
    ckOLayout && ckOZone
      ? Math.max(
          0,
          clamp(
            connectedSalonConfig.primaryBoost +
              connectedSalonConfig.primarySpeed * Math.max(1, connectedSalonConfig.loopCycles) -
              ckOLayout.band * connectedSalonConfig.primaryBandLag,
          ) - clamp(connectedSalonConfig.primaryBoost - ckOLayout.band * connectedSalonConfig.primaryBandLag),
        ) *
        ckOZone.cadence *
        connectedSalonConfig.transitionGain
      : null;
  const resistanceScale = getResistanceScale(resistancePreset);

  return (
    <section
      className={styles.pageShell}
      ref={rootRef}
      data-home-media-art="fabric-motion-lab"
      data-home-media-art-version="20260325-production"
      data-scroll-resistance={formatResistancePreset(resistancePreset)}
      data-verify-mode={verifyMode ? "true" : undefined}
    >
      {!verifyMode ? (
        <div className={styles.sensitivityPanel}>
          <div className={styles.sensitivityHeader}>
            <span className={styles.sensitivityLabel}>Scroll Resistance</span>
            <div className={styles.sensitivityActions}>
              <button
                type="button"
                className={styles.sensitivityReset}
                onClick={async () => {
                  const resetPreset = DEFAULT_RESISTANCE_PRESET;
                  setResistancePreset(resetPreset);
                  setCopiedPreset(false);
                  try {
                    window.localStorage.setItem(RESISTANCE_STORAGE_KEY, formatResistancePreset(resetPreset));
                  } catch {}
                }}
              >
                Reset
              </button>
              <button
                type="button"
                className={styles.sensitivityReset}
                onClick={async () => {
                  const presetText = formatResistancePreset(resistancePreset);
                  try {
                    await navigator.clipboard.writeText(presetText);
                    setCopiedPreset(true);
                    window.setTimeout(() => setCopiedPreset(false), 1200);
                  } catch {
                    setCopiedPreset(false);
                  }
                }}
              >
                {copiedPreset ? "Copied" : "Copy"}
              </button>
            </div>
          </div>
          <div className={styles.sensitivityHint}>Low = lighter/faster, High = heavier/slower</div>
          {([
            ["intro", "Intro"],
            ["middle", "Middle"],
            ["outro", "Outro"],
          ] as const).map(([key, label]) => (
            <label className={styles.sensitivityField} key={key}>
              <span className={styles.sensitivityFieldLabel}>{label}</span>
              <input
                className={styles.sensitivitySlider}
                type="range"
                min="0.35"
                max="3"
                step="0.05"
                value={resistancePreset[key]}
                aria-label={`Adjust ${label.toLowerCase()} scroll resistance`}
                onChange={(event) => {
                  const nextValue = clampResistance(Number(event.currentTarget.value));
                  const nextPreset = { ...resistancePreset, [key]: nextValue };
                  setResistancePreset(nextPreset);
                  setCopiedPreset(false);
                  try {
                    window.localStorage.setItem(
                      RESISTANCE_STORAGE_KEY,
                      formatResistancePreset(nextPreset),
                    );
                  } catch {}
                }}
              />
              <span className={styles.sensitivityValue}>{resistancePreset[key].toFixed(2)}x</span>
            </label>
          ))}
          <div className={styles.sensitivityPresetCode}>
            {formatResistancePreset(resistancePreset)}
            <br />
            {`track=${resistanceScale.toFixed(2)}x`}
          </div>
        </div>
      ) : null}
      <div className={styles.variantStack}>
        <section
          className={`${styles.variantTrack} ${styles.variantTrackEmbedded}`}
          data-lab-variant="true"
          data-debug-signature={createDebugSignature(connectedSalonConfig, ckOEffectiveCycles)}
          data-ck-o-effective-cycles={ckOEffectiveCycles?.toFixed(3)}
          style={
            {
              "--variant-progress": progress.toFixed(4),
              "--variant-shift": `${(connectedSalonConfig.chapterShift * clamp(progress)).toFixed(3)}rem`,
              "--variant-track": `${(connectedSalonConfig.trackVh * resistanceScale).toFixed(2)}dvh`,
              "--variant-chapter": `${connectedSalonConfig.chapterVh}dvh`,
              "--variant-chapter-width": `${connectedSalonConfig.chapterWidthPx}px`,
              "--variant-chapter-inset": `${connectedSalonConfig.chapterInsetRem}rem`,
            } as CSSProperties
          }
        >
          <div className={`${styles.variantViewport} ${styles.variantViewportEmbedded}`}>
            <div className={`${styles.variantChapter} ${styles.variantChapterEmbedded}`}>
              <div className={styles.variantPlane} />
              {renderedLayouts.map(({ layout, zone }, index) => (
                <Tile
                  config={connectedSalonConfig}
                  index={index}
                  key={`${connectedSalonConfig.slug}-${layout.key}-${index}`}
                  layout={layout}
                  progress={progress}
                  reducedMotion={reducedMotion}
                  zone={zone}
                />
              ))}
              <div className={styles.variantCta}>
                <Link className={styles.variantCtaLink} href="/products">
                  View more products
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </section>
  );
}
