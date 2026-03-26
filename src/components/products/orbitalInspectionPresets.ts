export type OrbitalPresetKey = "baseline" | "current" | "chrome-stripped" | "right-edge-up";

export type OrbitalMotionFamilyKey =
  | "hero-orbit-drift"
  | "torsion-reveal"
  | "apex-lift-finale"
  | "parallax-shear"
  | "halo-scan";

export type OrbitalLayerConfig = {
  previewChrome: boolean;
  studyChrome: boolean;
  sceneChrome: boolean;
  strictTrigger: boolean;
};

export type OrbitalMotionConfig = {
  spanDvh: number;
  settleStart: number;
  rightSwingYaw: number;
  rightSwingPitch: number;
  rightSwingBank: number;
  rightSwingLateral: number;
  endYaw: number;
  endPitch: number;
  endBank: number;
  endLateral: number;
  endVertical: number;
  endDepth: number;
  endScale: number;
  auraBase: number;
  auraInspect: number;
  sheenBase: number;
  sheenInspect: number;
  floor: number;
  laneDepth: number;
  laneYaw: number;
  lanePitch: number;
  laneLift: number;
  laneSpread: number;
};

export type OrbitalFamilyTuning = {
  torsion: number;
  lift: number;
  drift: number;
  lightSweep: number;
  finaleBias: number;
};

export type OrbitalResolvedConfig = {
  presetKey: OrbitalPresetKey;
  familyKey: OrbitalMotionFamilyKey;
  layers: OrbitalLayerConfig;
  motion: OrbitalMotionConfig;
  familyTuning: OrbitalFamilyTuning;
  controlsEnabled: boolean;
  debugEnabled: boolean;
  debugScroll: number | null;
};

type OrbitalPresetDefinition = {
  label: string;
  description: string;
  layers: OrbitalLayerConfig;
  motion: OrbitalMotionConfig;
};

type OrbitalMotionFamilyDefinition = {
  label: string;
  description: string;
  tuning: OrbitalFamilyTuning;
};

export const orbitalPresetCatalog: Record<OrbitalPresetKey, OrbitalPresetDefinition> = {
  baseline: {
    label: "Baseline",
    description: "이번 cleanup/end-pose 변경 전 상태",
    layers: {
      previewChrome: true,
      studyChrome: true,
      sceneChrome: true,
      strictTrigger: false,
    },
    motion: {
      spanDvh: 220,
      settleStart: 0.72,
      rightSwingYaw: 42,
      rightSwingPitch: 4,
      rightSwingBank: 16,
      rightSwingLateral: 6.8,
      endYaw: -4,
      endPitch: 22,
      endBank: -12,
      endLateral: 1.7,
      endVertical: 0.2,
      endDepth: -19.2,
      endScale: 0.91,
      auraBase: 0.18,
      auraInspect: 0.08,
      sheenBase: 0.06,
      sheenInspect: 0.14,
      floor: 0.12,
      laneDepth: 1.18,
      laneYaw: 7.2,
      lanePitch: 5.4,
      laneLift: 0.72,
      laneSpread: 0.48,
    },
  },
  current: {
    label: "Current",
    description: "현재 체크인된 최신 orbital 상태",
    layers: {
      previewChrome: false,
      studyChrome: false,
      sceneChrome: false,
      strictTrigger: true,
    },
    motion: {
      spanDvh: 268,
      settleStart: 0.68,
      rightSwingYaw: 34,
      rightSwingPitch: 2,
      rightSwingBank: 4,
      rightSwingLateral: 7,
      endYaw: 0,
      endPitch: 26,
      endBank: -36,
      endLateral: 3.1,
      endVertical: -0.6,
      endDepth: -19.2,
      endScale: 0.91,
      auraBase: 0.18,
      auraInspect: 0.08,
      sheenBase: 0.06,
      sheenInspect: 0.14,
      floor: 0,
      laneDepth: 1.18,
      laneYaw: 7.2,
      lanePitch: 5.4,
      laneLift: 0.72,
      laneSpread: 0.48,
    },
  },
  "chrome-stripped": {
    label: "Chrome Stripped",
    description: "baseline motion에 chrome만 걷은 상태",
    layers: {
      previewChrome: false,
      studyChrome: false,
      sceneChrome: false,
      strictTrigger: false,
    },
    motion: {
      spanDvh: 220,
      settleStart: 0.72,
      rightSwingYaw: 42,
      rightSwingPitch: 4,
      rightSwingBank: 16,
      rightSwingLateral: 6.8,
      endYaw: -4,
      endPitch: 22,
      endBank: -12,
      endLateral: 1.7,
      endVertical: 0.2,
      endDepth: -19.2,
      endScale: 0.91,
      auraBase: 0.18,
      auraInspect: 0.08,
      sheenBase: 0.06,
      sheenInspect: 0.14,
      floor: 0,
      laneDepth: 1.18,
      laneYaw: 7.2,
      lanePitch: 5.4,
      laneLift: 0.72,
      laneSpread: 0.48,
    },
  },
  "right-edge-up": {
    label: "Right Edge Up",
    description: "오른쪽 끝 들림을 강조한 pose만 따로 분리",
    layers: {
      previewChrome: true,
      studyChrome: true,
      sceneChrome: true,
      strictTrigger: true,
    },
    motion: {
      spanDvh: 268,
      settleStart: 0.68,
      rightSwingYaw: 34,
      rightSwingPitch: 2,
      rightSwingBank: 4,
      rightSwingLateral: 7,
      endYaw: 0,
      endPitch: 26,
      endBank: -36,
      endLateral: 3.1,
      endVertical: -0.6,
      endDepth: -19.2,
      endScale: 0.91,
      auraBase: 0.18,
      auraInspect: 0.08,
      sheenBase: 0.06,
      sheenInspect: 0.14,
      floor: 0.12,
      laneDepth: 1.18,
      laneYaw: 7.2,
      lanePitch: 5.4,
      laneLift: 0.72,
      laneSpread: 0.48,
    },
  },
};

export const orbitalMotionFamilyCatalog: Record<OrbitalMotionFamilyKey, OrbitalMotionFamilyDefinition> = {
  "hero-orbit-drift": {
    label: "Hero Orbit Drift",
    description: "가장 editorial한 orbit. 중앙 inspection이 또렷하고 release가 우아합니다.",
    tuning: {
      torsion: 0.18,
      lift: 0.34,
      drift: 0.58,
      lightSweep: 0.32,
      finaleBias: 0.42,
    },
  },
  "torsion-reveal": {
    label: "Torsion Reveal",
    description: "판 전체의 비틀림과 flattening이 중심인 reveal.",
    tuning: {
      torsion: 0.96,
      lift: 0.24,
      drift: 0.3,
      lightSweep: 0.22,
      finaleBias: 0.46,
    },
  },
  "apex-lift-finale": {
    label: "Apex Lift Finale",
    description: "후반 들어올림과 right-edge finale가 가장 강한 연출.",
    tuning: {
      torsion: 0.34,
      lift: 1,
      drift: 0.44,
      lightSweep: 0.28,
      finaleBias: 1,
    },
  },
  "parallax-shear": {
    label: "Parallax Shear",
    description: "카메라 슬라이드와 lane relief 차이가 중심인 technical choreography.",
    tuning: {
      torsion: 0.42,
      lift: 0.18,
      drift: 1,
      lightSweep: 0.18,
      finaleBias: 0.34,
    },
  },
  "halo-scan": {
    label: "Halo Scan",
    description: "geometry보다 sheen과 aura scan이 중심인 editorial light family.",
    tuning: {
      torsion: 0.14,
      lift: 0.24,
      drift: 0.4,
      lightSweep: 1,
      finaleBias: 0.36,
    },
  },
};

const zeroOrbitalFamilyTuning: OrbitalFamilyTuning = {
  torsion: 0,
  lift: 0,
  drift: 0,
  lightSweep: 0,
  finaleBias: 0,
};

const orbitalBooleanFields = [
  "previewChrome",
  "studyChrome",
  "sceneChrome",
  "strictTrigger",
] as const;

const orbitalNumberFields = [
  "spanDvh",
  "settleStart",
  "rightSwingYaw",
  "rightSwingPitch",
  "rightSwingBank",
  "rightSwingLateral",
  "endYaw",
  "endPitch",
  "endBank",
  "endLateral",
  "endVertical",
  "endDepth",
  "endScale",
  "auraBase",
  "auraInspect",
  "sheenBase",
  "sheenInspect",
  "floor",
  "laneDepth",
  "laneYaw",
  "lanePitch",
  "laneLift",
  "laneSpread",
] as const;

const orbitalFamilyFields = [
  "torsion",
  "lift",
  "drift",
  "lightSweep",
  "finaleBias",
] as const;

const orbitalNumberRanges: Record<(typeof orbitalNumberFields)[number], { min: number; max: number }> = {
  spanDvh: { min: 160, max: 360 },
  settleStart: { min: 0.4, max: 0.9 },
  rightSwingYaw: { min: 0, max: 64 },
  rightSwingPitch: { min: -12, max: 18 },
  rightSwingBank: { min: -8, max: 24 },
  rightSwingLateral: { min: 0, max: 12 },
  endYaw: { min: -32, max: 32 },
  endPitch: { min: -8, max: 40 },
  endBank: { min: -48, max: 24 },
  endLateral: { min: -8, max: 8 },
  endVertical: { min: -6, max: 6 },
  endDepth: { min: -28, max: -4 },
  endScale: { min: 0.82, max: 1.12 },
  auraBase: { min: 0, max: 1 },
  auraInspect: { min: 0, max: 1 },
  sheenBase: { min: 0, max: 1 },
  sheenInspect: { min: 0, max: 1 },
  floor: { min: 0, max: 1 },
  laneDepth: { min: 0, max: 2.5 },
  laneYaw: { min: 0, max: 18 },
  lanePitch: { min: 0, max: 18 },
  laneLift: { min: 0, max: 2.5 },
  laneSpread: { min: 0, max: 2.5 },
};

const orbitalFamilyRanges: Record<(typeof orbitalFamilyFields)[number], { min: number; max: number }> = {
  torsion: { min: 0, max: 1.5 },
  lift: { min: 0, max: 1.5 },
  drift: { min: 0, max: 1.5 },
  lightSweep: { min: 0, max: 1.5 },
  finaleBias: { min: 0, max: 1.5 },
};

const queryBooleanValue = (value: string | null | undefined, fallback: boolean) => {
  if (value == null || value === "") {
    return fallback;
  }
  if (value === "1" || value === "true") {
    return true;
  }
  if (value === "0" || value === "false") {
    return false;
  }
  return fallback;
};

const queryNumberValue = (
  value: string | null | undefined,
  fallback: number,
  rangeSource: Record<string, { min: number; max: number }>,
  field: string,
) => {
  if (value == null || value === "") {
    return fallback;
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  const range = rangeSource[field];
  return Math.min(range.max, Math.max(range.min, parsed));
};

export function buildOrbitalQueryString(
  searchParams?: Record<string, string | string[] | undefined> | URLSearchParams | string,
) {
  if (!searchParams) {
    return "";
  }

  if (typeof searchParams === "string") {
    return searchParams.startsWith("?") ? searchParams.slice(1) : searchParams;
  }

  if (searchParams instanceof URLSearchParams) {
    return searchParams.toString();
  }

  const params = new URLSearchParams();
  Object.entries(searchParams).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((item) => {
        if (typeof item === "string") {
          params.append(key, item);
        }
      });
      return;
    }

    if (typeof value === "string") {
      params.set(key, value);
    }
  });
  return params.toString();
}

export function createOrbitalResolvedConfig(options?: {
  presetKey?: OrbitalPresetKey;
  familyKey?: OrbitalMotionFamilyKey;
  familyTuning?: OrbitalFamilyTuning;
  controlsEnabled?: boolean;
  debugEnabled?: boolean;
  debugScroll?: number | null;
}) {
  const presetKey = options?.presetKey ?? "baseline";
  const familyKey = options?.familyKey ?? "hero-orbit-drift";
  const preset = orbitalPresetCatalog[presetKey];
  const family = orbitalMotionFamilyCatalog[familyKey];

  return {
    presetKey,
    familyKey,
    layers: { ...preset.layers },
    motion: { ...preset.motion },
    familyTuning: { ...(options?.familyTuning ?? family.tuning) },
    controlsEnabled: options?.controlsEnabled ?? false,
    debugEnabled: options?.debugEnabled ?? false,
    debugScroll: options?.debugScroll ?? null,
  } satisfies OrbitalResolvedConfig;
}

export function resolveOrbitalInspectionConfig(
  queryString?: string | URLSearchParams | Record<string, string | string[] | undefined>,
): OrbitalResolvedConfig {
  const params = new URLSearchParams(buildOrbitalQueryString(queryString));
  const presetValue = params.get("orbitalPreset");
  const hasOrbitalPreset = Boolean(presetValue);
  const presetKey = (presetValue && presetValue in orbitalPresetCatalog
    ? presetValue
    : "chrome-stripped") as OrbitalPresetKey;
  const familyValue = params.get("orbitalFamily");
  const hasFamily = Boolean(familyValue);
  const familyKey = (familyValue && familyValue in orbitalMotionFamilyCatalog
    ? familyValue
    : "hero-orbit-drift") as OrbitalMotionFamilyKey;

  const config = createOrbitalResolvedConfig({
    presetKey,
    familyKey,
    familyTuning: hasFamily ? { ...orbitalMotionFamilyCatalog[familyKey].tuning } : { ...zeroOrbitalFamilyTuning },
    controlsEnabled: queryBooleanValue(params.get("controls"), false),
    debugEnabled: queryBooleanValue(params.get("debug"), false),
    debugScroll: null,
  });

  if (!hasOrbitalPreset) {
    config.layers.previewChrome = true;
    config.layers.studyChrome = false;
    config.layers.sceneChrome = true;
    config.layers.strictTrigger = false;

    config.motion.spanDvh = 220;
    config.motion.settleStart = 0.72;
    config.motion.rightSwingYaw = 18;
    config.motion.rightSwingPitch = -5;
    config.motion.rightSwingBank = -3;
    config.motion.rightSwingLateral = 6.8;
    config.motion.endYaw = 8;
    config.motion.endPitch = 21;
    config.motion.endBank = -10;
    config.motion.endLateral = 1.7;
    config.motion.endVertical = 0.2;
    config.motion.endDepth = -19.2;
    config.motion.endScale = 0.91;
    config.motion.auraBase = 0.29;
    config.motion.auraInspect = 0.24;
    config.motion.sheenBase = 0.32;
    config.motion.sheenInspect = 0.14;
    config.motion.floor = 1;
    config.motion.laneDepth = 1.85;
    config.motion.laneYaw = 7.6;
    config.motion.lanePitch = 4.7;
    config.motion.laneLift = 0;
    config.motion.laneSpread = 0.75;
  }

  orbitalBooleanFields.forEach((field) => {
    config.layers[field] = queryBooleanValue(params.get(`o_${field}`), config.layers[field]);
  });

  orbitalNumberFields.forEach((field) => {
    config.motion[field] = queryNumberValue(
      params.get(`o_${field}`),
      config.motion[field],
      orbitalNumberRanges,
      field,
    );
  });

  orbitalFamilyFields.forEach((field) => {
    config.familyTuning[field] = queryNumberValue(
      params.get(`of_${field}`),
      config.familyTuning[field],
      orbitalFamilyRanges,
      field,
    );
  });

  const debugScrollValue = params.get("debugScroll");
  const debugScrollNumber = debugScrollValue == null ? null : Number(debugScrollValue);
  config.debugScroll = Number.isFinite(debugScrollNumber) ? debugScrollNumber : null;

  return config;
}

export function serializeOrbitalInspectionConfig(config: OrbitalResolvedConfig) {
  const params = new URLSearchParams();
  params.set("orbitalPreset", config.presetKey);
  params.set("orbitalFamily", config.familyKey);

  if (config.controlsEnabled) {
    params.set("controls", "1");
  }
  if (config.debugEnabled) {
    params.set("debug", "1");
  }
  if (typeof config.debugScroll === "number" && Number.isFinite(config.debugScroll)) {
    params.set("debugScroll", String(config.debugScroll));
  }

  orbitalBooleanFields.forEach((field) => {
    params.set(`o_${field}`, config.layers[field] ? "1" : "0");
  });
  orbitalNumberFields.forEach((field) => {
    const value = config.motion[field];
    params.set(`o_${field}`, Number.isInteger(value) ? String(value) : value.toFixed(3));
  });
  orbitalFamilyFields.forEach((field) => {
    const value = config.familyTuning[field];
    params.set(`of_${field}`, Number.isInteger(value) ? String(value) : value.toFixed(3));
  });

  return params.toString();
}

export function orbitalPresetLabel(presetKey: OrbitalPresetKey) {
  return orbitalPresetCatalog[presetKey].label;
}

export function orbitalPresetDescription(presetKey: OrbitalPresetKey) {
  return orbitalPresetCatalog[presetKey].description;
}

export function orbitalFamilyLabel(familyKey: OrbitalMotionFamilyKey) {
  return orbitalMotionFamilyCatalog[familyKey].label;
}

export function orbitalFamilyDescription(familyKey: OrbitalMotionFamilyKey) {
  return orbitalMotionFamilyCatalog[familyKey].description;
}
