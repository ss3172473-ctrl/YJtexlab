"use client";
import type { CSSProperties, ReactNode } from "react";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import manifest from "../../../public/new-stage-fabrics/manifest.json";
import {
  createOrbitalResolvedConfig,
  orbitalFamilyDescription,
  orbitalFamilyLabel,
  orbitalMotionFamilyCatalog,
  orbitalPresetCatalog,
  orbitalPresetDescription,
  orbitalPresetLabel,
  resolveOrbitalInspectionConfig,
  serializeOrbitalInspectionConfig,
  type OrbitalFamilyTuning,
  type OrbitalLayerConfig,
  type OrbitalMotionConfig,
  type OrbitalMotionFamilyKey,
  type OrbitalPresetKey,
  type OrbitalResolvedConfig,
} from "./orbitalInspectionPresets";
import styles from "./MotionHouseShowcase.module.css";

gsap.registerPlugin(ScrollTrigger);

type FabricCategory = "checks" | "stripes" | "others";

type FabricFrame = {
  src: string;
  name: string;
  category: FabricCategory;
};

type FabricManifest = {
  checks?: unknown;
  stripes?: unknown;
  others?: unknown;
};

type ZoneMotion =
  | "split-h"
  | "split-v"
  | "drift"
  | "rail-left"
  | "rail-right"
  | "band"
  | "shutter"
  | "pulse";

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

type FamilyZonesTwoInsertLayout = {
  key: string;
  x: number;
  y: number;
  widthRem: number;
  band: 0 | 1 | 2 | 3;
  reverse?: boolean;
};

type FamilyZonesThreeLayout = {
  key: string;
  x: number;
  y: number;
  lane: number;
  vectorX: number;
  vectorY: number;
};

type FamilyZonesThreeRailItem = FabricFrame & {
  seriesKey: string;
  serial: number;
};

type FamilyZonesThreeRailRow = {
  screen: 1 | 2;
  row: number;
  items: FamilyZonesThreeRailItem[];
};

type ZoneRenderState = {
  item: FabricFrame;
  visible: boolean;
  emphasis: number;
  cyclePhase: number;
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
  lineScale: number;
  sweep: number;
  glow: number;
};

type StageTheme = "dark" | "light";

type RoomTone = "ink" | "paper" | "stone";
type RoomType =
  | "connectedGrid"
  | "maskLedger"
  | "stackAtlas"
  | "duplexRails"
  | "drawerDepth"
  | "closingWall";
type RoomPerformanceClass = "transform" | "mask-heavy";
type ReducedMotionVariant =
  | "still-wall"
  | "still-ledger"
  | "still-rails"
  | "still-cabinet"
  | "crossfade";
type MobileVariant = "stacked" | "grid" | "reduced-rails";

export type RoomDefinition = {
  slug: string;
  eyebrow: string;
  title: string;
  note: string;
  roomType: RoomType;
  tone: RoomTone;
  chapter: "arrival" | "installations" | "final-room";
  groups: string[];
  scrollSpan: string;
  pin: boolean;
  performanceClass: RoomPerformanceClass;
  reducedMotionVariant: ReducedMotionVariant;
  mobileVariant: MobileVariant;
  assetBudget: number;
  animatedTiles: number;
  phaseMap?: readonly string[];
  laneCount?: 2 | 3;
  lanePause?: boolean;
  safariFallback?: "clip-path-ledger" | "none";
  mobilePinDowngrade?: boolean;
};

type OrbitalDebugMetrics = {
  presetKey: OrbitalPresetKey;
  familyKey: OrbitalMotionFamilyKey;
  progress: number;
  layers: OrbitalLayerConfig;
  motion: Pick<
    OrbitalMotionConfig,
    "spanDvh" | "settleStart" | "endYaw" | "endPitch" | "endBank" | "endLateral" | "endVertical" | "endDepth"
  >;
  familyTuning: OrbitalFamilyTuning;
  pose: {
    yaw: number;
    pitch: number;
    bank: number;
    lateral: number;
    vertical: number;
    depth: number;
    scale: number;
  };
};

const orbitalConfigCache = new WeakMap<HTMLElement, { raw: string; config: OrbitalResolvedConfig }>();

type GalleryChapterDefinition = {
  slug: "arrival" | "installations" | "final-room";
  eyebrow: string;
  title: string;
  note: string;
  rooms: RoomDefinition[];
};

type AppendixLayout =
  | "veilDock"
  | "hingeFan"
  | "bandPassage"
  | "nestedFrames"
  | "relayColumns"
  | "offsetWall";

type AppendixDefinition = {
  slug: string;
  eyebrow: string;
  title: string;
  note: string;
  layout: AppendixLayout;
  tone: RoomTone;
  groups: string[];
  span: string;
};

type MotionHouseShowcaseMode =
  | "full"
  | "family-zones-2-insert"
  | "family-zones-3"
  | "family-zones-3-prerail"
  | "product-lab"
  | "product-lab-ver12"
  | "duplex-rails-room";

type RailStudyLayout =
  | "serialShelf"
  | "duplexSlow"
  | "quietConveyor"
  | "lateExitArchive"
  | "opposedLedger"
  | "holdRail"
  | "staggeredShelf"
  | "softDuplex"
  | "splitHold"
  | "archiveBelt";

type ProductRailVariant =
  | "ver1"
  | "ver2"
  | "ver3"
  | "ver4"
  | "ver5"
  | "ver6"
  | "ver7"
  | "ver8"
  | "ver9"
  | "ver10"
  | "ver11"
  | "ver12"
  | "ver13"
  | "ver14"
  | "orbital-inspection-board"
  | "hinge-gallery-wall"
  | "depth-runway-stack"
  | "light-table-cascade"
  | "ending-credits-crawl"
  | "isometric-fabric-atlas"
  | "hinged-specimen-book"
  | "curved-ribbon-tunnel"
  | "floating-archive-columns";

type ProductRailGapMode = "names" | "series" | "chapters" | "runway";
type ProductRailCaptionMode = "plain" | "wave" | "ledger" | "runway";
type ProductRailMotionGrammar =
  | "baseline"
  | "phase-relay"
  | "velocity-counterflow"
  | "aperture-sweep"
  | "caption-wave"
  | "series-pulse"
  | "deep-parallax"
  | "split-tempo"
  | "seam-chorus"
  | "archive-runway"
  | "rail-glide-cant"
  | "curator-dip-arc"
  | "torsion-s-curve"
  | "compression-hover-lock"
  | "orbital-inspection"
  | "hinge-gallery"
  | "depth-runway"
  | "light-table"
  | "ending-credits"
  | "isometric-atlas"
  | "hinged-book"
  | "ribbon-tunnel"
  | "floating-columns";

type ProductVer7RowRole =
  | "upper-far"
  | "upper-mid"
  | "upper-near"
  | "center"
  | "lower-near"
  | "lower-mid"
  | "lower-far"
  | "cta";

type ProductVer7FabricCell = FamilyZonesThreeRailItem & {
  cellKey: string;
};

type ProductVer7TextCell = {
  cellKey: string;
  label: string;
};

type ProductVer7Row = {
  role: ProductVer7RowRole;
  kind: "fabric" | "cta";
  fabricCells: ProductVer7FabricCell[];
  textCells: ProductVer7TextCell[];
};

type RailStudyDefinition = {
  slug: string;
  presentation: "rail-study" | "3d-uiux-lab" | "3d-research-lab";
  eyebrow: string;
  title: string;
  note: string;
  layout: RailStudyLayout;
  span: string;
  reference: string;
  cue: string;
  focusSeries: string[];
  accent: string;
  variantKey: ProductRailVariant;
  motionGrammar: ProductRailMotionGrammar;
  laneGapRem: number;
  rowGapRem: number;
  tileWidthRem: number;
  viewportHeightRem: number;
  baseDuration: number;
  durationStep: number;
  repeatCopies: 2 | 3;
  gapMode: ProductRailGapMode;
  captionMode: ProductRailCaptionMode;
};

const roomPerformanceBudget = {
  pinMax: 2,
  maskHeavyMax: 1,
  animatedTiles: 12,
} as const;

const foldedIndexPhaseMap = ["stack", "cascade", "spread", "hold"] as const;
const closingWallPhaseMap = ["occlude", "reveal", "settle"] as const;
const threeDimensionalLabVariantKeys = [
  "orbital-inspection-board",
  "hinge-gallery-wall",
  "depth-runway-stack",
  "light-table-cascade",
] as const;

const researchLabVariantKeys = [
  "ending-credits-crawl",
  "isometric-fabric-atlas",
  "hinged-specimen-book",
  "curved-ribbon-tunnel",
  "floating-archive-columns",
] as const;

const zoneDefinitions: ZoneDefinition[] = [
  { key: "CK_D", x: 6, y: 8, motion: "split-v", focusStart: 0.02, focusEnd: 0.28, cadence: 4.6, drift: 1.2, depth: 1.1, direction: -1 },
  { key: "CK_O", x: 23, y: 10, motion: "drift", focusStart: 0.08, focusEnd: 0.34, cadence: 4.2, drift: 1.4, depth: 0.9, direction: 1 },
  { key: "ST_N", x: 74, y: 7, motion: "rail-right", focusStart: 0.42, focusEnd: 0.78, cadence: 5.8, drift: 1.8, depth: 1.4, direction: 1 },
  { key: "CK_AF", x: 12, y: 28, motion: "split-h", focusStart: 0.1, focusEnd: 0.4, cadence: 4.3, drift: 1.1, depth: 0.8, direction: 1 },
  { key: "ST_G", x: 65, y: 25, motion: "band", focusStart: 0.48, focusEnd: 0.82, cadence: 5.4, drift: 1.6, depth: 1.2, direction: -1 },
  { key: "CK_AC", x: 36, y: 31, motion: "split-v", focusStart: 0.16, focusEnd: 0.46, cadence: 4.0, drift: 1.1, depth: 1.0, direction: -1 },
  { key: "ST_B", x: 52, y: 40, motion: "rail-left", focusStart: 0.44, focusEnd: 0.74, cadence: 5.2, drift: 1.5, depth: 1.3, direction: -1 },
  { key: "CK_T", x: 82, y: 41, motion: "drift", focusStart: 0.18, focusEnd: 0.52, cadence: 4.5, drift: 1.2, depth: 1.0, direction: 1 },
  { key: "CK_AI", x: 8, y: 58, motion: "split-h", focusStart: 0.22, focusEnd: 0.58, cadence: 4.1, drift: 1.0, depth: 0.9, direction: -1 },
  { key: "CK_S", x: 28, y: 64, motion: "pulse", focusStart: 0.26, focusEnd: 0.62, cadence: 4.0, drift: 0.9, depth: 0.8, direction: 1 },
  { key: "ST_A", x: 69, y: 62, motion: "rail-right", focusStart: 0.5, focusEnd: 0.84, cadence: 5.0, drift: 1.7, depth: 1.1, direction: 1 },
  { key: "ETC_B", x: 3, y: 80, motion: "shutter", focusStart: 0.68, focusEnd: 0.96, cadence: 3.2, drift: 0.8, depth: 0.7, direction: -1 },
  { key: "ETC_C", x: 42, y: 83, motion: "shutter", focusStart: 0.74, focusEnd: 0.98, cadence: 3.0, drift: 0.7, depth: 0.7, direction: 1 },
  { key: "ST_M", x: 63, y: 80, motion: "band", focusStart: 0.54, focusEnd: 0.9, cadence: 5.3, drift: 1.4, depth: 1.1, direction: -1 },
  { key: "CK_AM", x: 84, y: 74, motion: "pulse", focusStart: 0.3, focusEnd: 0.68, cadence: 3.8, drift: 1.0, depth: 0.9, direction: 1 },
];

const acts = [
  { label: "Checks Drift", start: 0, end: 0.22 },
  { label: "Split Cuts", start: 0.18, end: 0.5 },
  { label: "Stripe Rails", start: 0.46, end: 0.82 },
  { label: "Finale Pulse", start: 0.78, end: 1 },
] as const;

const familyZonesTwoInsertLayout: FamilyZonesTwoInsertLayout[] = [
  { key: "CK_D", x: 5, y: 6, widthRem: 11.8, band: 0 },
  { key: "CK_O", x: 23, y: 11, widthRem: 11.1, band: 0 },
  { key: "ST_N", x: 70, y: 8, widthRem: 12.4, band: 0 },
  { key: "CK_AF", x: 11, y: 27, widthRem: 10.3, band: 0 },
  { key: "ST_G", x: 58, y: 32, widthRem: 11.2, band: 0 },
  { key: "CK_AC", x: 36, y: 40, widthRem: 10.5, band: 1 },
  { key: "ST_B", x: 79, y: 47, widthRem: 10.7, band: 1 },
  { key: "CK_T", x: 7, y: 58, widthRem: 11.5, band: 1 },
  { key: "CK_AI", x: 28, y: 68, widthRem: 10.4, band: 1 },
  { key: "CK_S", x: 58, y: 65, widthRem: 10.2, band: 1 },
  { key: "ST_A", x: 73, y: 76, widthRem: 11.5, band: 2 },
  { key: "ETC_B", x: 15, y: 88, widthRem: 10.1, band: 2 },
  { key: "ETC_C", x: 42, y: 96, widthRem: 10.1, band: 2 },
  { key: "ST_M", x: 60, y: 102, widthRem: 11.2, band: 2 },
  { key: "CK_AM", x: 82, y: 110, widthRem: 10.6, band: 2 },
] as const;

const familyZonesTwoInsertEchoLayout: FamilyZonesTwoInsertLayout[] = [
  { key: "CK_AM", x: 10, y: 126, widthRem: 10.2, band: 3, reverse: true },
  { key: "ST_M", x: 28, y: 132, widthRem: 10.8, band: 3, reverse: true },
  { key: "ETC_C", x: 48, y: 136, widthRem: 9.8, band: 3, reverse: true },
  { key: "ST_A", x: 68, y: 130, widthRem: 11.1, band: 3, reverse: true },
  { key: "CK_AI", x: 84, y: 138, widthRem: 10.0, band: 3, reverse: true },
  { key: "CK_AC", x: 16, y: 145, widthRem: 10.2, band: 3, reverse: true },
  { key: "ST_G", x: 36, y: 149, widthRem: 10.7, band: 3, reverse: true },
  { key: "CK_O", x: 57, y: 153, widthRem: 10.6, band: 3, reverse: true },
  { key: "CK_D", x: 74, y: 148, widthRem: 10.6, band: 3, reverse: true },
  { key: "CK_T", x: 88, y: 156, widthRem: 10.7, band: 3, reverse: true },
] as const;

const familyZonesThreeActs = [
  { label: "Quiet Assembly", start: 0, end: 0.56 },
  { label: "Fade Beat", start: 0.56, end: 0.72 },
  { label: "Rows 1-4", start: 0.72, end: 0.88 },
  { label: "Rows 5-8", start: 0.88, end: 0.985 },
  { label: "Late Exit", start: 0.985, end: 1 },
] as const;

const familyZonesThreeLayout: FamilyZonesThreeLayout[] = [
  { key: "CK_D", x: 6, y: 8, lane: 0, vectorX: -1.4, vectorY: -0.6 },
  { key: "CK_O", x: 23, y: 10, lane: 1, vectorX: 1.2, vectorY: -0.8 },
  { key: "ST_N", x: 74, y: 7, lane: 6, vectorX: 1.4, vectorY: -0.5 },
  { key: "CK_AF", x: 12, y: 28, lane: 1, vectorX: -1.2, vectorY: -0.2 },
  { key: "ST_G", x: 65, y: 25, lane: 5, vectorX: 1.1, vectorY: -0.1 },
  { key: "CK_AC", x: 36, y: 31, lane: 2, vectorX: -0.8, vectorY: -0.3 },
  { key: "ST_B", x: 52, y: 40, lane: 4, vectorX: 0.9, vectorY: 0.2 },
  { key: "CK_T", x: 82, y: 41, lane: 7, vectorX: 1.2, vectorY: 0.1 },
  { key: "CK_AI", x: 8, y: 58, lane: 0, vectorX: -1.5, vectorY: 0.5 },
  { key: "CK_S", x: 28, y: 64, lane: 3, vectorX: -1.1, vectorY: 0.8 },
  { key: "ST_A", x: 69, y: 62, lane: 6, vectorX: 1.3, vectorY: 0.7 },
  { key: "ETC_B", x: 3, y: 80, lane: 2, vectorX: -1.1, vectorY: 1.1 },
  { key: "ETC_C", x: 42, y: 83, lane: 4, vectorX: 0.1, vectorY: 1.1 },
  { key: "ST_M", x: 63, y: 80, lane: 5, vectorX: 1.1, vectorY: 1.1 },
  { key: "CK_AM", x: 84, y: 74, lane: 7, vectorX: 1.4, vectorY: 0.9 },
];

const galleryChapters: GalleryChapterDefinition[] = [
  {
    slug: "arrival",
    eyebrow: "Second Act / Chapter I",
    title: "Arrival",
    note: "무질서하게 늘어놓지 않고, 같은 패밀리를 같은 공간 안에서 정리된 전시 언어로 보여주는 도입부.",
    rooms: [
      {
        slug: "connected-salon",
        eyebrow: "Room 01",
        title: "Connected Salon",
        note: "연결된 프레임 벽에서 같은 패밀리들이 같은 자리에서만 교체된다.",
        roomType: "connectedGrid",
        tone: "stone",
        chapter: "arrival",
        groups: ["CK_AF", "CK_T", "CK_AI", "CK_S", "CK_AM", "ETC_C"],
        scrollSpan: "112dvh",
        pin: false,
        performanceClass: "transform",
        reducedMotionVariant: "still-wall",
        mobileVariant: "grid",
        assetBudget: 12,
        animatedTiles: 8,
        safariFallback: "none",
      },
      {
        slug: "masked-ledger",
        eyebrow: "Room 02",
        title: "Masked Ledger",
        note: "세로 ledger frame 안에서만 원단이 조용히 교체되고, 종이 커튼처럼 열리고 닫힌다.",
        roomType: "maskLedger",
        tone: "paper",
        chapter: "arrival",
        groups: ["CK_D", "CK_O", "CK_AC", "ETC_B"],
        scrollSpan: "122dvh",
        pin: false,
        performanceClass: "mask-heavy",
        reducedMotionVariant: "still-ledger",
        mobileVariant: "grid",
        assetBudget: 8,
        animatedTiles: 8,
        safariFallback: "clip-path-ledger",
      },
    ],
  },
  {
    slug: "installations",
    eyebrow: "Second Act / Chapter II",
    title: "Installations",
    note: "카드 스택, 레일, 서랍 같은 설치물 문법으로 스크롤에 반응하는 중간 전개.",
    rooms: [
      {
        slug: "folded-index-cascade-atlas",
        eyebrow: "Room 03",
        title: "Folded Index / Cascade Atlas",
        note: "카드 더미가 압축된 상태에서 촤르르륵 풀리며 벽처럼 정렬되는 핵심 설치물.",
        roomType: "stackAtlas",
        tone: "ink",
        chapter: "installations",
        groups: ["CK_AI", "CK_S", "CK_T", "ST_M", "ST_A"],
        scrollSpan: "220dvh",
        pin: true,
        performanceClass: "transform",
        reducedMotionVariant: "still-wall",
        mobileVariant: "stacked",
        assetBudget: 10,
        animatedTiles: 7,
        phaseMap: foldedIndexPhaseMap,
        safariFallback: "none",
        mobilePinDowngrade: true,
      },
      {
        slug: "rail-shelf-duplex-rails",
        eyebrow: "Room 04",
        title: "Rail Shelf / Duplex Rails",
        note: "세 개의 레일이 각기 다른 속도와 정지 지점으로 움직이며 다시 출발한다.",
        roomType: "duplexRails",
        tone: "stone",
        chapter: "installations",
        groups: ["ST_A", "ST_B", "ST_G", "CK_T", "CK_AC", "ST_N"],
        scrollSpan: "128dvh",
        pin: false,
        performanceClass: "transform",
        reducedMotionVariant: "still-rails",
        mobileVariant: "reduced-rails",
        assetBudget: 12,
        animatedTiles: 12,
        laneCount: 3,
        lanePause: true,
        safariFallback: "none",
      },
      {
        slug: "parallax-cabinet-drawer-depth",
        eyebrow: "Room 05",
        title: "Parallax Cabinet / Drawer Depth",
        note: "앞뒤 깊이가 다른 서랍 트레이가 미세하게 어긋나며 specimen drawer처럼 읽힌다.",
        roomType: "drawerDepth",
        tone: "stone",
        chapter: "installations",
        groups: ["CK_AC", "CK_AF", "CK_AM", "ETC_B", "ETC_C"],
        scrollSpan: "134dvh",
        pin: false,
        performanceClass: "transform",
        reducedMotionVariant: "still-cabinet",
        mobileVariant: "grid",
        assetBudget: 9,
        animatedTiles: 9,
        safariFallback: "none",
      },
    ],
  },
  {
    slug: "final-room",
    eyebrow: "Second Act / Chapter III",
    title: "Final Room",
    note: "앞쪽 패널이 뒤 벽을 잠깐 가리며 reveal 되고, 마지막에는 정돈된 벽면으로 정지한다.",
    rooms: [
      {
        slug: "triptych-chamber-closing-wall",
        eyebrow: "Room 06",
        title: "Triptych Chamber / Closing Wall",
        note: "세 개의 앞 패널과 뒤 wall grid가 겹치며 열리고 닫히는 마지막 챔버.",
        roomType: "closingWall",
        tone: "ink",
        chapter: "final-room",
        groups: ["CK_D", "ST_A", "ETC_C", "CK_O", "ST_G", "CK_AM"],
        scrollSpan: "178dvh",
        pin: true,
        performanceClass: "transform",
        reducedMotionVariant: "crossfade",
        mobileVariant: "grid",
        assetBudget: 9,
        animatedTiles: 9,
        phaseMap: closingWallPhaseMap,
        safariFallback: "none",
        mobilePinDowngrade: true,
      },
    ],
  },
];

const galleryRooms = galleryChapters.flatMap((chapter) => chapter.rooms);

const appendixStudies: AppendixDefinition[] = [
  {
    slug: "veil-dock",
    eyebrow: "Appendix 01",
    title: "Veil Dock",
    note: "두 개의 큰 베일 프레임 뒤에서 이미지가 겹쳐 바뀌는 조용한 dock.",
    layout: "veilDock",
    tone: "paper",
    groups: ["CK_D", "CK_O", "ETC_B", "ETC_C"],
    span: "104dvh",
  },
  {
    slug: "hinge-fan",
    eyebrow: "Appendix 02",
    title: "Hinge Fan",
    note: "한쪽 축을 공유하는 패널들이 순차적으로 벌어지는 fan wall.",
    layout: "hingeFan",
    tone: "ink",
    groups: ["CK_AI", "CK_S", "CK_T", "ST_M", "ST_A"],
    span: "112dvh",
  },
  {
    slug: "band-passage",
    eyebrow: "Appendix 03",
    title: "Band Passage",
    note: "수평 밴드와 수직 밴드가 교차하면서 통로처럼 읽히는 교차형 composition.",
    layout: "bandPassage",
    tone: "stone",
    groups: ["ST_A", "ST_B", "ST_G", "ST_N", "CK_AC"],
    span: "98dvh",
  },
  {
    slug: "nested-frames",
    eyebrow: "Appendix 04",
    title: "Nested Frames",
    note: "큰 프레임 안에서 더 작은 프레임들이 같은 family를 레이어로 감싼다.",
    layout: "nestedFrames",
    tone: "stone",
    groups: ["CK_AF", "CK_AM", "ETC_C", "CK_AC"],
    span: "102dvh",
  },
  {
    slug: "relay-columns",
    eyebrow: "Appendix 05",
    title: "Relay Columns",
    note: "서로 다른 높이의 세로 열이 릴레이처럼 이미지를 전달하며 움직인다.",
    layout: "relayColumns",
    tone: "ink",
    groups: ["ST_A", "ST_B", "ST_G", "ST_M"],
    span: "118dvh",
  },
  {
    slug: "offset-wall",
    eyebrow: "Appendix 06",
    title: "Offset Wall",
    note: "벽면의 프레임들이 어긋난 좌표에서 나타났다가 다시 정렬되는 offset grid.",
    layout: "offsetWall",
    tone: "paper",
    groups: ["CK_T", "CK_D", "CK_O", "ETC_B", "CK_AI", "CK_AM"],
    span: "106dvh",
  },
];

function isFabricFrame(value: unknown, category: FabricCategory): value is FabricFrame {
  return Boolean(
    value &&
      typeof value === "object" &&
      "src" in value &&
      "name" in value &&
      typeof value.src === "string" &&
      typeof value.name === "string" &&
      "category" in value &&
      value.category === category,
  );
}

function normalizeCategory(input: unknown, category: FabricCategory) {
  if (!Array.isArray(input)) {
    return [] as FabricFrame[];
  }

  return input.filter((item): item is FabricFrame => isFabricFrame(item, category));
}

const normalizedManifest = manifest as FabricManifest;
const fabrics = {
  checks: normalizeCategory(normalizedManifest.checks, "checks"),
  stripes: normalizeCategory(normalizedManifest.stripes, "stripes"),
  others: normalizeCategory(normalizedManifest.others, "others"),
};

function sanitizeItems(items: FabricFrame[]) {
  return items.filter((item) => item.name !== "ETC_A01");
}

function groupKeyFromName(name: string) {
  const match = name.match(/^([A-Z]+)_([A-Z]+)\d+$/);
  return match ? `${match[1]}_${match[2]}` : name;
}

function labelFromGroup(key: string) {
  return key.replace("_", " ");
}

function categoryFromGroup(key: string): FabricCategory {
  if (key.startsWith("ST_")) {
    return "stripes";
  }
  if (key.startsWith("ETC_")) {
    return "others";
  }
  return "checks";
}

function serialFromName(name: string) {
  const match = name.match(/(\d+)$/);
  return match ? Number(match[1]) : Number.MAX_SAFE_INTEGER;
}

function clamp(value: number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

function smoothStep(value: number) {
  const clamped = clamp(value);
  return clamped * clamped * (3 - 2 * clamped);
}

function windowProgress(progress: number, start: number, end: number) {
  if (end <= start) {
    return 0;
  }
  return smoothStep((progress - start) / (end - start));
}

function mix(start: number, end: number, amount: number) {
  return start + (end - start) * clamp(amount);
}

const mergedFrames = sanitizeItems([...fabrics.checks, ...fabrics.stripes, ...fabrics.others]);
const groupedFrames = mergedFrames.reduce((map, item) => {
  const groupKey = groupKeyFromName(item.name);
  const groupItems = map.get(groupKey);
  if (groupItems) {
    groupItems.push(item);
  } else {
    map.set(groupKey, [item]);
  }
  return map;
}, new Map<string, FabricFrame[]>());

const uniqueFinaleFrames = (() => {
  const seenSrc = new Set<string>();
  const seenName = new Set<string>();
  const ordered: FabricFrame[] = [];

  const pushUnique = (item: FabricFrame) => {
    if (seenSrc.has(item.src) || seenName.has(item.name)) {
      return;
    }
    seenSrc.add(item.src);
    seenName.add(item.name);
    ordered.push(item);
  };

  mergedFrames.forEach(pushUnique);

  return ordered;
})();

const canonicalRailItems = uniqueFinaleFrames
  .map((item) => ({
    ...item,
    seriesKey: groupKeyFromName(item.name),
    serial: serialFromName(item.name),
  }))
  .sort((left, right) => {
    const pathCompare = left.src.localeCompare(right.src);
    if (pathCompare !== 0) {
      return pathCompare;
    }
    return left.name.localeCompare(right.name);
  });

const familyZonesThreeLaneCount = 8;
const canonicalRailSeriesOrder = Array.from(
  new Set(canonicalRailItems.map((item) => item.seriesKey)),
);

function packSequentialRows(
  items: FamilyZonesThreeRailItem[],
  screen: 1 | 2,
  rowNumbers: number[],
) {
  const rows: FamilyZonesThreeRailRow[] = [];
  let cursor = 0;
  let remainingItems = items.length;
  let remainingRows = rowNumbers.length;

  rowNumbers.forEach((rowNumber) => {
    const takeCount =
      remainingRows <= 1 ? remainingItems : Math.ceil(remainingItems / remainingRows);
    const rowItems = items.slice(cursor, cursor + takeCount);
    rows.push({
      screen,
      row: rowNumber,
      items: rowItems,
    });
    cursor += takeCount;
    remainingItems -= takeCount;
    remainingRows -= 1;
  });

  return rows;
}

const screenOneItemCount = Math.ceil(canonicalRailItems.length / 2);
const screenOneRows = packSequentialRows(canonicalRailItems.slice(0, screenOneItemCount), 1, [1, 2, 3, 4]);
const screenTwoRows = packSequentialRows(canonicalRailItems.slice(screenOneItemCount), 2, [5, 6, 7, 8]);
const familyZonesThreeScreenRows = [...screenOneRows, ...screenTwoRows];
const duplexRailsRoomSlug = "rail-shelf-duplex-rails";

const railStudyDefinitions: RailStudyDefinition[] = [
  {
    slug: "ver1",
    presentation: "rail-study",
    eyebrow: "ver1",
    title: "Duplex Rails Archive",
    note: "기준안. 정렬된 원단군을 8열 rail archive로 풀어내고, 캡션과 하단 이름 레저는 가장 절제된 형태로 유지한다.",
    layout: "duplexSlow",
    span: "280dvh",
    reference: "GSAP ScrollTrigger / Lenis / Codrops editorial rails",
    cue: "Layered archive duet",
    focusSeries: canonicalRailSeriesOrder.slice(0, 6),
    accent: "#b67d54",
    variantKey: "ver1",
    motionGrammar: "baseline",
    laneGapRem: 2.3,
    rowGapRem: 1.15,
    tileWidthRem: 7.4,
    viewportHeightRem: 13.8,
    baseDuration: 36,
    durationStep: 3,
    repeatCopies: 2,
    gapMode: "names",
    captionMode: "plain",
  },
  {
    slug: "ver2",
    presentation: "rail-study",
    eyebrow: "ver2",
    title: "Phase Offset Relay",
    note: "각 rail이 같은 재료를 다른 위상으로 받아 이어주는 방식. 줄마다 등장 타이밍과 길이가 미묘하게 어긋나 relay처럼 읽힌다.",
    layout: "duplexSlow",
    span: "300dvh",
    reference: "GSAP helper timing / relay offsets / continuous marquee",
    cue: "Conductor-led relay",
    focusSeries: canonicalRailSeriesOrder.slice(1, 7),
    accent: "#d59562",
    variantKey: "ver2",
    motionGrammar: "phase-relay",
    laneGapRem: 2.6,
    rowGapRem: 1.25,
    tileWidthRem: 7.8,
    viewportHeightRem: 14.3,
    baseDuration: 34,
    durationStep: 2.6,
    repeatCopies: 2,
    gapMode: "series",
    captionMode: "plain",
  },
  {
    slug: "ver3",
    presentation: "rail-study",
    eyebrow: "ver3",
    title: "Scroll Velocity Counterflow",
    note: "scroll 밀도에 반응해 rail의 박자가 미세하게 변하는 안. transport는 끊기지 않되 체감 속도만 살아 움직인다.",
    layout: "duplexSlow",
    span: "300dvh",
    reference: "GSAP horizontalLoop / scroll-reactive marquee / infinite-marquee",
    cue: "Counterflow tempo",
    focusSeries: canonicalRailSeriesOrder.slice(0, 5),
    accent: "#c57748",
    variantKey: "ver3",
    motionGrammar: "velocity-counterflow",
    laneGapRem: 2.5,
    rowGapRem: 1.15,
    tileWidthRem: 7.9,
    viewportHeightRem: 14.1,
    baseDuration: 33,
    durationStep: 2.2,
    repeatCopies: 3,
    gapMode: "names",
    captionMode: "ledger",
  },
  {
    slug: "ver4",
    presentation: "rail-study",
    eyebrow: "ver4",
    title: "Aperture Sweep",
    note: "정지 없이 지나가지만 중앙의 aperture band가 강약을 만든다. 빛의 슬릿을 통과하는 아카이브처럼 보이도록 설계했다.",
    layout: "duplexSlow",
    span: "300dvh",
    reference: "mask-driven editorial reveal / stage-light aperture",
    cue: "Stage slit scan",
    focusSeries: canonicalRailSeriesOrder.slice(2, 8),
    accent: "#d4a070",
    variantKey: "ver4",
    motionGrammar: "aperture-sweep",
    laneGapRem: 2.8,
    rowGapRem: 1.3,
    tileWidthRem: 8.1,
    viewportHeightRem: 14.6,
    baseDuration: 35,
    durationStep: 2.5,
    repeatCopies: 3,
    gapMode: "chapters",
    captionMode: "plain",
  },
  {
    slug: "ver5",
    presentation: "rail-study",
    eyebrow: "ver5",
    title: "Caption Wave Ledger",
    note: "이미지는 steady하게 흘리고, 이름 텍스트만 ledger처럼 박자차를 두고 흔들리게 만든 안이다.",
    layout: "duplexSlow",
    span: "290dvh",
    reference: "editorial ledger captions / text-marquee lag",
    cue: "Caption wave field",
    focusSeries: canonicalRailSeriesOrder.slice(0, 6),
    accent: "#b98c68",
    variantKey: "ver5",
    motionGrammar: "caption-wave",
    laneGapRem: 2.5,
    rowGapRem: 1.35,
    tileWidthRem: 7.8,
    viewportHeightRem: 14,
    baseDuration: 38,
    durationStep: 2.4,
    repeatCopies: 2,
    gapMode: "series",
    captionMode: "wave",
  },
  {
    slug: "ver6",
    presentation: "rail-study",
    eyebrow: "ver6",
    title: "Series Pulse Grid",
    note: "시리즈 경계가 gap text와 row scale에 반영되는 안. 같은 family가 모여 있는 느낌을 더 명확히 보여준다.",
    layout: "duplexSlow",
    span: "300dvh",
    reference: "grouped archive rails / typographic pulse markers",
    cue: "Series pulse map",
    focusSeries: canonicalRailSeriesOrder.slice(0, 7),
    accent: "#c28f61",
    variantKey: "ver6",
    motionGrammar: "series-pulse",
    laneGapRem: 2.9,
    rowGapRem: 1.32,
    tileWidthRem: 8.05,
    viewportHeightRem: 14.8,
    baseDuration: 37,
    durationStep: 2.8,
    repeatCopies: 2,
    gapMode: "series",
    captionMode: "ledger",
  },
  {
    slug: "ver7",
    presentation: "rail-study",
    eyebrow: "ver7",
    title: "Deep Shelf Parallax",
    note: "앞뒤 layer를 blur 없이 분리해 shelf depth를 만드는 안. 이미지보다 캡션과 rail 사이 공기가 먼저 입체감을 만든다.",
    layout: "duplexSlow",
    span: "420dvh",
    reference: "parallax marquee shelves / layered editorial gallery",
    cue: "Shelf depth drift",
    focusSeries: canonicalRailSeriesOrder.slice(1, 8),
    accent: "#d2a580",
    variantKey: "ver7",
    motionGrammar: "deep-parallax",
    laneGapRem: 0.35,
    rowGapRem: 0,
    tileWidthRem: 7.8,
    viewportHeightRem: 10.25,
    baseDuration: 42,
    durationStep: 2.2,
    repeatCopies: 2,
    gapMode: "chapters",
    captionMode: "ledger",
  },
  {
    slug: "ver8",
    presentation: "rail-study",
    eyebrow: "ver8",
    title: "Split Tempo Bands",
    note: "상단 band는 길게, 하단 band는 촘촘하게. 전체 질서를 깨지 않고도 다른 시간대가 공존하는 안이다.",
    layout: "duplexSlow",
    span: "300dvh",
    reference: "multi-band tempo split / quiet runway pacing",
    cue: "Upper slow / lower fast",
    focusSeries: canonicalRailSeriesOrder.slice(0, 6),
    accent: "#b88254",
    variantKey: "ver8",
    motionGrammar: "split-tempo",
    laneGapRem: 3.15,
    rowGapRem: 1.38,
    tileWidthRem: 8.2,
    viewportHeightRem: 14.9,
    baseDuration: 44,
    durationStep: 1.6,
    repeatCopies: 3,
    gapMode: "chapters",
    captionMode: "plain",
  },
  {
    slug: "ver9",
    presentation: "rail-study",
    eyebrow: "ver9",
    title: "Seam Chorus",
    note: "복제 seam을 숨기는 대신 행마다 다른 phase로 맞물리게 해 chorus처럼 읽히게 만든 안이다.",
    layout: "duplexSlow",
    span: "310dvh",
    reference: "seam-safe choreography / chorus phase crossings",
    cue: "Invisible seam chorus",
    focusSeries: canonicalRailSeriesOrder.slice(2, 8),
    accent: "#ce9365",
    variantKey: "ver9",
    motionGrammar: "seam-chorus",
    laneGapRem: 3.25,
    rowGapRem: 1.44,
    tileWidthRem: 8.35,
    viewportHeightRem: 15.2,
    baseDuration: 35,
    durationStep: 1.9,
    repeatCopies: 3,
    gapMode: "runway",
    captionMode: "wave",
  },
  {
    slug: "ver10",
    presentation: "rail-study",
    eyebrow: "ver10",
    title: "Finale Archive Runway",
    note: "텍스타일 아카이브가 fashion runway처럼 읽히는 최종안. rail 사이 typographic curtain과 chapter marker를 함께 쓴다.",
    layout: "duplexSlow",
    span: "320dvh",
    reference: "archive runway / Codrops sequence / typographic curtain",
    cue: "Runway curtain finale",
    focusSeries: canonicalRailSeriesOrder,
    accent: "#d28f59",
    variantKey: "ver10",
    motionGrammar: "archive-runway",
    laneGapRem: 3.12,
    rowGapRem: 1.46,
    tileWidthRem: 8.28,
    viewportHeightRem: 15.3,
    baseDuration: 39,
    durationStep: 1.7,
    repeatCopies: 3,
    gapMode: "runway",
    captionMode: "runway",
  },
  {
    slug: "ver11",
    presentation: "rail-study",
    eyebrow: "ver11",
    title: "Rail Glide Cant",
    note: "runway finale를 측면 cant 리듬으로 풀어낸 연장안. rail 전체 흐름은 유지하되 첫 진입의 diagonal 성격만 더 강하다.",
    layout: "duplexSlow",
    span: "306dvh",
    reference: "editorial cant / angled runway rails",
    cue: "Angled cant relay",
    focusSeries: canonicalRailSeriesOrder,
    accent: "#bf8556",
    variantKey: "ver11",
    motionGrammar: "rail-glide-cant",
    laneGapRem: 3.02,
    rowGapRem: 1.38,
    tileWidthRem: 8.18,
    viewportHeightRem: 15.05,
    baseDuration: 40,
    durationStep: 1.55,
    repeatCopies: 3,
    gapMode: "runway",
    captionMode: "plain",
  },
  {
    slug: "ver12",
    presentation: "rail-study",
    eyebrow: "ver12",
    title: "Curator Dip Arc",
    note: "중앙 inspection beat를 만드는 curator cut. 중간 구간에서만 읽기 시간이 짧게 열리고 나머지는 runway pacing을 유지한다.",
    layout: "duplexSlow",
    span: "300dvh",
    reference: "inspection beat / exhibition panel pacing",
    cue: "Inspection beat arc",
    focusSeries: canonicalRailSeriesOrder,
    accent: "#cf9666",
    variantKey: "ver12",
    motionGrammar: "curator-dip-arc",
    laneGapRem: 2.94,
    rowGapRem: 1.34,
    tileWidthRem: 8.12,
    viewportHeightRem: 14.95,
    baseDuration: 41,
    durationStep: 1.48,
    repeatCopies: 3,
    gapMode: "runway",
    captionMode: "plain",
  },
  {
    slug: "ver13",
    presentation: "rail-study",
    eyebrow: "ver13",
    title: "Torsion S-Curve",
    note: "S-curve처럼 좌우 무게중심만 이동하는 study. rail 자체는 평면 archive로 유지하고, 밀고 당기는 인상만 남긴다.",
    layout: "duplexSlow",
    span: "308dvh",
    reference: "signed pacing curve / cross-center runway",
    cue: "Cross-center pacing curve",
    focusSeries: canonicalRailSeriesOrder,
    accent: "#c47f56",
    variantKey: "ver13",
    motionGrammar: "torsion-s-curve",
    laneGapRem: 3.08,
    rowGapRem: 1.41,
    tileWidthRem: 8.24,
    viewportHeightRem: 15.1,
    baseDuration: 40,
    durationStep: 1.62,
    repeatCopies: 3,
    gapMode: "runway",
    captionMode: "plain",
  },
  {
    slug: "ver14",
    presentation: "rail-study",
    eyebrow: "ver14",
    title: "Compression Hover Lock",
    note: "초반 압축, 중간 hold, 후반 release가 분명한 close-out study. finale의 정리감을 가장 오래 유지한다.",
    layout: "duplexSlow",
    span: "296dvh",
    reference: "compression / hover pause / runway release",
    cue: "Compression hold release",
    focusSeries: canonicalRailSeriesOrder,
    accent: "#b87445",
    variantKey: "ver14",
    motionGrammar: "compression-hover-lock",
    laneGapRem: 2.9,
    rowGapRem: 1.32,
    tileWidthRem: 8.06,
    viewportHeightRem: 14.82,
    baseDuration: 42,
    durationStep: 1.42,
    repeatCopies: 3,
    gapMode: "runway",
    captionMode: "plain",
  },
  {
    slug: "orbital-inspection-board",
    presentation: "3d-uiux-lab",
    eyebrow: "Archived Draft / 01",
    title: "Orbital Inspection Board",
    note: "한 장의 보드가 좌우 orbit를 그리며 접근했다가, 중간 inspection pose에서 원단을 가장 또렷하게 읽히게 한다.",
    layout: "duplexSlow",
    span: "268dvh",
    reference: "Spline scroll object orbit / KOJI inspection product motion",
    cue: "Orbit, inspect, release",
    focusSeries: canonicalRailSeriesOrder,
    accent: "#c68458",
    variantKey: "orbital-inspection-board",
    motionGrammar: "orbital-inspection",
    laneGapRem: 0.42,
    rowGapRem: 0.18,
    tileWidthRem: 8.2,
    viewportHeightRem: 14.55,
    baseDuration: 43,
    durationStep: 1.3,
    repeatCopies: 3,
    gapMode: "runway",
    captionMode: "plain",
  },
  {
    slug: "hinge-gallery-wall",
    presentation: "3d-uiux-lab",
    eyebrow: "Archived Draft / 02",
    title: "Hinge Gallery Wall",
    note: "좌상단 힌지를 축으로 전시 벽이 열리고 닫히듯 움직이는 scene. 외곽 silhouette만 깊이를 만들고 fabric plane은 비워둔다.",
    layout: "duplexSlow",
    span: "210dvh",
    reference: "Spline hinged exhibit panel / museum wall opening",
    cue: "Hinged reveal wall",
    focusSeries: canonicalRailSeriesOrder,
    accent: "#cda06f",
    variantKey: "hinge-gallery-wall",
    motionGrammar: "hinge-gallery",
    laneGapRem: 0.4,
    rowGapRem: 0.16,
    tileWidthRem: 8.12,
    viewportHeightRem: 14.4,
    baseDuration: 44,
    durationStep: 1.2,
    repeatCopies: 3,
    gapMode: "runway",
    captionMode: "plain",
  },
  {
    slug: "depth-runway-stack",
    presentation: "3d-uiux-lab",
    eyebrow: "Archived Draft / 03",
    title: "Depth Runway Stack",
    note: "여러 rail을 하나의 slab 안 층처럼 보이게 하고, curved runway path를 따라 compression과 release를 분명히 읽히게 한다.",
    layout: "duplexSlow",
    span: "230dvh",
    reference: "Codrops 3D panel path / layered product slab runway",
    cue: "Compressed slab runway",
    focusSeries: canonicalRailSeriesOrder,
    accent: "#b56c43",
    variantKey: "depth-runway-stack",
    motionGrammar: "depth-runway",
    laneGapRem: 0.34,
    rowGapRem: 0.14,
    tileWidthRem: 8.06,
    viewportHeightRem: 14.28,
    baseDuration: 45,
    durationStep: 1.1,
    repeatCopies: 3,
    gapMode: "runway",
    captionMode: "plain",
  },
  {
    slug: "light-table-cascade",
    presentation: "3d-uiux-lab",
    eyebrow: "Archived Draft / 04",
    title: "Light Table Cascade",
    note: "회전은 얕게 유지하고 빛의 sweep, soft parallax, shallow lift만으로 전시 테이블처럼 감각을 만든다.",
    layout: "duplexSlow",
    span: "205dvh",
    reference: "light-table editorial sweep / restrained product display",
    cue: "Soft lift with moving light",
    focusSeries: canonicalRailSeriesOrder,
    accent: "#d7b48c",
    variantKey: "light-table-cascade",
    motionGrammar: "light-table",
    laneGapRem: 0.48,
    rowGapRem: 0.2,
    tileWidthRem: 8.26,
    viewportHeightRem: 14.7,
    baseDuration: 46,
    durationStep: 1,
    repeatCopies: 3,
    gapMode: "runway",
    captionMode: "plain",
  },
  {
    slug: "ending-credits-crawl",
    presentation: "3d-research-lab",
    eyebrow: "3D Research / 01",
    title: "Ending Credits Crawl",
    note: "단일 strip이 소실점으로 멀어지는 크롤 장면. 여러 rail을 쓰지 않고 하나의 궤도만 유지한다.",
    layout: "duplexSlow",
    span: "215dvh",
    reference: "Spline object-first scroll + cinematic crawl perspective",
    cue: "Single crawl strip",
    focusSeries: canonicalRailSeriesOrder,
    accent: "#b15f43",
    variantKey: "ending-credits-crawl",
    motionGrammar: "ending-credits",
    laneGapRem: 0.3,
    rowGapRem: 0.16,
    tileWidthRem: 8.4,
    viewportHeightRem: 14.7,
    baseDuration: 43,
    durationStep: 1,
    repeatCopies: 2,
    gapMode: "runway",
    captionMode: "plain",
  },
  {
    slug: "isometric-fabric-atlas",
    presentation: "3d-research-lab",
    eyebrow: "3D Research / 02",
    title: "Isometric Fabric Atlas",
    note: "원단을 isometric atlas plane으로 재배치한 장면. 행이 아니라 지도처럼 보이도록 한다.",
    layout: "duplexSlow",
    span: "210dvh",
    reference: "Isometric card atlas / scroll-led board orbit",
    cue: "Isometric grid atlas",
    focusSeries: canonicalRailSeriesOrder,
    accent: "#8b7dbd",
    variantKey: "isometric-fabric-atlas",
    motionGrammar: "isometric-atlas",
    laneGapRem: 0.28,
    rowGapRem: 0.14,
    tileWidthRem: 8.1,
    viewportHeightRem: 14.2,
    baseDuration: 42,
    durationStep: 1,
    repeatCopies: 2,
    gapMode: "runway",
    captionMode: "plain",
  },
  {
    slug: "hinged-specimen-book",
    presentation: "3d-research-lab",
    eyebrow: "3D Research / 03",
    title: "Hinged Specimen Book",
    note: "표본북이 접히고 펼쳐지는 방식으로 원단을 보여주는 장면. page spread 단위로 읽히게 한다.",
    layout: "duplexSlow",
    span: "225dvh",
    reference: "Product specimen book / page-turn inspection",
    cue: "Hinged page spreads",
    focusSeries: canonicalRailSeriesOrder,
    accent: "#997553",
    variantKey: "hinged-specimen-book",
    motionGrammar: "hinged-book",
    laneGapRem: 0.3,
    rowGapRem: 0.16,
    tileWidthRem: 8.2,
    viewportHeightRem: 14.5,
    baseDuration: 45,
    durationStep: 1,
    repeatCopies: 2,
    gapMode: "runway",
    captionMode: "plain",
  },
  {
    slug: "curved-ribbon-tunnel",
    presentation: "3d-research-lab",
    eyebrow: "3D Research / 04",
    title: "Curved Ribbon Tunnel",
    note: "카드가 곡선 ribbon path를 따라 말려 들어가는 장면. 직선 rail 구조를 완전히 벗어난다.",
    layout: "duplexSlow",
    span: "235dvh",
    reference: "Curved ribbon camera path / tunnel sequencing",
    cue: "Curved tunnel ribbon",
    focusSeries: canonicalRailSeriesOrder,
    accent: "#4775aa",
    variantKey: "curved-ribbon-tunnel",
    motionGrammar: "ribbon-tunnel",
    laneGapRem: 0.3,
    rowGapRem: 0.16,
    tileWidthRem: 8.06,
    viewportHeightRem: 14.3,
    baseDuration: 44,
    durationStep: 1,
    repeatCopies: 2,
    gapMode: "runway",
    captionMode: "plain",
  },
  {
    slug: "floating-archive-columns",
    presentation: "3d-research-lab",
    eyebrow: "3D Research / 05",
    title: "Floating Archive Columns",
    note: "세로 column들이 서로 다른 depth plane에서 교차하며 움직이는 장면. 벽면과 선반의 중간 문법이다.",
    layout: "duplexSlow",
    span: "220dvh",
    reference: "Floating gallery columns / layered depth planes",
    cue: "Crossing archive columns",
    focusSeries: canonicalRailSeriesOrder,
    accent: "#4f8f83",
    variantKey: "floating-archive-columns",
    motionGrammar: "floating-columns",
    laneGapRem: 0.28,
    rowGapRem: 0.16,
    tileWidthRem: 8.12,
    viewportHeightRem: 14.4,
    baseDuration: 43,
    durationStep: 1,
    repeatCopies: 2,
    gapMode: "runway",
    captionMode: "plain",
  },
];

function tilesForGroup(groupKey: string) {
  return groupedFrames.get(groupKey) ?? [];
}

function repeatFrames<T extends FabricFrame>(items: T[], copies = 2): Array<T & { repeatKey: string }> {
  return Array.from({ length: copies }, (_, copyIndex) =>
    items.map((item, itemIndex) => ({
      ...item,
      repeatKey: `${item.src}-${copyIndex}-${itemIndex}`,
    })),
  ).flat();
}

function rotateItems<T>(items: T[], offset: number) {
  if (items.length === 0) {
    return [];
  }

  const normalizedOffset = ((offset % items.length) + items.length) % items.length;
  return [...items.slice(normalizedOffset), ...items.slice(0, normalizedOffset)];
}

const productRailItems = [...canonicalRailItems].sort((left, right) => left.name.localeCompare(right.name));
const productRailLaneCount = 8;
const productVer7StartOffset = 7;
const productVer7VisibleColumnCount = 11;
const productVer7RowRoles: ProductVer7RowRole[] = [
  "upper-far",
  "upper-mid",
  "upper-near",
  "center",
  "lower-near",
  "lower-mid",
  "lower-far",
];

function splitProductRailLanes(items: FamilyZonesThreeRailItem[], laneCount: number) {
  const lanes: FamilyZonesThreeRailItem[][] = [];
  let cursor = 0;

  for (let laneIndex = 0; laneIndex < laneCount; laneIndex += 1) {
    const remainingItems = items.length - cursor;
    const remainingLanes = laneCount - laneIndex;
    const takeCount = remainingLanes <= 1 ? remainingItems : Math.ceil(remainingItems / remainingLanes);
    lanes.push(items.slice(cursor, cursor + takeCount));
    cursor += takeCount;
  }

  return lanes;
}

const productRailBaseLanes = splitProductRailLanes(productRailItems, productRailLaneCount);
const productRailLanesByCopies = new Map(
  ([2, 3] as const).map((copies) => [
    copies,
    productRailBaseLanes.map((lane) => repeatFrames(lane, copies)),
  ]),
);
const depthRunwayPerspectiveItems = rotateItems(productRailItems, 9).slice(0, 9);
const researchCrawlItems = rotateItems(productRailItems, 5).slice(0, 10);
const researchAtlasItems = rotateItems(productRailItems, 11).slice(0, 12);
const researchBookItems = rotateItems(productRailItems, 17).slice(0, 8);
const researchRibbonItems = rotateItems(productRailItems, 23).slice(0, 10);
const researchColumnItems = rotateItems(productRailItems, 31).slice(0, 12);

function buildProductVer7Rows(items: FamilyZonesThreeRailItem[]): ProductVer7Row[] {
  const rotatedItems = rotateItems(items, productVer7StartOffset);
  const fabricRows = productVer7RowRoles.map((role, rowIndex) => {
    const rowItems = rotateItems(rotatedItems, rowIndex * productVer7VisibleColumnCount).slice(
      0,
      productVer7VisibleColumnCount,
    );

    return {
      role,
      kind: "fabric" as const,
      fabricCells: rowItems.map((item, cellIndex) => ({
        ...item,
        cellKey: `${role}-${item.src}-${cellIndex}`,
      })),
      textCells: [],
    };
  });

  const ctaLabels = Array.from({ length: productVer7VisibleColumnCount }, (_, cellIndex) => ({
    cellKey: `cta-${cellIndex}`,
    label: cellIndex % 2 === 0 ? "View More" : "Contact Us",
  }));

  return [
    ...fabricRows,
    {
      role: "cta",
      kind: "cta",
      fabricCells: [],
      textCells: ctaLabels,
    },
  ];
}

const productVer7Rows = buildProductVer7Rows(productRailItems);
const baselineRailStudyDefinitions = railStudyDefinitions.filter(
  (study) => study.presentation === "rail-study",
);
const threeDimensionalLabDefinitions = railStudyDefinitions.filter(
  (study) => study.presentation === "3d-uiux-lab",
);
const researchLabDefinitions = railStudyDefinitions.filter(
  (study) => study.presentation === "3d-research-lab",
);
const productLabRailStudies = railStudyDefinitions.filter((study) => study.variantKey === "ver7");
const productLabVer12Studies = railStudyDefinitions.filter(
  (study) => study.variantKey === "ver1" || study.variantKey === "ver2",
);

function productRailInterRailText(study: RailStudyDefinition, laneIndex: number) {
  const lane = productRailBaseLanes[laneIndex];
  const nextLane = productRailBaseLanes[(laneIndex + 1) % productRailBaseLanes.length];
  const names = lane.slice(0, 4).map((item) => item.name.replaceAll("_", " "));
  const seriesLabels = Array.from(new Set(lane.map((item) => labelFromGroup(item.seriesKey)))).slice(0, 3);
  const nextSeriesLabels = Array.from(new Set(nextLane.map((item) => labelFromGroup(item.seriesKey)))).slice(0, 2);

  switch (study.gapMode) {
    case "series":
      return [...seriesLabels, ...nextSeriesLabels].join(" / ");
    case "chapters":
      return [`${study.eyebrow}`, ...seriesLabels].join(" / ");
    case "runway":
      return [study.title, ...seriesLabels, ...nextSeriesLabels].join(" / ");
    case "names":
    default:
      return names.join(" / ");
  }
}

function productRailMarkerText(study: RailStudyDefinition) {
  const seriesLabels = study.focusSeries.map((seriesKey) => labelFromGroup(seriesKey)).slice(0, 4);
  return [study.eyebrow.toUpperCase(), ...seriesLabels].join(" / ");
}

function isThreeDimensionalLabVariant(
  variant?: ProductRailVariant,
): variant is (typeof threeDimensionalLabVariantKeys)[number] {
  return Boolean(
    variant && threeDimensionalLabVariantKeys.includes(variant as (typeof threeDimensionalLabVariantKeys)[number]),
  );
}

function isResearchLabVariant(
  variant?: ProductRailVariant,
): variant is (typeof researchLabVariantKeys)[number] {
  return Boolean(
    variant && researchLabVariantKeys.includes(variant as (typeof researchLabVariantKeys)[number]),
  );
}

function isAnyThreeDimensionalVariant(
  variant?: ProductRailVariant,
): variant is (typeof threeDimensionalLabVariantKeys)[number] | (typeof researchLabVariantKeys)[number] {
  return isThreeDimensionalLabVariant(variant) || isResearchLabVariant(variant);
}

function isOrbitalInspectionVariant(variant?: ProductRailVariant) {
  return variant === "orbital-inspection-board";
}

function isOrbitalStudyChromeStripped(config?: OrbitalResolvedConfig | null) {
  return Boolean(config && !config.layers.studyChrome);
}

function isOrbitalSceneChromeStripped(config?: OrbitalResolvedConfig | null) {
  return Boolean(config && !config.layers.sceneChrome);
}

function orbitalConfigPayload(config?: OrbitalResolvedConfig | null) {
  if (!config) {
    return "";
  }

  return JSON.stringify(config);
}

function readOrbitalConfigFromNode(studyNode: HTMLElement) {
  const raw = studyNode.dataset.orbitalConfig;
  if (!raw) {
    return resolveOrbitalInspectionConfig("orbitalPreset=baseline");
  }

  const cached = orbitalConfigCache.get(studyNode);
  if (cached && cached.raw === raw) {
    return cached.config;
  }

  const parsed = JSON.parse(raw) as OrbitalResolvedConfig;
  orbitalConfigCache.set(studyNode, { raw, config: parsed });
  return parsed;
}

type ThreeDimensionalProfile = {
  yaw: number;
  pitch: number;
  bank: number;
  lateral: number;
  vertical: number;
  depth: number;
  scale: number;
  aura: number;
  sheen: number;
  floor: number;
  laneDepth: number;
  laneYaw: number;
  lanePitch: number;
  laneLift: number;
  laneSpread: number;
};

function orbitalInspectionBaseProfile(progress: number, motion: OrbitalMotionConfig): ThreeDimensionalProfile {
  const leftGrip = smoothStep(windowProgress(progress, 0, 0.28));
  const inspect = Math.sin(Math.PI * windowProgress(progress, 0.18, 0.78));
  const rightSwing = smoothStep(windowProgress(progress, 0.42, 0.86));
  const settle = smoothStep(windowProgress(progress, motion.settleStart, 1));
  const yawBeforeSettle = -52 + leftGrip * 24 + rightSwing * motion.rightSwingYaw;
  const pitchBeforeSettle = 20 - leftGrip * 8 - inspect * 10 + rightSwing * motion.rightSwingPitch;
  const bankBeforeSettle = -14 + leftGrip * 8 + rightSwing * motion.rightSwingBank;
  const lateralBeforeSettle = -6.6 + leftGrip * 3.1 + rightSwing * motion.rightSwingLateral;
  const verticalBeforeSettle = 2.8 - leftGrip * 1.2 - inspect * 1.6;
  const depthBeforeSettle = -14 + inspect * 11;
  const scaleBeforeSettle = 0.92 + inspect * 0.11;

  return {
    yaw: mix(yawBeforeSettle, motion.endYaw, settle),
    pitch: mix(pitchBeforeSettle, motion.endPitch, settle),
    bank: mix(bankBeforeSettle, motion.endBank, settle),
    lateral: mix(lateralBeforeSettle, motion.endLateral, settle),
    vertical: mix(verticalBeforeSettle, motion.endVertical, settle),
    depth: mix(depthBeforeSettle, motion.endDepth, settle),
    scale: mix(scaleBeforeSettle, motion.endScale, settle),
    aura: motion.auraBase + inspect * motion.auraInspect,
    sheen: motion.sheenBase + inspect * motion.sheenInspect,
    floor: motion.floor,
    laneDepth: motion.laneDepth,
    laneYaw: motion.laneYaw,
    lanePitch: motion.lanePitch,
    laneLift: motion.laneLift,
    laneSpread: motion.laneSpread,
  };
}

function composeOrbitalInspectionProfile(
  progress: number,
  orbitalConfig?: OrbitalResolvedConfig,
): ThreeDimensionalProfile {
  const resolved = orbitalConfig ?? createOrbitalResolvedConfig();
  const base = orbitalInspectionBaseProfile(progress, resolved.motion);
  const family = resolved.familyTuning;
  const inspect = Math.sin(Math.PI * windowProgress(progress, 0.14, 0.84));
  const release = smoothStep(windowProgress(progress, 0.54, 0.9));
  const settle = smoothStep(windowProgress(progress, resolved.motion.settleStart, 1));
  const finale = smoothStep(windowProgress(progress, 0.68, 1)) * family.finaleBias;
  const torsionWave = Math.sin(Math.PI * windowProgress(progress, 0.12, 0.72)) * family.torsion;
  const driftWave = Math.sin(progress * Math.PI * 2 - Math.PI / 2) * family.drift;
  const sweepWave = Math.sin(Math.PI * windowProgress(progress, 0.08, 0.92)) * family.lightSweep;

  switch (resolved.familyKey) {
    case "torsion-reveal":
      return {
        ...base,
        yaw: base.yaw + torsionWave * 14 - settle * 4,
        pitch: base.pitch - torsionWave * 9,
        bank: base.bank + torsionWave * 28,
        lateral: base.lateral + driftWave * 2.8,
        vertical: base.vertical - torsionWave * 1.4,
        depth: base.depth - torsionWave * 4.6,
        aura: base.aura + sweepWave * 0.14,
        sheen: base.sheen + sweepWave * 0.14,
        laneDepth: base.laneDepth + family.torsion * 1.2,
        laneYaw: base.laneYaw + family.torsion * 8.4,
        lanePitch: base.lanePitch + family.torsion * 5.2,
        laneLift: base.laneLift + family.lift * 0.42,
        laneSpread: base.laneSpread + family.drift * 0.36,
      };
    case "apex-lift-finale":
      return {
        ...base,
        yaw: base.yaw + release * 6 + finale * 14,
        pitch: base.pitch - release * 3.6 + finale * 18,
        bank: base.bank - release * 5.4 - finale * 24,
        lateral: base.lateral + driftWave * 2 + finale * 3.8,
        vertical: base.vertical - family.lift * 0.9 - finale * 4.8,
        depth: base.depth - family.lift * 3.8 - finale * 8.2,
        scale: base.scale - finale * 0.08,
        aura: base.aura + finale * 0.14,
        sheen: base.sheen + sweepWave * 0.08 + finale * 0.08,
        floor: Math.max(0, base.floor - finale * 0.12),
        laneDepth: base.laneDepth + family.lift * 0.56,
        laneYaw: base.laneYaw + family.finaleBias * 2.8,
        lanePitch: base.lanePitch + family.lift * 4.2,
        laneLift: base.laneLift + family.lift * 1.4,
        laneSpread: base.laneSpread + family.finaleBias * 0.42,
      };
    case "parallax-shear":
      return {
        ...base,
        yaw: mix(base.yaw, base.yaw * 0.42 + driftWave * 18, 0.82),
        pitch: base.pitch + driftWave * 4.4,
        bank: base.bank + driftWave * 12,
        lateral: base.lateral + driftWave * 6.4 + inspect * 1.4,
        vertical: base.vertical - inspect * 0.8,
        depth: base.depth - family.drift * 3.4 + inspect * 2.2,
        aura: base.aura + sweepWave * 0.06,
        sheen: base.sheen + family.lightSweep * 0.08 + inspect * 0.08,
        laneDepth: base.laneDepth + family.drift * 0.82,
        laneYaw: base.laneYaw + family.drift * 5.2,
        lanePitch: base.lanePitch + family.torsion * 2.6,
        laneLift: base.laneLift + family.drift * 0.42,
        laneSpread: base.laneSpread + family.drift * 1.6,
      };
    case "halo-scan":
      return {
        ...base,
        yaw: base.yaw + driftWave * 5.2,
        pitch: base.pitch - inspect * 1.8,
        bank: base.bank + driftWave * 4.6,
        lateral: base.lateral + driftWave * 2.2,
        depth: base.depth - family.lightSweep * 1.8,
        aura: base.aura + 0.14 + sweepWave * 0.34,
        sheen: base.sheen + 0.24 + sweepWave * 0.4,
        floor: base.floor + family.lightSweep * 0.1,
        laneDepth: base.laneDepth + family.torsion * 0.22,
        laneYaw: base.laneYaw + family.drift * 1.2,
        lanePitch: base.lanePitch + family.torsion * 1.2,
        laneLift: base.laneLift + family.lift * 0.18,
        laneSpread: base.laneSpread + family.drift * 0.22,
      };
    case "hero-orbit-drift":
    default:
      return {
        ...base,
        yaw: base.yaw + driftWave * 9.2,
        pitch: base.pitch - inspect * 1.2 + finale * 4.2,
        bank: base.bank + driftWave * 6.4 - finale * 3.2,
        lateral: base.lateral + driftWave * 3.2,
        vertical: base.vertical - family.lift * 0.34 - inspect * 0.2,
        depth: base.depth - family.drift * 1.6 - finale * 2.8,
        aura: base.aura + sweepWave * 0.12 + inspect * 0.06,
        sheen: base.sheen + sweepWave * 0.18,
        laneDepth: base.laneDepth + family.torsion * 0.24,
        laneYaw: base.laneYaw + family.drift * 1.4,
        lanePitch: base.lanePitch + family.lift * 1.2,
        laneLift: base.laneLift + family.lift * 0.24,
        laneSpread: base.laneSpread + family.drift * 0.22,
      };
  }
}

function threeDimensionalLabMotionProfile(
  variant: (typeof threeDimensionalLabVariantKeys)[number],
  progress: number,
  orbitalConfig?: OrbitalResolvedConfig,
) {
  switch (variant) {
    case "orbital-inspection-board": {
      return composeOrbitalInspectionProfile(progress, orbitalConfig);
    }
    case "hinge-gallery-wall": {
      const open = smoothStep(windowProgress(progress, 0.02, 0.32));
      const overOpen = smoothStep(windowProgress(progress, 0.24, 0.62));
      const inspect = Math.sin(Math.PI * windowProgress(progress, 0.34, 0.8));
      const settle = smoothStep(windowProgress(progress, 0.78, 1));
      return {
        yaw: -64 + open * 36 + overOpen * 18 - settle * 26,
        pitch: 28 - open * 16 - inspect * 6 + settle * 3,
        bank: 12 - open * 10 - overOpen * 6 + settle * 4,
        lateral: -4.8 + open * 3.4 + overOpen * 2.6 - settle * 2.4,
        vertical: 3.4 - open * 2.6 - inspect * 0.9,
        depth: -18 + open * 10 + inspect * 5 - settle * 6,
        scale: 0.9 + open * 0.06 + inspect * 0.04,
        aura: 0.44 + open * 0.32,
        sheen: 0.16 + inspect * 0.48,
        floor: 0.34 + inspect * 0.16,
        laneDepth: 0.78,
        laneYaw: 4.4,
        lanePitch: 3.4,
        laneLift: 0.52,
        laneSpread: 0.36,
      };
    }
    case "depth-runway-stack": {
      const leftAngle = smoothStep(windowProgress(progress, 0, 0.24));
      const dive = Math.sin(Math.PI * windowProgress(progress, 0.16, 0.66));
      const rightAngle = smoothStep(windowProgress(progress, 0.48, 0.9));
      const settle = smoothStep(windowProgress(progress, 0.82, 1));
      return {
        yaw: -12 + leftAngle * 6 + rightAngle * 10 - settle * 8,
        pitch: 6 - leftAngle * 2 - dive * 4 + rightAngle * 1.5,
        bank: -3 + leftAngle * 2 + rightAngle * 4 - settle * 3,
        lateral: -2.4 + leftAngle * 1.2 + rightAngle * 3.4 - settle * 2,
        vertical: 0.8 - leftAngle * 0.2 - dive * 0.8 + rightAngle * 0.2,
        depth: -2 + dive * 4.2 - settle * 5.4,
        scale: 0.985 + dive * 0.03,
        aura: 0.52 + dive * 0.22,
        sheen: 0.22 + dive * 0.4,
        floor: 0.22 + dive * 0.1,
        laneDepth: 0.18,
        laneYaw: 1.2,
        lanePitch: 0.8,
        laneLift: 0.08,
        laneSpread: 0.04,
      };
    }
    case "light-table-cascade":
    default: {
      const reveal = smoothStep(windowProgress(progress, 0, 0.28));
      const sweep = Math.sin(Math.PI * windowProgress(progress, 0.12, 0.9));
      const pivot = smoothStep(windowProgress(progress, 0.38, 0.74));
      const settle = smoothStep(windowProgress(progress, 0.78, 1));
      return {
        yaw: -16 + reveal * 10 + pivot * 14 - settle * 11,
        pitch: 10 - reveal * 5 - sweep * 4 + pivot * 1.5,
        bank: -6 + reveal * 4 + pivot * 7 - settle * 5,
        lateral: -2.6 + reveal * 1.3 + pivot * 2.8 - settle * 1.8,
        vertical: 1.4 - reveal * 0.5 - sweep * 0.8,
        depth: -4 + sweep * 5.8 - settle * 2,
        scale: 0.97 + sweep * 0.04,
        aura: 0.36 + sweep * 0.18,
        sheen: 0.46 + sweep * 0.44,
        floor: 0.16 + sweep * 0.08,
        laneDepth: 0.42,
        laneYaw: 2.8,
        lanePitch: 2.2,
        laneLift: 0.2,
        laneSpread: 0.12,
      };
    }
  }
}

function researchLabMotionProfile(
  variant: (typeof researchLabVariantKeys)[number],
  progress: number,
) {
  switch (variant) {
    case "ending-credits-crawl": {
      const reveal = smoothStep(windowProgress(progress, 0.02, 0.28));
      const inspect = Math.sin(Math.PI * windowProgress(progress, 0.24, 0.82));
      const settle = smoothStep(windowProgress(progress, 0.82, 1));
      return {
        yaw: -10 + reveal * 6 - settle * 4,
        pitch: 30 - reveal * 8 - inspect * 5 + settle * 3,
        bank: -18 + reveal * 10 + inspect * 4 - settle * 5,
        lateral: -3.8 + reveal * 2.4 + inspect * 1.4,
        vertical: 3.2 - reveal * 1.8 - inspect * 0.6,
        depth: -8 + inspect * 10 - settle * 4,
        scale: 0.92 + inspect * 0.12,
        aura: 0.42 + inspect * 0.2,
        sheen: 0.18 + inspect * 0.28,
        floor: 0.1,
        laneDepth: 0,
        laneYaw: 0,
        lanePitch: 0,
        laneLift: 0,
        laneSpread: 0,
      };
    }
    case "isometric-fabric-atlas": {
      const reveal = smoothStep(windowProgress(progress, 0.04, 0.3));
      const orbit = Math.sin(Math.PI * windowProgress(progress, 0.2, 0.82));
      const settle = smoothStep(windowProgress(progress, 0.78, 1));
      return {
        yaw: -34 + reveal * 16 + orbit * 8 - settle * 10,
        pitch: 42 - reveal * 10 - orbit * 5 + settle * 4,
        bank: -18 + reveal * 8 + orbit * 10 - settle * 8,
        lateral: -2.2 + reveal * 1.2 + orbit * 2,
        vertical: 2.4 - reveal * 1.2 - orbit * 0.8,
        depth: -10 + orbit * 8 - settle * 3,
        scale: 0.9 + orbit * 0.08,
        aura: 0.34 + orbit * 0.18,
        sheen: 0.22 + orbit * 0.2,
        floor: 0.08,
        laneDepth: 0,
        laneYaw: 0,
        lanePitch: 0,
        laneLift: 0,
        laneSpread: 0,
      };
    }
    case "hinged-specimen-book": {
      const open = smoothStep(windowProgress(progress, 0.02, 0.34));
      const read = Math.sin(Math.PI * windowProgress(progress, 0.28, 0.78));
      const settle = smoothStep(windowProgress(progress, 0.82, 1));
      return {
        yaw: -18 + open * 14 + read * 6 - settle * 8,
        pitch: 14 - open * 3 - read * 5 + settle * 1,
        bank: -6 + open * 5 - read * 2,
        lateral: -2.4 + open * 1.4 + read * 0.8,
        vertical: 1.4 - open * 0.5 - read * 0.5,
        depth: -6 + read * 8 - settle * 3,
        scale: 0.95 + read * 0.07,
        aura: 0.28 + read * 0.22,
        sheen: 0.18 + read * 0.26,
        floor: 0.08,
        laneDepth: 0,
        laneYaw: 0,
        lanePitch: 0,
        laneLift: 0,
        laneSpread: 0,
      };
    }
    case "curved-ribbon-tunnel": {
      const reveal = smoothStep(windowProgress(progress, 0.04, 0.32));
      const dive = Math.sin(Math.PI * windowProgress(progress, 0.18, 0.86));
      const settle = smoothStep(windowProgress(progress, 0.82, 1));
      return {
        yaw: -26 + reveal * 18 + dive * 12 - settle * 10,
        pitch: 18 - reveal * 4 - dive * 8 + settle * 2,
        bank: -12 + reveal * 8 + dive * 18 - settle * 10,
        lateral: -2.8 + reveal * 1.8 + dive * 2.8,
        vertical: 2 - reveal * 0.8 - dive * 0.9,
        depth: -10 + dive * 12 - settle * 4,
        scale: 0.93 + dive * 0.09,
        aura: 0.38 + dive * 0.2,
        sheen: 0.2 + dive * 0.24,
        floor: 0.08,
        laneDepth: 0,
        laneYaw: 0,
        lanePitch: 0,
        laneLift: 0,
        laneSpread: 0,
      };
    }
    case "floating-archive-columns":
    default: {
      const reveal = smoothStep(windowProgress(progress, 0.02, 0.28));
      const cross = Math.sin(Math.PI * windowProgress(progress, 0.22, 0.84));
      const settle = smoothStep(windowProgress(progress, 0.8, 1));
      return {
        yaw: -20 + reveal * 10 + cross * 8 - settle * 6,
        pitch: 10 - reveal * 2 - cross * 2,
        bank: -8 + reveal * 4 + cross * 8 - settle * 4,
        lateral: -2 + reveal * 1 + cross * 2.2,
        vertical: 1.8 - reveal * 0.5 - cross * 0.8,
        depth: -7 + cross * 7 - settle * 3,
        scale: 0.94 + cross * 0.06,
        aura: 0.32 + cross * 0.16,
        sheen: 0.18 + cross * 0.2,
        floor: 0.08,
        laneDepth: 0,
        laneYaw: 0,
        lanePitch: 0,
        laneLift: 0,
        laneSpread: 0,
      };
    }
  }
}

function variantOverlayText(study: RailStudyDefinition) {
  switch (study.variantKey) {
    case "ver4":
      return "Aperture / Sweep / Fabric / Archive";
    case "ver9":
      return "Seam / Chorus / Continuous / Archive";
    case "ver10":
      return "Runway / Archive / Chapters / Fabric";
    default:
      return "";
  }
}

function renderProductRailTrack(
  study: RailStudyDefinition,
  lane: Array<FamilyZonesThreeRailItem & { repeatKey: string }>,
  laneIndex: number,
  immersive: boolean,
  options?: {
    sectionClassName?: string;
    viewportClassName?: string;
    rigClassName?: string;
    trackClassName?: string;
  },
) {
  const isThreeDimensionalLab = isThreeDimensionalLabVariant(study.variantKey);
  const sectionClassName = options?.sectionClassName
    ? `${styles.productDuplexLane} ${options.sectionClassName}`
    : styles.productDuplexLane;
  const viewportClassName = options?.viewportClassName
    ? `${styles.productRailRowViewport} ${options.viewportClassName}`
    : styles.productRailRowViewport;
  const rigClassName = options?.rigClassName
    ? `${styles.productRailLaneRig} ${options.rigClassName}`
    : styles.productRailLaneRig;
  const trackClassName = options?.trackClassName
    ? `${styles.productRailRowTrack} ${options.trackClassName}`
    : styles.productRailRowTrack;

  return (
    <section
      className={sectionClassName}
      key={`${study.slug}-rail-${laneIndex}`}
      data-product-lane={String(laneIndex)}
    >
      <div className={viewportClassName}>
        <div
          className={rigClassName}
          data-product-lane-rig
          data-lane-center-distance="0"
          style={
            {
              "--lane-order": String(laneIndex),
            } as CSSProperties
          }
        >
          <div
            className={trackClassName}
            data-rail-study-track
            data-lane-index={String(laneIndex)}
            data-lane-direction={laneIndex % 2 === 0 ? "-1" : "1"}
            data-lane-pause={immersive ? "false" : laneIndex === Math.floor(productRailLaneCount / 2) ? "true" : "false"}
            data-caption-mode={study.captionMode}
            data-variant={study.variantKey}
            data-base-duration={String(study.baseDuration + laneIndex * study.durationStep)}
            style={
              {
                "--rail-duration": `${study.baseDuration + laneIndex * study.durationStep}s`,
                "--rail-gap": isThreeDimensionalLab ? "0.72rem" : "0.85rem",
                "--lane-order": String(laneIndex),
                "--lane-depth": laneIndex < 4 ? "1" : "1.08",
              } as CSSProperties
            }
          >
            {lane.map((item) => (
              <figure
                className={`${styles.railStudyTile} ${styles.productRailRowTile}`}
                key={`${study.slug}-${laneIndex}-${item.repeatKey}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.src}
                  alt={item.name.replaceAll("_", " ")}
                  width={900}
                  height={1200}
                  loading="lazy"
                  className={styles.railStudyImage}
                  data-product-fabric-image
                />
                <figcaption className={styles.productRailCaption}>
                  {item.name.replaceAll("_", " ")}
                </figcaption>
              </figure>
            ))}
            {immersive || isThreeDimensionalLab ? null : laneIndex === Math.floor(productRailLaneCount / 2) ? (
              <span className={styles.productDuplexPauseMarker}>View More Textures</span>
            ) : null}
          </div>
        </div>
      </div>
      {!immersive && !isThreeDimensionalLab && laneIndex < productRailBaseLanes.length - 1 ? (
        <p className={styles.productRailGapText}>
          {productRailInterRailText(study, laneIndex)}
        </p>
      ) : null}
    </section>
  );
}

function renderOrbitalContactRail() {
  return (
    <section className={`${styles.productDuplexLane} ${styles.productOrbitCtaLane}`} data-product-lane="cta">
      <a
        href="/contact"
        className={styles.productOrbitCtaLink}
        aria-label="View more products and contact us"
      >
        <div className={`${styles.productRailRowViewport} ${styles.productOrbitCtaViewport}`}>
          <div className={`${styles.productRailLaneRig} ${styles.productOrbitCtaRig}`} data-product-lane-rig>
            <div className={`${styles.productRailRowTrack} ${styles.productOrbitCtaTrack}`} data-rail-study-track>
              {Array.from({ length: 8 }, (_, itemIndex) => (
                <span className={styles.productOrbitCtaText} key={`orbital-cta-${itemIndex}`}>
                  {itemIndex % 2 === 0 ? "VIEW MORE" : "CONTACT US"}
                </span>
              ))}
            </div>
          </div>
        </div>
      </a>
    </section>
  );
}

function renderThreeDimensionalLabBoard(
  study: RailStudyDefinition,
  productRailLanes: Array<Array<FamilyZonesThreeRailItem & { repeatKey: string }>>,
  immersive: boolean,
) {
  if (study.variantKey === "hinge-gallery-wall") {
    const columns = Array.from({ length: 4 }, (_, columnIndex) =>
      productRailLanes.slice(columnIndex * 2, columnIndex * 2 + 2),
    );

    return (
      <div className={`${styles.productDuplexBoard} ${styles.productGalleryWallBoard}`} data-product-board>
        <div className={styles.productGalleryWall}>
          {columns.map((columnLanes, columnIndex) => (
            <div
              className={styles.productGalleryColumn}
              key={`${study.slug}-column-${columnIndex}`}
              style={{ "--gallery-column-order": String(columnIndex) } as CSSProperties}
            >
              {columnLanes.map((lane, laneOffset) =>
                renderProductRailTrack(study, lane, columnIndex * 2 + laneOffset, immersive, {
                  sectionClassName: styles.productGalleryShelf,
                  viewportClassName: styles.productGalleryViewport,
                  rigClassName: styles.productGalleryRig,
                  trackClassName: styles.productGalleryTrack,
                }),
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (study.variantKey === "depth-runway-stack") {
    return (
      <div className={`${styles.productDuplexBoard} ${styles.productRunwayBoard}`} data-product-board>
        <div className={styles.productRunwayPerspectiveStrip} data-runway-strip>
          {depthRunwayPerspectiveItems.map((item, itemIndex) => (
            <figure
              className={styles.productRunwayPerspectiveTile}
              key={`${study.slug}-strip-${item.src}-${itemIndex}`}
              data-runway-card
              style={{ "--perspective-order": String(itemIndex) } as CSSProperties}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.src}
                alt={item.name.replaceAll("_", " ")}
                width={900}
                height={1200}
                loading="lazy"
                className={`${styles.railStudyImage} ${styles.productRunwayPerspectiveImage}`}
              />
              <figcaption className={`${styles.productRailCaption} ${styles.productRunwayPerspectiveCaption}`}>
                {item.name.replaceAll("_", " ")}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    );
  }

  if (study.variantKey === "light-table-cascade") {
    const ribbons = Array.from({ length: 4 }, (_, ribbonIndex) =>
      productRailLanes.filter((_, laneIndex) => laneIndex % 4 === ribbonIndex),
    );

    return (
      <div className={`${styles.productDuplexBoard} ${styles.productLightTableBoard}`} data-product-board>
        <div className={styles.productLightTable}>
          {ribbons.map((ribbonLanes, ribbonIndex) => (
            <div
              className={styles.productLightRibbon}
              key={`${study.slug}-ribbon-${ribbonIndex}`}
              style={{ "--ribbon-order": String(ribbonIndex) } as CSSProperties}
            >
              {ribbonLanes.map((lane, laneOffset) =>
                renderProductRailTrack(study, lane, ribbonIndex + laneOffset * 4, immersive, {
                  sectionClassName: styles.productLightLane,
                  viewportClassName: styles.productLightViewport,
                  rigClassName: styles.productLightRig,
                  trackClassName: styles.productLightTrack,
                }),
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.productDuplexBoard} ${styles.productOrbitBoard}`} data-product-board>
      {productRailLanes.map((lane, laneIndex) => renderProductRailTrack(study, lane, laneIndex, immersive))}
      {study.variantKey === "orbital-inspection-board" ? renderOrbitalContactRail() : null}
    </div>
  );
}

function renderResearchLabBoard(study: RailStudyDefinition) {
  if (study.variantKey === "ending-credits-crawl") {
    return (
      <div className={`${styles.productDuplexBoard} ${styles.researchCrawlBoard}`} data-product-board>
        <div className={styles.researchCrawlStrip} data-research-scene="ending-credits-crawl" data-research-strip>
          {researchCrawlItems.map((item, itemIndex) => (
            <figure
              className={styles.researchCrawlCard}
              key={`${study.slug}-crawl-${item.src}-${itemIndex}`}
              data-research-card
              data-research-order={String(itemIndex)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.src}
                alt={item.name.replaceAll("_", " ")}
                width={900}
                height={1200}
                loading="lazy"
                className={`${styles.railStudyImage} ${styles.researchCardImage}`}
              />
              <figcaption className={`${styles.productRailCaption} ${styles.researchCardCaption}`}>
                {item.name.replaceAll("_", " ")}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    );
  }

  if (study.variantKey === "isometric-fabric-atlas") {
    return (
      <div className={`${styles.productDuplexBoard} ${styles.researchAtlasBoard}`} data-product-board>
        <div className={styles.researchAtlasPlane} data-research-scene="isometric-fabric-atlas">
          {researchAtlasItems.map((item, itemIndex) => {
            const row = Math.floor(itemIndex / 4);
            const column = itemIndex % 4;
            return (
              <figure
                className={styles.researchAtlasCard}
                key={`${study.slug}-atlas-${item.src}-${itemIndex}`}
                data-research-card
                data-research-row={String(row)}
                data-research-column={String(column)}
                data-research-order={String(itemIndex)}
                style={
                  {
                    "--atlas-row": String(row),
                    "--atlas-column": String(column),
                  } as CSSProperties
                }
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.src}
                  alt={item.name.replaceAll("_", " ")}
                  width={900}
                  height={1200}
                  loading="lazy"
                  className={`${styles.railStudyImage} ${styles.researchCardImage}`}
                />
                <figcaption className={`${styles.productRailCaption} ${styles.researchCardCaption}`}>
                  {item.name.replaceAll("_", " ")}
                </figcaption>
              </figure>
            );
          })}
        </div>
      </div>
    );
  }

  if (study.variantKey === "hinged-specimen-book") {
    const spreads = Array.from({ length: 4 }, (_, spreadIndex) =>
      researchBookItems.slice(spreadIndex * 2, spreadIndex * 2 + 2),
    );

    return (
      <div className={`${styles.productDuplexBoard} ${styles.researchBookBoard}`} data-product-board>
        <div className={styles.researchBookSpreads} data-research-scene="hinged-specimen-book">
          {spreads.map((spreadItems, spreadIndex) => (
            <section
              className={styles.researchBookSpread}
              key={`${study.slug}-spread-${spreadIndex}`}
              data-book-spread
              data-research-order={String(spreadIndex)}
              style={{ "--spread-order": String(spreadIndex) } as CSSProperties}
            >
              {spreadItems.map((item, pageIndex) => (
                <figure
                  className={styles.researchBookPage}
                  key={`${study.slug}-page-${spreadIndex}-${item.src}-${pageIndex}`}
                  data-research-card
                  data-page-side={pageIndex === 0 ? "left" : "right"}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.src}
                    alt={item.name.replaceAll("_", " ")}
                    width={900}
                    height={1200}
                    loading="lazy"
                    className={`${styles.railStudyImage} ${styles.researchCardImage}`}
                  />
                  <figcaption className={`${styles.productRailCaption} ${styles.researchCardCaption}`}>
                    {item.name.replaceAll("_", " ")}
                  </figcaption>
                </figure>
              ))}
            </section>
          ))}
        </div>
      </div>
    );
  }

  if (study.variantKey === "curved-ribbon-tunnel") {
    return (
      <div className={`${styles.productDuplexBoard} ${styles.researchRibbonBoard}`} data-product-board>
        <div className={styles.researchRibbonTunnel} data-research-scene="curved-ribbon-tunnel">
          {researchRibbonItems.map((item, itemIndex) => (
            <figure
              className={styles.researchRibbonCard}
              key={`${study.slug}-ribbon-${item.src}-${itemIndex}`}
              data-research-card
              data-research-order={String(itemIndex)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.src}
                alt={item.name.replaceAll("_", " ")}
                width={900}
                height={1200}
                loading="lazy"
                className={`${styles.railStudyImage} ${styles.researchCardImage}`}
              />
              <figcaption className={`${styles.productRailCaption} ${styles.researchCardCaption}`}>
                {item.name.replaceAll("_", " ")}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    );
  }

  const columns = Array.from({ length: 3 }, (_, columnIndex) =>
    researchColumnItems.slice(columnIndex * 4, columnIndex * 4 + 4),
  );

  return (
    <div className={`${styles.productDuplexBoard} ${styles.researchColumnsBoard}`} data-product-board>
      <div className={styles.researchColumnsScene} data-research-scene="floating-archive-columns">
        {columns.map((columnItems, columnIndex) => (
          <section
            className={styles.researchColumn}
            key={`${study.slug}-column-${columnIndex}`}
            data-research-column-stack
            data-research-order={String(columnIndex)}
            style={{ "--column-order": String(columnIndex) } as CSSProperties}
          >
            {columnItems.map((item, itemIndex) => (
              <figure
                className={styles.researchColumnCard}
                key={`${study.slug}-column-card-${columnIndex}-${item.src}-${itemIndex}`}
                data-research-card
                data-research-card-order={String(itemIndex)}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.src}
                  alt={item.name.replaceAll("_", " ")}
                  width={900}
                  height={1200}
                  loading="lazy"
                  className={`${styles.railStudyImage} ${styles.researchCardImage}`}
                />
                <figcaption className={`${styles.productRailCaption} ${styles.researchCardCaption}`}>
                  {item.name.replaceAll("_", " ")}
                </figcaption>
              </figure>
            ))}
          </section>
        ))}
      </div>
    </div>
  );
}

function renderProductVer7Layout(study: RailStudyDefinition, immersive = false) {
  return (
    <div
      className={`${styles.productStudyScene} ${styles.productVer7Scene}`}
      data-product-variant={study.variantKey}
      data-motion-grammar={study.motionGrammar}
      data-product-hero={immersive ? "true" : "false"}
    >
      <div
        className={styles.productVer7Archive}
        data-product-archive
        data-ver7-stage="0"
        style={
          {
            "--ver7-tile-width": `${(study.tileWidthRem * 0.72).toFixed(3)}rem`,
            "--ver7-tile-height": `${(study.viewportHeightRem * 0.56).toFixed(3)}rem`,
            "--ver7-cta-size": "0.92rem",
          } as CSSProperties
        }
      >
        {immersive ? null : (
          <header className={styles.productVariantHeader}>
            <p className={styles.productVariantEyebrow}>{study.eyebrow}</p>
            <h2>{study.title}</h2>
          </header>
        )}

        <div className={styles.productVer7Wall}>
          {productVer7Rows.map((row, rowIndex) => (
            <section
              className={styles.productVer7Row}
              key={`${study.slug}-${row.role}`}
              data-ver7-row
              data-row-role={row.role}
              style={
                {
                  "--ver7-row-order": String(rowIndex),
                  "--ver7-column-count": String(
                    row.kind === "fabric" ? row.fabricCells.length : row.textCells.length,
                  ),
                } as CSSProperties
              }
            >
              <div className={styles.productVer7RowPlane}>
                <div className={styles.productVer7Track}>
                  {row.kind === "fabric"
                    ? row.fabricCells.map((item) => (
                        <figure
                          className={styles.productVer7Tile}
                          key={`${study.slug}-${row.role}-${item.cellKey}`}
                          data-ver7-series={item.seriesKey}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={item.src}
                            alt={item.name.replaceAll("_", " ")}
                            width={900}
                            height={1200}
                            loading="lazy"
                            className={`${styles.railStudyImage} ${styles.productVer7Image}`}
                          />
                          <figcaption className={styles.productVer7Caption}>
                            {item.name.replaceAll("_", " ")}
                          </figcaption>
                        </figure>
                      ))
                    : row.textCells.map((cell) => (
                        <div
                          className={styles.productVer7CtaCell}
                          key={`${study.slug}-${row.role}-${cell.cellKey}`}
                        >
                          <span className={styles.productVer7CtaLabel}>{cell.label}</span>
                        </div>
                      ))}
                </div>
              </div>
            </section>
          ))}
        </div>

        {immersive ? null : (
          <footer className={styles.productVariantFooter}>
            <span>{productRailMarkerText(study)}</span>
          </footer>
        )}
      </div>
    </div>
  );
}

function renderProductStudyLayout(
  study: RailStudyDefinition,
  immersive = false,
  orbitalConfig?: OrbitalResolvedConfig | null,
) {
  if (study.variantKey === "ver7") {
    return renderProductVer7Layout(study, immersive);
  }

  const productRailLanes = productRailLanesByCopies.get(study.repeatCopies) ?? productRailLanesByCopies.get(2) ?? [];
  const isThreeDimensionalLab = isThreeDimensionalLabVariant(study.variantKey);
  const isResearchLab = isResearchLabVariant(study.variantKey);
  const isOrbitalInspection = isOrbitalInspectionVariant(study.variantKey);
  const orbitalStudyChromeStripped = isOrbitalStudyChromeStripped(orbitalConfig);
  const orbitalSceneChromeStripped = isOrbitalSceneChromeStripped(orbitalConfig);
  const overlayText = immersive || isThreeDimensionalLab || isResearchLab ? "" : variantOverlayText(study);

  return (
    <div
      className={`${styles.productStudyScene} ${styles.productDuplexScene}`}
      data-product-variant={study.variantKey}
      data-motion-grammar={study.motionGrammar}
      data-product-presentation={study.presentation}
      data-product-hero={immersive ? "true" : "false"}
      data-orbital-scene-chrome={orbitalSceneChromeStripped ? "stripped" : "full"}
      data-orbital-family={isOrbitalInspectionVariant(study.variantKey) ? orbitalConfig?.familyKey : undefined}
    >
      <div
        className={styles.productDuplexArchive}
        data-product-archive
        data-product-presentation={study.presentation}
        style={
          {
            "--variant-lane-gap": `${study.laneGapRem}rem`,
            "--variant-row-gap": `${study.rowGapRem}rem`,
            "--variant-tile-width": `${study.tileWidthRem}rem`,
            "--variant-viewport-height": `${study.viewportHeightRem}rem`,
            "--variant-caption-size": study.captionMode === "runway" ? "0.82rem" : study.captionMode === "wave" ? "0.78rem" : "0.74rem",
            "--variant-gap-text-size": study.gapMode === "runway" ? "1rem" : study.gapMode === "chapters" ? "0.88rem" : "0.78rem",
            "--variant-accent": study.accent,
          } as CSSProperties
        }
      >
        {immersive || orbitalStudyChromeStripped || isOrbitalInspection ? null : (
          <header className={styles.productVariantHeader}>
            <p className={styles.productVariantEyebrow}>{study.eyebrow}</p>
            <h2>{study.title}</h2>
          </header>
        )}
        {overlayText ? (
          <div className={styles.productVariantOverlay} aria-hidden="true">
            <span>{overlayText}</span>
            <span>{overlayText}</span>
          </div>
        ) : null}
        {isResearchLab
          ? renderResearchLabBoard(study)
          : isThreeDimensionalLab
            ? renderThreeDimensionalLabBoard(study, productRailLanes, immersive)
            : (
              <div className={styles.productDuplexBoard} data-product-board>
                {productRailLanes.map((lane, laneIndex) => renderProductRailTrack(study, lane, laneIndex, immersive))}
              </div>
            )}
        {immersive || orbitalStudyChromeStripped || isOrbitalInspection ? null : (
          <footer className={styles.productVariantFooter}>
            <span>{productRailMarkerText(study)}</span>
          </footer>
        )}
      </div>
    </div>
  );
}

function getZoneRenderState(
  zone: ZoneDefinition,
  items: FabricFrame[],
  progress: number,
  reducedMotion: boolean,
): ZoneRenderState {
  const emphasis = windowProgress(progress, zone.focusStart, zone.focusEnd);
  const category = categoryFromGroup(zone.key);
  const checksAct = windowProgress(progress, 0.04, 0.46);
  const stripesAct = windowProgress(progress, 0.42, 0.84);
  const othersAct = windowProgress(progress, 0.7, 1);
  const familyAct = category === "checks" ? checksAct : category === "stripes" ? stripesAct : othersAct;
  const visibilityDrive = clamp(emphasis * 0.78 + familyAct * 0.34);

  if (reducedMotion) {
    return {
      item: items[0],
      visible: true,
      emphasis: visibilityDrive,
      cyclePhase: 0.2,
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
      lineScale: category === "stripes" ? 0.8 : 0,
      sweep: 48,
      glow: 0.4,
    };
  }

  const blankSlots = items.length > 5 ? 2 : 1;
  const cycleLength = items.length + blankSlots;
  const raw = progress * cycleLength * zone.cadence + zone.x * 0.031 + zone.y * 0.013;
  const beat = raw % cycleLength;
  const beatIndex = Math.floor(beat);
  const cyclePhase = beat - beatIndex;
  const visible = beatIndex < items.length && visibilityDrive > 0.08;
  const itemIndex = ((visible ? beatIndex : Math.floor(raw)) % items.length + items.length) % items.length;
  const item = items[itemIndex];

  let clipTop = 0;
  let clipRight = 0;
  let clipBottom = 0;
  let clipLeft = 0;

  if (zone.motion === "split-h") {
    const inset = (1 - visibilityDrive) * 44;
    clipLeft = inset;
    clipRight = inset;
  } else if (zone.motion === "split-v" || zone.motion === "band") {
    const inset = (1 - visibilityDrive) * (zone.motion === "band" ? 36 : 42);
    clipTop = inset;
    clipBottom = inset;
  } else if (zone.motion === "shutter") {
    const inset = (1 - visibilityDrive) * 22;
    clipTop = inset;
    clipRight = inset;
    clipBottom = inset;
    clipLeft = inset;
  } else if (zone.motion === "rail-left") {
    clipRight = (1 - visibilityDrive) * 68;
  } else if (zone.motion === "rail-right") {
    clipLeft = (1 - visibilityDrive) * 68;
  }

  const directionalLaunch =
    zone.motion === "rail-left" || zone.motion === "rail-right"
      ? (1 - visibilityDrive) * zone.direction * 12
      : zone.direction * (1 - emphasis) * zone.drift * 2.6;
  const xShift = directionalLaunch + (progress - 0.5) * zone.depth * 2.8;
  const yShift = (1 - emphasis) * zone.depth * 3.6 - familyAct * zone.depth * 1.4;
  const pulseScale = zone.motion === "pulse" ? Math.sin(progress * Math.PI * 10 + zone.x * 0.04) * 0.012 : 0;
  const scale = 0.88 + visibilityDrive * 0.17 + (zone.motion === "pulse" ? familyAct * 0.03 : 0) + pulseScale;
  const alpha = visible ? clamp(0.24 + visibilityDrive * 0.82) : 0;
  const blur = visible ? (1 - visibilityDrive) * 5 : 10;
  const saturation = 0.84 + visibilityDrive * 0.34;
  const lineScale =
    category === "stripes" ? clamp(0.18 + visibilityDrive * 0.9 + cyclePhase * 0.08) : 0;
  const sweep = (cyclePhase * 140 + visibilityDrive * 18) % 140;
  const glow = clamp(0.14 + familyAct * 0.46 + emphasis * 0.22);

  return {
    item,
    visible,
    emphasis,
    cyclePhase,
    clipTop,
    clipRight,
    clipBottom,
    clipLeft,
    xShift,
    yShift,
    scale,
    alpha,
    blur,
    saturation,
    lineScale,
    sweep,
    glow,
  };
}

function getFamilyZonesThreeRenderState(
  layout: FamilyZonesThreeLayout,
  items: FabricFrame[],
  progress: number,
  reducedMotion: boolean,
) {
  const baseZone = zoneDefinitions.find((zone) => zone.key === layout.key);
  const fallbackZone = baseZone ?? {
    key: layout.key,
    x: layout.x,
    y: layout.y,
    motion: "drift" as const,
    focusStart: 0,
    focusEnd: 1,
    cadence: 4,
    drift: 1,
    depth: 1,
    direction: 1 as const,
  };
  const baseState = getZoneRenderState(
    fallbackZone,
    items,
    clamp(progress * 0.96),
    reducedMotion,
  );
  const drift = windowProgress(progress, 0.22, 0.56);
  const handoff = windowProgress(progress, 0.61, 0.69);
  const category = categoryFromGroup(layout.key);

  if (reducedMotion) {
    return {
      item: items[0],
      alpha: 1,
      xShift: 0,
      yShift: 0,
      scale: 1,
      clipTop: 0,
      clipRight: 0,
      clipBottom: 0,
      clipLeft: 0,
      lineScale: category === "stripes" ? 0.5 : 0,
      finaleFade: 0,
    };
  }

  const driftWave = Math.sin(progress * Math.PI * (1.5 + layout.lane * 0.06) + layout.x * 0.05);
  const alpha = clamp(mix(Math.max(0.84, baseState.alpha), 0, handoff));

  return {
    item: baseState.item,
    alpha,
    xShift: baseState.xShift + layout.vectorX * drift * 0.08 + driftWave * drift * 0.06,
    yShift: baseState.yShift + layout.vectorY * drift * 0.04,
    scale: clamp(baseState.scale, 0.94, 1.04),
    clipTop: baseState.clipTop,
    clipRight: baseState.clipRight,
    clipBottom: baseState.clipBottom,
    clipLeft: baseState.clipLeft,
    lineScale: category === "stripes" ? clamp(baseState.lineScale) : 0,
    finaleFade: 0,
  };
}

function FamilyZone({
  zone,
  progress,
  reducedMotion,
  priority,
  theme = "dark",
  detailedCaption = false,
  detachedCaption = false,
  hideRail = false,
  layoutOverride,
  className,
}: {
  zone: ZoneDefinition;
  progress: number;
  reducedMotion: boolean;
  priority: boolean;
  theme?: StageTheme;
  detailedCaption?: boolean;
  detachedCaption?: boolean;
  hideRail?: boolean;
  layoutOverride?: {
    x?: number;
    y?: number;
    widthRem?: number;
    yShiftRem?: number;
    xShiftRem?: number;
  };
  className?: string;
}) {
  const items = tilesForGroup(zone.key);
  if (items.length === 0) {
    return null;
  }

  const state = getZoneRenderState(zone, items, progress, reducedMotion);
  const category = categoryFromGroup(zone.key);
  const captionTitle = detailedCaption ? state.item.name.replaceAll("_", " ") : labelFromGroup(zone.key);
  const style =
    {
      "--x": `${layoutOverride?.x ?? zone.x}%`,
      "--y": `${layoutOverride?.y ?? zone.y}%`,
      "--tx": `${(state.xShift + (layoutOverride?.xShiftRem ?? 0)).toFixed(3)}rem`,
      "--ty": `${(state.yShift + (layoutOverride?.yShiftRem ?? 0)).toFixed(3)}rem`,
      "--scale": state.scale.toFixed(3),
      "--alpha": state.alpha.toFixed(3),
      "--clip-top": `${state.clipTop.toFixed(2)}%`,
      "--clip-right": `${state.clipRight.toFixed(2)}%`,
      "--clip-bottom": `${state.clipBottom.toFixed(2)}%`,
      "--clip-left": `${state.clipLeft.toFixed(2)}%`,
      "--blur": `${state.blur.toFixed(2)}px`,
      "--sat": state.saturation.toFixed(3),
      "--line-scale": state.lineScale.toFixed(3),
      "--sweep": `${state.sweep.toFixed(2)}%`,
      "--glow": state.glow.toFixed(3),
      "--phase": state.cyclePhase.toFixed(3),
      "--zone-width": layoutOverride?.widthRem ? `${layoutOverride.widthRem}rem` : undefined,
    } as CSSProperties;

  return (
    <section
      className={`${styles.familyZone} ${theme === "light" ? styles.familyZoneLight : ""} ${className ?? ""}`}
      style={style}
      data-category={category}
      data-motion={zone.motion}
      data-visible={state.visible ? "true" : "false"}
      data-theme={theme}
    >
      <div className={`${styles.zoneAnchor} ${detachedCaption ? styles.zoneAnchorDetached : ""}`}>
        {category === "stripes" && !hideRail ? <span className={styles.zoneRail} /> : null}
        <figure className={styles.zoneFigure}>
          <span className={styles.zoneFrameGlow} />
          <span className={styles.zoneSweep} />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={state.item.src}
            alt={labelFromGroup(zone.key)}
            width={900}
            height={1200}
            loading={priority ? "eager" : "lazy"}
            className={styles.zoneImage}
          />
          {!detachedCaption ? (
            <figcaption className={styles.zoneCaption}>
              <span className={styles.zoneCaptionTitle}>{captionTitle}</span>
              {detailedCaption ? null : (
                <span className={styles.zoneCaptionDetail}>{labelFromGroup(zone.key)}</span>
              )}
            </figcaption>
          ) : null}
        </figure>
        {detachedCaption ? (
          <div className={`${styles.zoneCaption} ${styles.zoneCaptionDetached}`}>
            <span className={styles.zoneCaptionTitle}>{captionTitle}</span>
            {detailedCaption ? null : (
              <span className={styles.zoneCaptionDetail}>{labelFromGroup(zone.key)}</span>
            )}
          </div>
        ) : null}
      </div>
    </section>
  );
}

function FamilyZoneThree({
  zone,
  progress,
  reducedMotion,
  priority,
}: {
  zone: FamilyZonesThreeLayout;
  progress: number;
  reducedMotion: boolean;
  priority: boolean;
}) {
  const items = tilesForGroup(zone.key);
  if (items.length === 0) {
    return null;
  }

  const state = getFamilyZonesThreeRenderState(zone, items, progress, reducedMotion);
  const category = categoryFromGroup(zone.key);
  const style = {
    "--x": `${zone.x}%`,
    "--y": `${zone.y}%`,
    "--tx": `${state.xShift.toFixed(3)}rem`,
    "--ty": `${state.yShift.toFixed(3)}rem`,
    "--scale": state.scale.toFixed(3),
    "--alpha": state.alpha.toFixed(3),
    "--clip-top": `${state.clipTop.toFixed(2)}%`,
    "--clip-right": `${state.clipRight.toFixed(2)}%`,
    "--clip-bottom": `${state.clipBottom.toFixed(2)}%`,
    "--clip-left": `${state.clipLeft.toFixed(2)}%`,
    "--line-scale": state.lineScale.toFixed(3),
    "--fz3-fade": state.finaleFade.toFixed(3),
  } as CSSProperties;

  return (
    <section
      className={`${styles.familyZone} ${styles.familyZoneLight} ${styles.familyZoneThree}`}
      style={style}
      data-category={category}
      data-theme="light"
      data-family-zone-three={zone.key}
    >
      <div className={styles.zoneAnchor}>
        {category === "stripes" ? <span className={styles.zoneRail} /> : null}
        <figure className={`${styles.zoneFigure} ${styles.familyZoneThreeFigure}`}>
          <span className={styles.zoneFrameGlow} />
          <span className={styles.zoneSweep} />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={state.item.src}
            alt={state.item.name.replaceAll("_", " ")}
            width={900}
            height={1200}
            loading={priority ? "eager" : "lazy"}
            className={styles.zoneImage}
          />
          <figcaption className={`${styles.zoneCaption} ${styles.familyZoneThreeCaption}`}>
            <span className={styles.zoneCaptionTitle}>{state.item.name.replaceAll("_", " ")}</span>
          </figcaption>
        </figure>
      </div>
    </section>
  );
}

function FamilyZonesThreeFinale({
  progress,
  reducedMotion,
}: {
  progress: number;
  reducedMotion: boolean;
}) {
  const railReveal = reducedMotion ? 1 : windowProgress(progress, 0.72, 0.78);
  const screenOneReveal = reducedMotion ? 1 : windowProgress(progress, 0.72, 0.82);
  const screenTwoReveal = reducedMotion ? 1 : windowProgress(progress, 0.88, 0.94);
  const screenOneHold = reducedMotion ? 1 : windowProgress(progress, 0.82, 0.88);
  const screenTwoHold = reducedMotion ? 1 : windowProgress(progress, 0.94, 0.985);
  const wallTravel = reducedMotion ? 1 : windowProgress(progress, 0.88, 0.985);
  const lateExit = reducedMotion ? 0 : windowProgress(progress, 0.985, 1);
  const containerStyle = {
    "--fz3-finale": railReveal.toFixed(3),
    "--fz3-screen-one-reveal": screenOneReveal.toFixed(3),
    "--fz3-screen-two-reveal": screenTwoReveal.toFixed(3),
    "--fz3-screen-one-hold": screenOneHold.toFixed(3),
    "--fz3-screen-two-hold": screenTwoHold.toFixed(3),
    "--fz3-wall-travel": wallTravel.toFixed(3),
    "--fz3-outro": lateExit.toFixed(3),
  } as CSSProperties;
  const wallStyle = {
    transform: `translate3d(0, ${reducedMotion ? 0 : (mix(0, -63.8, wallTravel) + mix(0, -10.5, lateExit)).toFixed(3)}rem, 0)`,
  } as CSSProperties;

  return (
    <section
      className={styles.familyZonesThreeFinale}
      style={containerStyle}
      data-family-zones-3-finale
      data-finale-unique-count={String(uniqueFinaleFrames.length)}
    >
      <div className={styles.familyZonesThreeRailViewport}>
        <div className={styles.familyZonesThreeShelfGuides}>
          {familyZonesThreeScreenRows.map((row) => (
            <span
              className={styles.familyZonesThreeShelfGuide}
              key={`guide-${row.row}`}
              style={{ "--lane-order": String(row.row - 1) } as CSSProperties}
            />
          ))}
        </div>

        <div
          className={styles.familyZonesThreeFinaleWall}
          style={wallStyle}
          data-finale-wall
        >
          {[1, 2].map((screenNumber) => (
            <div
              className={styles.familyZonesThreeScreen}
              key={`screen-${screenNumber}`}
              data-fz3-screen={String(screenNumber)}
              style={{ "--screen-order": String(screenNumber - 1) } as CSSProperties}
            >
              {familyZonesThreeScreenRows
                .filter((row) => row.screen === screenNumber)
                .map((row, rowIndex) => {
                  const rowRevealBase =
                    screenNumber === 1 ? screenOneReveal : screenTwoReveal;
                  const rowHoldBase =
                    screenNumber === 1 ? screenOneHold : screenTwoHold;
                  const rowReveal = reducedMotion
                    ? 1
                    : smoothStep(clamp((rowRevealBase - rowIndex * 0.16) / 0.38));
                  const rowHold = clamp(rowHoldBase + rowReveal * 0.28);
                  const direction = row.row % 2 === 1 ? -1 : 1;
                  const enteredX = mix(direction * 34, 0, rowReveal);
                  const x = mix(enteredX, -direction * 18, lateExit);
                  const opacity =
                    rowReveal > 0.02 ? Math.max(0, 1 - lateExit * 0.96) : 0;

                  return (
                    <div
                      className={styles.familyZonesThreeFinaleLane}
                      key={`lane-${row.row}`}
                      data-finale-lane={String(row.row - 1)}
                      data-fz3-row={String(row.row)}
                      style={{ "--lane-order": String(rowIndex) } as CSSProperties}
                    >
                      <div
                        className={styles.familyZonesThreeFinaleTrack}
                        data-finale-track
                        style={
                          {
                            "--lane-size": String(row.items.length),
                            "--entry-progress": rowReveal.toFixed(3),
                            "--lane-hold": rowHold.toFixed(3),
                            transform: `translate3d(${x.toFixed(3)}rem, 0, 0)`,
                            opacity: opacity.toFixed(3),
                          } as CSSProperties
                        }
                      >
                        {row.items.map((item) => (
                          <figure
                            className={styles.familyZonesThreeFinaleTile}
                            key={item.src}
                            data-finale-item-src={item.src}
                            data-fz3-series={item.seriesKey}
                            data-fz3-serial={String(item.serial)}
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={item.src}
                              alt={item.name.replaceAll("_", " ")}
                              width={900}
                              height={1200}
                              loading="lazy"
                              className={styles.familyZonesThreeFinaleImage}
                            />
                            <figcaption className={styles.familyZonesThreeFinaleCaption}>
                              {item.name.replaceAll("_", " ")}
                            </figcaption>
                          </figure>
                        ))}
                      </div>
                    </div>
                  );
                })}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function RailStudySection({
  study,
  index,
  minimal = false,
  orbitalConfig,
}: {
  study: RailStudyDefinition;
  index: number;
  minimal?: boolean;
  orbitalConfig?: OrbitalResolvedConfig | null;
}) {
  const orbitalStudyChromeStripped = isOrbitalStudyChromeStripped(orbitalConfig);
  const effectiveSpan = isOrbitalInspectionVariant(study.variantKey) && orbitalConfig
    ? `${orbitalConfig.motion.spanDvh}dvh`
    : study.span;
  return (
    <section
      id={`study-${study.slug}`}
      className={styles.railStudy}
      data-rail-study={study.slug}
      data-rail-layout={study.layout}
      data-product-variant={study.variantKey}
      data-orbital-config={isOrbitalInspectionVariant(study.variantKey) ? orbitalConfigPayload(orbitalConfig) : undefined}
      data-orbital-study-chrome={orbitalStudyChromeStripped ? "stripped" : "full"}
      style={
        {
          "--rail-study-index": String(index),
          "--rail-study-span": effectiveSpan,
          "--rail-study-accent": study.accent,
        } as CSSProperties
      }
    >
      <div className={styles.railStudyStage}>
        {minimal || orbitalStudyChromeStripped ? null : (
          <header className={styles.railStudyHeader}>
            <div>
              <p className={styles.railStudyEyebrow}>{study.eyebrow}</p>
              <h2>{study.title}</h2>
              <div className={styles.railStudyMeta}>
                <span className={styles.railStudyTag}>{study.cue}</span>
                <span className={styles.railStudyTag}>{study.reference}</span>
                <a className={styles.railStudyBackLink} href="#motion-lab-top">
                  Back To Top
                </a>
              </div>
              <div className={styles.railStudyChipRow}>
                {study.focusSeries.map((seriesKey) => (
                  <span className={styles.railStudyChip} key={`${study.slug}-${seriesKey}`}>
                    {labelFromGroup(seriesKey)}
                  </span>
                ))}
              </div>
            </div>
            <p className={styles.railStudyNote}>{study.note}</p>
          </header>
        )}

        <div className={styles.railStudyCanvas}>
          {renderProductStudyLayout(study, minimal, orbitalConfig)}
        </div>
      </div>
    </section>
  );
}

const orbitalMotionControlSections: Array<{
  title: string;
  fields: Array<{
    field: keyof OrbitalMotionConfig;
    label: string;
    min: number;
    max: number;
    step: number;
  }>;
}> = [
  {
    title: "Board Orbit",
    fields: [
      { field: "spanDvh", label: "Span", min: 140, max: 420, step: 1 },
      { field: "settleStart", label: "Settle Start", min: 0.3, max: 0.95, step: 0.01 },
      { field: "rightSwingYaw", label: "Swing Yaw", min: -12, max: 84, step: 1 },
      { field: "rightSwingPitch", label: "Swing Pitch", min: -24, max: 24, step: 1 },
      { field: "rightSwingBank", label: "Swing Bank", min: -24, max: 36, step: 1 },
      { field: "rightSwingLateral", label: "Swing X", min: -12, max: 16, step: 0.1 },
    ],
  },
  {
    title: "End Pose",
    fields: [
      { field: "endYaw", label: "End Yaw", min: -48, max: 48, step: 1 },
      { field: "endPitch", label: "End Pitch", min: -16, max: 48, step: 1 },
      { field: "endBank", label: "End Bank", min: -72, max: 40, step: 1 },
      { field: "endLateral", label: "End X", min: -16, max: 16, step: 0.1 },
      { field: "endVertical", label: "End Y", min: -12, max: 12, step: 0.1 },
      { field: "endDepth", label: "End Z", min: -36, max: 8, step: 0.1 },
      { field: "endScale", label: "End Scale", min: 0.72, max: 1.28, step: 0.01 },
    ],
  },
  {
    title: "Board Relief",
    fields: [
      { field: "laneDepth", label: "Lane Depth", min: 0, max: 4, step: 0.05 },
      { field: "laneYaw", label: "Lane Yaw", min: 0, max: 28, step: 0.1 },
      { field: "lanePitch", label: "Lane Pitch", min: 0, max: 28, step: 0.1 },
      { field: "laneLift", label: "Lane Lift", min: 0, max: 4, step: 0.05 },
      { field: "laneSpread", label: "Lane Spread", min: 0, max: 4, step: 0.05 },
    ],
  },
  {
    title: "Light / Atmosphere",
    fields: [
      { field: "floor", label: "Floor", min: 0, max: 1, step: 0.01 },
      { field: "auraBase", label: "Aura", min: 0, max: 1, step: 0.01 },
      { field: "auraInspect", label: "Aura Inspect", min: 0, max: 1, step: 0.01 },
      { field: "sheenBase", label: "Sheen", min: 0, max: 1, step: 0.01 },
      { field: "sheenInspect", label: "Sheen Inspect", min: 0, max: 1, step: 0.01 },
    ],
  },
];

const orbitalFamilyControlFields: Array<{
  field: keyof OrbitalFamilyTuning;
  label: string;
  min: number;
  max: number;
  step: number;
}> = [
  { field: "torsion", label: "Torsion", min: 0, max: 1.5, step: 0.01 },
  { field: "lift", label: "Lift", min: 0, max: 1.5, step: 0.01 },
  { field: "drift", label: "Camera Drift", min: 0, max: 1.5, step: 0.01 },
  { field: "lightSweep", label: "Light Sweep", min: 0, max: 1.5, step: 0.01 },
  { field: "finaleBias", label: "Finale Bias", min: 0, max: 1.5, step: 0.01 },
];

const orbitalLayerToggleFields: Array<{
  field: keyof OrbitalLayerConfig;
  label: string;
  reloadsRoute?: boolean;
}> = [
  { field: "previewChrome", label: "Preview Chrome", reloadsRoute: true },
  { field: "studyChrome", label: "Study Chrome" },
  { field: "sceneChrome", label: "Scene Chrome" },
  { field: "strictTrigger", label: "Strict Trigger" },
];

function OrbitalInspectorPanel({
  config,
  exportUrl,
  onFamilyChange,
  onPresetChange,
  onFamilyTuningChange,
  onMotionChange,
  onLayerChange,
  onDebugToggle,
  onReset,
  onCopy,
}: {
  config: OrbitalResolvedConfig;
  exportUrl: string;
  onFamilyChange: (familyKey: OrbitalMotionFamilyKey) => void;
  onPresetChange: (presetKey: OrbitalPresetKey) => void;
  onFamilyTuningChange: (field: keyof OrbitalFamilyTuning, value: number) => void;
  onMotionChange: (field: keyof OrbitalMotionConfig, value: number) => void;
  onLayerChange: (field: keyof OrbitalLayerConfig, value: boolean) => void;
  onDebugToggle: (value: boolean) => void;
  onReset: () => void;
  onCopy: () => void;
}) {
  return (
    <aside className={styles.orbitalInspectorPanel} data-orbital-controls>
      <div className={styles.orbitalInspectorHeader}>
        <div>
          <p className={styles.orbitalInspectorEyebrow}>Orbital Controls</p>
          <h3>Motion Family Studio</h3>
        </div>
        <button type="button" className={styles.orbitalInspectorButton} onClick={onReset}>
          Reset
        </button>
      </div>

      <label className={styles.orbitalInspectorField}>
        <span>Family</span>
        <select
          className={styles.orbitalInspectorSelect}
          value={config.familyKey}
          onChange={(event) => onFamilyChange(event.target.value as OrbitalMotionFamilyKey)}
        >
          {(Object.keys(orbitalMotionFamilyCatalog) as OrbitalMotionFamilyKey[]).map((familyKey) => (
            <option key={familyKey} value={familyKey}>
              {orbitalFamilyLabel(familyKey)}
            </option>
          ))}
        </select>
        <small>{orbitalFamilyDescription(config.familyKey)}</small>
      </label>

      <label className={styles.orbitalInspectorField}>
        <span>Preset</span>
        <select
          className={styles.orbitalInspectorSelect}
          value={config.presetKey}
          onChange={(event) => onPresetChange(event.target.value as OrbitalPresetKey)}
        >
          {(Object.keys(orbitalPresetCatalog) as OrbitalPresetKey[]).map((presetKey) => (
            <option key={presetKey} value={presetKey}>
              {orbitalPresetLabel(presetKey)}
            </option>
          ))}
        </select>
        <small>{orbitalPresetDescription(config.presetKey)}</small>
      </label>

      <section className={styles.orbitalInspectorSection}>
        <p className={styles.orbitalInspectorSectionTitle}>Family Direction</p>
        <div className={styles.orbitalInspectorGrid}>
          {orbitalFamilyControlFields.map((control) => (
            <label className={styles.orbitalInspectorField} key={control.field}>
              <span>
                {control.label}
                <strong>{config.familyTuning[control.field].toFixed(2)}</strong>
              </span>
              <div className={styles.orbitalInspectorInputRow}>
                <input
                  className={styles.orbitalInspectorRange}
                  type="range"
                  min={control.min}
                  max={control.max}
                  step={control.step}
                  value={config.familyTuning[control.field]}
                  onChange={(event) => onFamilyTuningChange(control.field, Number(event.target.value))}
                />
                <input
                  className={styles.orbitalInspectorNumber}
                  type="number"
                  min={control.min}
                  max={control.max}
                  step={control.step}
                  value={config.familyTuning[control.field]}
                  onChange={(event) => onFamilyTuningChange(control.field, Number(event.target.value))}
                />
              </div>
            </label>
          ))}
        </div>
      </section>

      <details className={styles.orbitalInspectorDetails}>
        <summary className={styles.orbitalInspectorSummary}>Advanced Scalars</summary>
        <div className={styles.orbitalInspectorDetailsBody}>
          {orbitalMotionControlSections.map((section) => (
            <section className={styles.orbitalInspectorSection} key={section.title}>
              <p className={styles.orbitalInspectorSectionTitle}>{section.title}</p>
              <div className={styles.orbitalInspectorGrid}>
                {section.fields.map((control) => (
                  <label className={styles.orbitalInspectorField} key={control.field}>
                    <span>
                      {control.label}
                      <strong>{config.motion[control.field].toFixed(control.step < 1 ? 2 : 0)}</strong>
                    </span>
                    <div className={styles.orbitalInspectorInputRow}>
                      <input
                        className={styles.orbitalInspectorRange}
                        type="range"
                        min={control.min}
                        max={control.max}
                        step={control.step}
                        value={config.motion[control.field]}
                        onChange={(event) => onMotionChange(control.field, Number(event.target.value))}
                      />
                      <input
                        className={styles.orbitalInspectorNumber}
                        type="number"
                        min={control.min}
                        max={control.max}
                        step={control.step}
                        value={config.motion[control.field]}
                        onChange={(event) => onMotionChange(control.field, Number(event.target.value))}
                      />
                    </div>
                  </label>
                ))}
              </div>
            </section>
          ))}
        </div>
      </details>

      <div className={styles.orbitalInspectorToggles}>
        {orbitalLayerToggleFields.map((toggle) => (
          <label className={styles.orbitalInspectorToggle} key={toggle.field}>
            <input
              type="checkbox"
              checked={config.layers[toggle.field]}
              onChange={(event) => onLayerChange(toggle.field, event.target.checked)}
            />
            <span>
              {toggle.label}
              {toggle.reloadsRoute ? <small>reload</small> : null}
            </span>
          </label>
        ))}

        <label className={styles.orbitalInspectorToggle}>
          <input
            type="checkbox"
            checked={config.debugEnabled}
            onChange={(event) => onDebugToggle(event.target.checked)}
          />
          <span>Debug Metrics</span>
        </label>
      </div>

      <div className={styles.orbitalInspectorActions}>
        <button type="button" className={styles.orbitalInspectorButton} onClick={onCopy}>
          Copy URL
        </button>
        <input className={styles.orbitalInspectorUrl} type="text" readOnly value={exportUrl} />
      </div>
    </aside>
  );
}

function OrbitalDebugPanel({ metrics }: { metrics: OrbitalDebugMetrics }) {
  return (
    <aside className={styles.orbitalDebugPanel} data-orbital-debug>
      <p className={styles.orbitalInspectorEyebrow}>Orbital Debug</p>
      <dl className={styles.orbitalDebugList}>
        <div>
          <dt>Family</dt>
          <dd>{metrics.familyKey}</dd>
        </div>
        <div>
          <dt>Preset</dt>
          <dd>{metrics.presetKey}</dd>
        </div>
        <div>
          <dt>Progress</dt>
          <dd>{metrics.progress.toFixed(4)}</dd>
        </div>
        <div>
          <dt>Pose</dt>
          <dd>{`${metrics.pose.yaw.toFixed(1)} / ${metrics.pose.pitch.toFixed(1)} / ${metrics.pose.bank.toFixed(1)}`}</dd>
        </div>
        <div>
          <dt>Shift</dt>
          <dd>{`${metrics.pose.lateral.toFixed(1)} / ${metrics.pose.vertical.toFixed(1)} / ${metrics.pose.depth.toFixed(1)}`}</dd>
        </div>
        <div>
          <dt>Span</dt>
          <dd>{`${metrics.motion.spanDvh}dvh`}</dd>
        </div>
        <div>
          <dt>Family Tune</dt>
          <dd>{`${metrics.familyTuning.torsion.toFixed(2)} / ${metrics.familyTuning.lift.toFixed(2)} / ${metrics.familyTuning.drift.toFixed(2)}`}</dd>
        </div>
        <div>
          <dt>Layers</dt>
          <dd>{`${metrics.layers.previewChrome ? "P" : "-"}${metrics.layers.studyChrome ? "S" : "-"}${metrics.layers.sceneChrome ? "C" : "-"}${metrics.layers.strictTrigger ? "T" : "-"}`}</dd>
        </div>
      </dl>
    </aside>
  );
}

function OrbitalPortal({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || typeof document === "undefined") {
    return null;
  }

  return createPortal(children, document.body);
}

function ProductLabIntro() {
  return <section className={styles.productLabIntro} id="motion-lab-top" aria-hidden="true" />;
}

function activeAct(
  progress: number,
  stageActs: readonly { label: string; start: number; end: number }[] = acts,
) {
  return stageActs.reduce((activeIndex, act, index) => {
    if (progress >= act.start) {
      return index;
    }
    return activeIndex;
  }, 0);
}

function StudyTile({
  item,
  caption,
  priority = false,
  className,
}: {
  item: FabricFrame;
  caption?: string;
  priority?: boolean;
  className?: string;
}) {
  return (
    <figure className={`${styles.studyTile} ${className ?? ""}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={item.src}
        alt={caption ?? item.name}
        width={900}
        height={1200}
        loading={priority ? "eager" : "lazy"}
        className={styles.studyTileImage}
      />
      {caption ? <figcaption className={styles.studyTileCaption}>{caption}</figcaption> : null}
    </figure>
  );
}

function StudySwitchTile({
  items,
  caption,
  priority = false,
  className,
}: {
  items: FabricFrame[];
  caption?: string;
  priority?: boolean;
  className?: string;
}) {
  const primary = items[0];
  const secondary = items[1] ?? items[0];

  if (!primary) {
    return null;
  }

  return (
    <figure className={`${styles.studyTile} ${styles.studySwitchTile} ${className ?? ""}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={primary.src}
        alt={caption ?? primary.name}
        width={900}
        height={1200}
        loading={priority ? "eager" : "lazy"}
        className={`${styles.studyTileImage} ${styles.switchImagePrimary}`}
      />
      {secondary ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={secondary.src}
            alt={caption ?? secondary.name}
            width={900}
            height={1200}
            loading="lazy"
            className={`${styles.studyTileImage} ${styles.switchImageSecondary}`}
          />
        </>
      ) : null}
      {caption ? <figcaption className={styles.studyTileCaption}>{caption}</figcaption> : null}
    </figure>
  );
}

function renderRoomLayout(room: RoomDefinition) {
  switch (room.roomType) {
    case "connectedGrid":
      return (
        <div className={styles.connectedSalon} data-room-stage>
          <span className={styles.connectedSpineHorizontal} />
          <span className={styles.connectedSpineVertical} />
          {room.groups.slice(0, 6).map((group, index) => (
            <div
              className={`${styles.connectedCell} ${
                styles[`connectedCell${index + 1}` as keyof typeof styles]
              }`}
              key={group}
            >
              <StudySwitchTile
                items={tilesForGroup(group).slice(0, 2)}
                caption={labelFromGroup(group)}
                priority={index < 2}
              />
            </div>
          ))}
        </div>
      );
    case "maskLedger":
      return (
        <div className={styles.maskLedger} data-room-stage>
          {room.groups.slice(0, 4).map((group, index) => (
            <section className={styles.maskLedgerColumn} key={group}>
              <div className={styles.maskLedgerCurtain} />
              <StudySwitchTile
                items={tilesForGroup(group).slice(0, 2)}
                caption={labelFromGroup(group)}
                priority={index === 0}
                className={styles.maskLedgerTile}
              />
              <span className={styles.maskLedgerLabel}>{labelFromGroup(group)}</span>
            </section>
          ))}
        </div>
      );
    case "stackAtlas": {
      const cards = room.groups
        .flatMap((group) =>
          tilesForGroup(group)
            .slice(0, 2)
            .map((item) => ({ item, group })),
        )
        .slice(0, 7);
      const wallPositions = [
        { x: -22, y: -12 },
        { x: -7, y: -12 },
        { x: 8, y: -12 },
        { x: 23, y: -12 },
        { x: -14, y: 8.2 },
        { x: 1, y: 8.2 },
        { x: 16, y: 8.2 },
      ];

      return (
        <div className={styles.stackAtlasRoom}>
          <div className={styles.stackAtlasStage} data-room-stage>
            <div className={styles.stackAtlasDeck}>
              {cards.map(({ item, group }, index) => (
                <div
                  className={styles.stackCard}
                  data-stack-card
                  key={`${item.src}-${index}`}
                  style={
                    {
                      "--stack-order": String(index),
                      "--wall-x": `${wallPositions[index]?.x ?? 0}rem`,
                      "--wall-y": `${wallPositions[index]?.y ?? 0}rem`,
                    } as CSSProperties
                  }
                >
                  <StudyTile
                    item={item}
                    caption={labelFromGroup(group)}
                    priority={index < 2}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }
    case "duplexRails":
      return (
        <div className={styles.duplexRails} data-room-stage>
          {room.groups.slice(0, room.laneCount ?? 3).map((group, index) => {
            const laneItems = repeatFrames(tilesForGroup(group).slice(0, 3), 4);
            const direction = index === 1 ? 1 : -1;
            const paused = index === 1;
            return (
              <section className={styles.duplexLane} key={group}>
                <div className={styles.duplexLaneMeta}>
                  <span className={styles.duplexLaneLabel}>{labelFromGroup(group)}</span>
                  <span className={styles.duplexLaneMode}>
                    {paused ? "Pause / Restart" : direction === -1 ? "Drift Left" : "Drift Right"}
                  </span>
                </div>
                <div className={styles.duplexViewport}>
                  <div
                    className={styles.duplexTrack}
                    data-rail-track
                    data-lane-index={String(index)}
                    data-lane-direction={String(direction)}
                    data-lane-pause={paused ? "true" : "false"}
                  >
                    {laneItems.map((item) => (
                      <StudyTile key={item.repeatKey} item={item} />
                    ))}
                  </div>
                </div>
              </section>
            );
          })}
        </div>
      );
    case "drawerDepth":
      return (
        <div className={styles.drawerDepth} data-room-stage>
          {room.groups.slice(0, 3).map((group, index) => (
            <section className={styles.drawerTray} key={group}>
              <header className={styles.drawerTrayHeader}>
                <span className={styles.drawerTrayLabel}>{labelFromGroup(group)}</span>
                <span className={styles.drawerTrayIndex}>Tray 0{index + 1}</span>
              </header>
              <div className={styles.drawerTrack}>
                {tilesForGroup(group)
                  .slice(0, 3)
                  .map((item, itemIndex) => (
                    <StudyTile
                      key={item.src}
                      item={item}
                      caption={itemIndex === 0 ? labelFromGroup(group) : undefined}
                      priority={index === 0 && itemIndex === 0}
                    />
                  ))}
              </div>
            </section>
          ))}
        </div>
      );
    case "closingWall": {
      const leadGroups = room.groups.slice(0, 3);
      const wallItems = room.groups
        .flatMap((group) =>
          tilesForGroup(group)
            .slice(0, 1)
            .map((item) => ({ item, group })),
        )
        .slice(0, 6);

      return (
        <div className={styles.closingWallRoom}>
          <div className={styles.closingWallStage} data-room-stage>
            <div className={styles.closingWallGrid} data-closing-wall>
              {wallItems.map(({ item, group }) => (
                <StudyTile key={item.src} item={item} caption={labelFromGroup(group)} />
              ))}
            </div>
            <div className={styles.closingPanels}>
              {leadGroups.map((group, index) => (
                <div className={styles.closingPanel} data-closing-panel key={group}>
                  <StudySwitchTile
                    items={tilesForGroup(group).slice(0, 2)}
                    caption={labelFromGroup(group)}
                    priority={index === 0}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }
    default:
      return null;
  }
}

function GalleryRoomSection({
  room,
  roomIndex,
}: {
  room: RoomDefinition;
  roomIndex: number;
}) {
  return (
    <section
      className={styles.galleryRoom}
      data-room={room.slug}
      data-room-type={room.roomType}
      data-tone={room.tone}
      data-room-pin={room.pin ? "true" : "false"}
      data-performance-class={room.performanceClass}
      data-reduced-motion-variant={room.reducedMotionVariant}
      data-mobile-variant={room.mobileVariant}
      data-phase-map={room.phaseMap?.join(",") ?? ""}
      data-lane-count={room.laneCount ? String(room.laneCount) : ""}
      data-lane-pause={room.lanePause ? "true" : "false"}
      data-safari-fallback={room.safariFallback ?? "none"}
      data-mobile-pin-downgrade={room.mobilePinDowngrade ? "true" : "false"}
      data-room-span={room.scrollSpan}
      style={
        {
          "--room-progress": "1",
          "--room-active": "0",
          "--room-index": String(roomIndex),
          "--room-span": room.scrollSpan,
        } as CSSProperties
      }
    >
      <div className={styles.galleryRoomInner}>
        <header className={styles.galleryRoomHeader}>
          <div>
            <p className={styles.galleryRoomEyebrow}>{room.eyebrow}</p>
            <h2>{room.title}</h2>
          </div>
          <p className={styles.galleryRoomNote}>{room.note}</p>
        </header>
        <div className={styles.galleryRoomCanvas}>{renderRoomLayout(room)}</div>
      </div>
    </section>
  );
}

function renderAppendixLayout(study: AppendixDefinition) {
  switch (study.layout) {
    case "veilDock":
      return (
        <div className={styles.appendixVeilDock}>
          {study.groups.slice(0, 2).map((group, index) => (
            <div className={styles.appendixVeilPanel} key={group}>
              <div className={styles.appendixVeilCurtain} />
              <StudySwitchTile
                items={tilesForGroup(group).slice(0, 2)}
                caption={labelFromGroup(group)}
                priority={index === 0}
              />
            </div>
          ))}
        </div>
      );
    case "hingeFan":
      return (
        <div className={styles.appendixHingeFan}>
          {study.groups.slice(0, 5).map((group, index) => (
            <div className={styles.appendixHingePanel} key={group} style={{ "--hinge-order": String(index) } as CSSProperties}>
              <StudySwitchTile
                items={tilesForGroup(group).slice(0, 2)}
                caption={labelFromGroup(group)}
                priority={index < 2}
              />
            </div>
          ))}
        </div>
      );
    case "bandPassage":
      return (
        <div className={styles.appendixBandPassage}>
          {study.groups.slice(0, 4).map((group, index) => (
            <div className={styles.appendixBand} key={group}>
              <div className={styles.appendixBandTrack} data-appendix-band={String(index)}>
                {repeatFrames(tilesForGroup(group).slice(0, 3), 3).map((item) => (
                  <StudyTile key={item.repeatKey} item={item} caption={index === 0 ? labelFromGroup(group) : undefined} />
                ))}
              </div>
            </div>
          ))}
        </div>
      );
    case "nestedFrames":
      return (
        <div className={styles.appendixNestedFrames}>
          <div className={styles.appendixNestedOuter}>
            <StudySwitchTile items={tilesForGroup(study.groups[0]).slice(0, 2)} caption={labelFromGroup(study.groups[0])} priority />
            <div className={styles.appendixNestedMiddle}>
              <StudySwitchTile items={tilesForGroup(study.groups[1]).slice(0, 2)} caption={labelFromGroup(study.groups[1])} />
              <div className={styles.appendixNestedInner}>
                <StudySwitchTile items={tilesForGroup(study.groups[2]).slice(0, 2)} caption={labelFromGroup(study.groups[2])} />
              </div>
            </div>
          </div>
          <aside className={styles.appendixNestedSide}>
            {study.groups.slice(3).map((group) => (
              <StudySwitchTile key={group} items={tilesForGroup(group).slice(0, 2)} caption={labelFromGroup(group)} />
            ))}
          </aside>
        </div>
      );
    case "relayColumns":
      return (
        <div className={styles.appendixRelayColumns}>
          {study.groups.slice(0, 4).map((group, index) => (
            <div className={styles.appendixRelayColumn} key={group}>
              <div className={styles.appendixRelayTrack} data-appendix-column={String(index)}>
                {repeatFrames(tilesForGroup(group).slice(0, 2), 3).map((item) => (
                  <StudyTile key={item.repeatKey} item={item} caption={index === 0 ? labelFromGroup(group) : undefined} />
                ))}
              </div>
            </div>
          ))}
        </div>
      );
    case "offsetWall":
      return (
        <div className={styles.appendixOffsetWall}>
          {study.groups.slice(0, 6).map((group, index) => (
            <div
              className={`${styles.appendixOffsetCell} ${styles[`appendixOffsetCell${index + 1}` as keyof typeof styles]}`}
              key={group}
            >
              <StudySwitchTile
                items={tilesForGroup(group).slice(0, 2)}
                caption={labelFromGroup(group)}
                priority={index < 2}
              />
            </div>
          ))}
        </div>
      );
    default:
      return null;
  }
}

function AppendixStudySection({
  study,
  index,
}: {
  study: AppendixDefinition;
  index: number;
}) {
  return (
    <section
      className={styles.appendixStudy}
      data-appendix-study={study.slug}
      data-appendix-layout={study.layout}
      data-appendix-tone={study.tone}
      style={{ "--appendix-progress": "1", "--appendix-index": String(index), "--appendix-span": study.span } as CSSProperties}
    >
      <div className={styles.appendixStudyInner}>
        <header className={styles.appendixStudyHeader}>
          <div>
            <p className={styles.appendixStudyEyebrow}>{study.eyebrow}</p>
            <h2>{study.title}</h2>
          </div>
          <p className={styles.appendixStudyNote}>{study.note}</p>
        </header>
        <div className={styles.appendixStudyCanvas}>{renderAppendixLayout(study)}</div>
      </div>
    </section>
  );
}

function ChapterSection({
  chapter,
  startIndex,
}: {
  chapter: GalleryChapterDefinition;
  startIndex: number;
}) {
  return (
    <section className={styles.chapterBlock} data-chapter={chapter.slug}>
      <header className={styles.chapterHeader}>
        <p className={styles.chapterEyebrow}>{chapter.eyebrow}</p>
        <h2>{chapter.title}</h2>
        <p className={styles.chapterNote}>{chapter.note}</p>
      </header>
      <div className={styles.chapterRooms}>
        {chapter.rooms.map((room, index) => (
          <GalleryRoomSection key={room.slug} room={room} roomIndex={startIndex + index} />
        ))}
      </div>
    </section>
  );
}

function updateStackAtlasRoom(roomNode: HTMLElement, progress: number) {
  const stackPhase = windowProgress(progress, 0, 0.18);
  const cascadePhase = windowProgress(progress, 0.16, 0.46);
  const spreadPhase = windowProgress(progress, 0.42, 0.82);
  const holdPhase = windowProgress(progress, 0.78, 1);

  roomNode.style.setProperty("--phase-stack", stackPhase.toFixed(4));
  roomNode.style.setProperty("--phase-cascade", cascadePhase.toFixed(4));
  roomNode.style.setProperty("--phase-spread", spreadPhase.toFixed(4));
  roomNode.style.setProperty("--phase-hold", holdPhase.toFixed(4));

  const cards = Array.from(roomNode.querySelectorAll<HTMLElement>("[data-stack-card]"));
  cards.forEach((card, index) => {
    const deckX = index * 0.22;
    const deckY = index * 0.18;
    const cascadeX = -10 + index * 5.3;
    const cascadeY = (index % 2 === 0 ? -1 : 1) * (0.7 + index * 0.75);
    const wallCols = 4;
    const col = index % wallCols;
    const row = Math.floor(index / wallCols);
    const wallX = -22 + col * 15;
    const wallY = -12 + row * 20.2;
    const phaseX = mix(mix(deckX, cascadeX, cascadePhase), wallX, spreadPhase);
    const phaseY = mix(mix(deckY, cascadeY, cascadePhase), wallY, spreadPhase);
    const rotation = mix(
      mix(-6 + index * 2.25, (index % 2 === 0 ? -1 : 1) * (4 - index * 0.3), cascadePhase),
      0,
      spreadPhase + holdPhase * 0.35,
    );
    const scale = mix(0.92 + index * 0.008, 1.01, spreadPhase);
    const lift = mix(1.4 - index * 0.12, 0, spreadPhase);
    const opacity = clamp(0.32 + stackPhase * 0.16 + cascadePhase * 0.28 + spreadPhase * 0.42);
    const saturation = 0.84 + cascadePhase * 0.12 + holdPhase * 0.14;

    card.style.transform = `translate3d(${phaseX.toFixed(3)}rem, ${(phaseY - lift).toFixed(
      3,
    )}rem, 0) rotate(${rotation.toFixed(3)}deg) scale(${scale.toFixed(3)})`;
    card.style.opacity = opacity.toFixed(4);
    card.style.filter = `saturate(${saturation.toFixed(3)})`;
    card.style.zIndex = String(120 + index);
  });
}

function updateDuplexRailsRoom(roomNode: HTMLElement, progress: number) {
  const pauseStart = 0.34;
  const pauseEnd = 0.58;
  const pausePhase = clamp((progress - pauseStart) / Math.max(0.001, pauseEnd - pauseStart));
  roomNode.style.setProperty("--rails-pause", pausePhase.toFixed(4));

  const tracks = Array.from(roomNode.querySelectorAll<HTMLElement>("[data-rail-track]"));
  tracks.forEach((track, index) => {
    const direction = track.dataset.laneDirection === "1" ? 1 : -1;
    const paused = track.dataset.lanePause === "true";
    const weightedProgress = paused
      ? progress < pauseStart
        ? (progress / pauseStart) * 0.46
        : progress < pauseEnd
          ? 0.46
          : 0.46 + ((progress - pauseEnd) / (1 - pauseEnd)) * 0.54
      : clamp(progress * (index === 0 ? 0.94 : index === 2 ? 1.08 : 1));
    const xPercent = mix(-18, 16, weightedProgress) * direction;
    const yOffset = (index - 1) * 0.55 + Math.sin(progress * Math.PI * (index + 1)) * 0.18;
    track.style.transform = `translate3d(${xPercent.toFixed(3)}%, ${yOffset.toFixed(
      3,
    )}rem, 0)`;
  });
}

function updateClosingWallRoom(roomNode: HTMLElement, progress: number) {
  const occludePhase = windowProgress(progress, 0, 0.3);
  const revealPhase = windowProgress(progress, 0.24, 0.74);
  const settlePhase = windowProgress(progress, 0.68, 1);

  roomNode.style.setProperty("--phase-occlude", occludePhase.toFixed(4));
  roomNode.style.setProperty("--phase-reveal", revealPhase.toFixed(4));
  roomNode.style.setProperty("--phase-settle", settlePhase.toFixed(4));

  const wall = roomNode.querySelector<HTMLElement>("[data-closing-wall]");
  if (wall) {
    wall.style.opacity = clamp(0.14 + revealPhase * 0.78 + settlePhase * 0.12).toFixed(4);
    wall.style.transform = `translate3d(0, ${mix(2.2, 0, revealPhase + settlePhase * 0.2).toFixed(
      3,
    )}rem, 0) scale(${mix(0.96, 1, settlePhase).toFixed(3)})`;
  }

  const panels = Array.from(roomNode.querySelectorAll<HTMLElement>("[data-closing-panel]"));
  panels.forEach((panel, index) => {
    const revealX = index === 0 ? -18 : index === 2 ? 18 : 0;
    const settleX = index === 0 ? -13 : index === 2 ? 13 : 0;
    const yShift = index === 1 ? mix(0, -1.5, occludePhase) : mix(index === 0 ? 1 : -1, 0, revealPhase);
    const xShift = mix(0, revealX, revealPhase);
    const finalX = mix(xShift, settleX, settlePhase);
    const rotation = mix(index === 0 ? -3.4 : index === 2 ? 3.4 : 0, 0, revealPhase + settlePhase * 0.35);
    const clipInset = mix(13, 0, revealPhase + settlePhase * 0.4);

    panel.style.transform = `translate3d(${finalX.toFixed(3)}rem, ${yShift.toFixed(
      3,
    )}rem, 0) rotate(${rotation.toFixed(3)}deg)`;
    panel.style.setProperty("--closing-clip", `${clipInset.toFixed(3)}%`);
    panel.style.opacity = clamp(0.42 + revealPhase * 0.58).toFixed(4);
  });
}

function updateConnectedGridRoom(roomNode: HTMLElement, progress: number) {
  const cells = Array.from(roomNode.querySelectorAll<HTMLElement>(`.${styles.connectedCell}`));
  cells.forEach((cell, index) => {
    const xShift = (index % 2 === 0 ? -1 : 1) * mix(1.8, 0, progress);
    const yShift = mix(1.6 - index * 0.18, 0, progress);
    const scale = mix(0.94, 1, progress);
    cell.style.transform = `translate3d(${xShift.toFixed(3)}rem, ${yShift.toFixed(
      3,
    )}rem, 0) scale(${scale.toFixed(3)})`;
    cell.style.opacity = clamp(0.34 + progress * 0.66).toFixed(4);
  });
}

function updateMaskLedgerRoom(roomNode: HTMLElement, progress: number) {
  const columns = Array.from(roomNode.querySelectorAll<HTMLElement>(`.${styles.maskLedgerColumn}`));
  columns.forEach((column, index) => {
    const yShift = mix((index % 2 === 0 ? 1 : -1) * 1.2, 0, progress);
    const xShift = mix((index - 1.5) * 0.35, 0, progress);
    column.style.transform = `translate3d(${xShift.toFixed(3)}rem, ${yShift.toFixed(3)}rem, 0)`;
    column.style.opacity = clamp(0.42 + progress * 0.58).toFixed(4);
  });
}

function updateDrawerDepthRoom(roomNode: HTMLElement, progress: number) {
  const trays = Array.from(roomNode.querySelectorAll<HTMLElement>(`.${styles.drawerTray}`));
  trays.forEach((tray, index) => {
    const depth = mix(2.2 - index * 0.5, 0, progress);
    const side = index === 1 ? 1 : -1;
    tray.style.transform = `translate3d(${(side * depth).toFixed(3)}rem, ${(depth * 0.42).toFixed(
      3,
    )}rem, 0)`;
    tray.style.opacity = clamp(0.4 + progress * 0.6).toFixed(4);
  });
}

function applyRoomRuntimeState(roomNode: HTMLElement, progress: number) {
  roomNode.style.setProperty("--room-progress", progress.toFixed(4));
  roomNode.style.setProperty(
    "--room-active",
    progress > 0.02 && progress < 0.98 ? "1" : progress >= 0.98 ? "0.7" : "0",
  );

  switch (roomNode.dataset.roomType) {
    case "connectedGrid":
      updateConnectedGridRoom(roomNode, progress);
      break;
    case "maskLedger":
      updateMaskLedgerRoom(roomNode, progress);
      break;
    case "stackAtlas":
      updateStackAtlasRoom(roomNode, progress);
      break;
    case "duplexRails":
      updateDuplexRailsRoom(roomNode, progress);
      break;
    case "drawerDepth":
      updateDrawerDepthRoom(roomNode, progress);
      break;
    case "closingWall":
      updateClosingWallRoom(roomNode, progress);
      break;
    default:
      break;
  }
}

function applyAppendixRuntimeState(studyNode: HTMLElement, progress: number) {
  studyNode.style.setProperty("--appendix-progress", progress.toFixed(4));
  const layout = studyNode.dataset.appendixLayout;

  if (layout === "veilDock") {
    const panels = Array.from(studyNode.querySelectorAll<HTMLElement>(`.${styles.appendixVeilPanel}`));
    panels.forEach((panel, index) => {
      const shift = mix(index === 0 ? -1.4 : 1.4, 0, progress);
      panel.style.transform = `translate3d(${shift.toFixed(3)}rem, ${mix(1.2, 0, progress).toFixed(
        3,
      )}rem, 0)`;
    });
  }

  if (layout === "hingeFan") {
    const panels = Array.from(studyNode.querySelectorAll<HTMLElement>(`.${styles.appendixHingePanel}`));
    panels.forEach((panel, index) => {
      const swing = mix(-26 + index * 7, -6 + index * 1.5, progress);
      panel.style.transform = `translateY(${mix(2.2, 0, progress).toFixed(3)}rem) rotateY(${swing.toFixed(
        3,
      )}deg) rotateZ(${((index - 2) * 1.5).toFixed(3)}deg)`;
      panel.style.opacity = clamp(0.3 + progress * 0.7).toFixed(4);
    });
  }

  if (layout === "bandPassage") {
    const tracks = Array.from(studyNode.querySelectorAll<HTMLElement>("[data-appendix-band]"));
    tracks.forEach((track, index) => {
      const direction = index % 2 === 0 ? -1 : 1;
      const distance = mix(-12, 12, progress) * direction;
      track.style.transform = `translate3d(${distance.toFixed(3)}%, 0, 0)`;
    });
  }

  if (layout === "relayColumns") {
    const tracks = Array.from(studyNode.querySelectorAll<HTMLElement>("[data-appendix-column]"));
    tracks.forEach((track, index) => {
      const distance = index % 2 === 0 ? mix(0, -18, progress) : mix(0, 14, progress);
      track.style.transform = `translate3d(0, ${distance.toFixed(3)}%, 0)`;
    });
  }

  if (layout === "nestedFrames") {
    const outer = studyNode.querySelector<HTMLElement>(`.${styles.appendixNestedOuter}`);
    const middle = studyNode.querySelector<HTMLElement>(`.${styles.appendixNestedMiddle}`);
    const inner = studyNode.querySelector<HTMLElement>(`.${styles.appendixNestedInner}`);
    if (outer) {
      outer.style.transform = `translate3d(0, ${mix(1.4, 0, progress).toFixed(3)}rem, 0) scale(${mix(
        0.94,
        1,
        progress,
      ).toFixed(3)})`;
    }
    if (middle) {
      middle.style.transform = `translate3d(${mix(1.1, 0, progress).toFixed(3)}rem, ${mix(
        -0.8,
        0,
        progress,
      ).toFixed(3)}rem, 0)`;
    }
    if (inner) {
      inner.style.transform = `translate3d(${mix(-0.9, 0, progress).toFixed(3)}rem, ${mix(
        0.7,
        0,
        progress,
      ).toFixed(3)}rem, 0)`;
    }
  }

  if (layout === "offsetWall") {
    const cells = Array.from(studyNode.querySelectorAll<HTMLElement>(`.${styles.appendixOffsetCell}`));
    cells.forEach((cell, index) => {
      const xShift = (index % 2 === 0 ? -1 : 1) * mix(1.2, 0, progress);
      const yShift = ((index % 3) - 1) * mix(1.3, 0, progress);
      cell.style.transform = `translate3d(${xShift.toFixed(3)}rem, ${yShift.toFixed(3)}rem, 0)`;
      cell.style.opacity = clamp(0.34 + progress * 0.66).toFixed(4);
    });
  }
}

function applyResearchLabRuntimeState(
  studyNode: HTMLElement,
  variant: (typeof researchLabVariantKeys)[number],
  progress: number,
) {
  const boardNode = studyNode.querySelector<HTMLElement>("[data-product-board]");
  const stripNode = studyNode.querySelector<HTMLElement>("[data-research-strip]");
  const sceneNode = studyNode.querySelector<HTMLElement>("[data-research-scene]");
  const cardNodes = Array.from(studyNode.querySelectorAll<HTMLElement>("[data-research-card]"));
  const spreadNodes = Array.from(studyNode.querySelectorAll<HTMLElement>("[data-book-spread]"));
  const columnNodes = Array.from(studyNode.querySelectorAll<HTMLElement>("[data-research-column-stack]"));
  const eased = smoothStep(progress);

  if (variant === "ending-credits-crawl") {
    stripNode?.style.setProperty("--crawl-progress", progress.toFixed(4));
    if (sceneNode) {
      sceneNode.style.transform = `translate3d(${mix(-4.8, 4.2, eased).toFixed(3)}rem, ${mix(
        5.6,
        -2.2,
        eased,
      ).toFixed(3)}rem, 0) rotate(${mix(-26, -7, eased).toFixed(3)}deg) scale(${mix(0.9, 1.06, eased).toFixed(
        4,
      )})`;
    }
    cardNodes.forEach((cardNode, cardIndex) => {
      const left = cardIndex * mix(8.6, 10.4, eased);
      const top = 18 - cardIndex * mix(3.8, 5.8, eased) - eased * 8;
      const scale = 1 - cardIndex * mix(0.055, 0.075, eased);
      const lift = cardIndex * mix(-0.2, -0.7, eased);
      const bank = mix(-18, 12, eased) + cardIndex * 0.4;
      cardNode.style.left = `${left.toFixed(3)}rem`;
      cardNode.style.top = `${top.toFixed(3)}rem`;
      cardNode.style.transform = `translate3d(0, ${lift.toFixed(3)}rem, 0) scale(${scale.toFixed(
        4,
      )}) rotate(${bank.toFixed(3)}deg)`;
      cardNode.style.opacity = clamp(1 - cardIndex * 0.045).toFixed(4);
    });
    return;
  }

  if (variant === "isometric-fabric-atlas") {
    sceneNode?.style.setProperty("--atlas-progress", progress.toFixed(4));
    cardNodes.forEach((cardNode, cardIndex) => {
      const row = Number(cardNode.dataset.researchRow ?? 0);
      const column = Number(cardNode.dataset.researchColumn ?? 0);
      const left = 12 + column * 11.8 + row * 6.4 + eased * (column - 1.5) * 1.8;
      const top = 10 + row * 8.8 - column * 3.6 - eased * row * 1.2;
      const scale = 1 - row * 0.04 - column * 0.012 + eased * 0.05;
      const depth = (row + column) * 0.42 + eased * 1.8;
      const bank = -45 + eased * 8 - row * 0.6 + column * 0.4;
      cardNode.style.left = `${left.toFixed(3)}rem`;
      cardNode.style.top = `${top.toFixed(3)}rem`;
      cardNode.style.transform = `translate3d(0, 0, ${depth.toFixed(3)}rem) scale(${scale.toFixed(
        4,
      )}) rotate(${bank.toFixed(3)}deg)`;
      cardNode.style.zIndex = String(80 + cardIndex);
    });
    return;
  }

  if (variant === "hinged-specimen-book") {
    spreadNodes.forEach((spreadNode, spreadIndex) => {
      const spreadProgress = clamp(progress * 1.25 - spreadIndex * 0.16);
      const turn = mix(-68, 16, smoothStep(spreadProgress));
      const lift = mix(2.4, -1.2, smoothStep(spreadProgress));
      const depth = mix(-5.6, 2.2, smoothStep(spreadProgress));
      spreadNode.style.transform = `translate3d(${(spreadIndex * 0.6).toFixed(3)}rem, ${lift.toFixed(
        3,
      )}rem, ${depth.toFixed(3)}rem) rotateY(${turn.toFixed(3)}deg) rotateX(${mix(6, -2, eased).toFixed(
        3,
      )}deg)`;
      spreadNode.style.zIndex = String(120 - spreadIndex);
    });
    return;
  }

  if (variant === "curved-ribbon-tunnel") {
    sceneNode?.style.setProperty("--ribbon-progress", progress.toFixed(4));
    cardNodes.forEach((cardNode, cardIndex) => {
      const phase = progress * Math.PI * 1.15 + cardIndex * 0.42;
      const arc = Math.sin(phase);
      const travel = Math.cos(phase * 0.82);
      const left = 40 + arc * 21 + (cardIndex - 4.5) * 2.4;
      const top = 26 + cardIndex * 3.2 - eased * 22 + travel * 2.2;
      const depth = -cardIndex * 3.6 + eased * 14;
      const scale = 1 - cardIndex * 0.04 + eased * 0.06;
      const rotateY = arc * 26;
      const rotateZ = travel * 12;
      cardNode.style.left = `${left.toFixed(3)}rem`;
      cardNode.style.top = `${top.toFixed(3)}rem`;
      cardNode.style.transform = `translate3d(0, 0, ${depth.toFixed(3)}rem) scale(${scale.toFixed(
        4,
      )}) rotateY(${rotateY.toFixed(3)}deg) rotateZ(${rotateZ.toFixed(3)}deg)`;
      cardNode.style.zIndex = String(120 - cardIndex);
    });
    return;
  }

  columnNodes.forEach((columnNode, columnIndex) => {
    const cross = Math.sin(progress * Math.PI + columnIndex * 0.75);
    const left = mix(6, 14, columnIndex / Math.max(columnNodes.length - 1, 1)) + cross * 2.8;
    const depth = mix(-3.2, 4.4, smoothStep(progress)) + columnIndex * 1.4;
    const lift = Math.cos(progress * Math.PI * 1.2 + columnIndex) * 1.6;
    columnNode.style.transform = `translate3d(${left.toFixed(3)}rem, ${lift.toFixed(3)}rem, ${depth.toFixed(
      3,
    )}rem) rotateY(${mix(-12, 12, (cross + 1) / 2).toFixed(3)}deg)`;
    columnNode.style.zIndex = String(100 + columnIndex);
  });

  cardNodes.forEach((cardNode, cardIndex) => {
    const columnIndex = Math.floor(cardIndex / 4);
    const localIndex = cardIndex % 4;
    const lift = mix(0, -1.6, smoothStep(progress)) + localIndex * 0.08;
    const bank = (columnIndex - 1) * 4 + Math.sin(progress * Math.PI + localIndex * 0.5) * 4;
    cardNode.style.transform = `translate3d(0, ${lift.toFixed(3)}rem, 0) rotate(${bank.toFixed(3)}deg)`;
  });

  boardNode?.style.setProperty("--columns-progress", progress.toFixed(4));
}

function applyRailStudyRuntimeState(studyNode: HTMLElement, progress: number) {
  const roomScene = studyNode.querySelector<HTMLElement>("[data-product-room]");
  if (roomScene) {
    applyRoomRuntimeState(roomScene, progress);
  }

  const appendixScene = studyNode.querySelector<HTMLElement>("[data-product-appendix]");
  if (appendixScene) {
    applyAppendixRuntimeState(appendixScene, progress);
  }

  const layout = studyNode.dataset.railLayout as RailStudyLayout | undefined;
  const productVariant = studyNode.dataset.productVariant as ProductRailVariant | undefined;
  const orbitalConfig = isOrbitalInspectionVariant(productVariant)
    ? readOrbitalConfigFromNode(studyNode)
    : null;
  if (orbitalConfig?.debugScroll != null) {
    progress = clamp(orbitalConfig.debugScroll);
  }

  studyNode.style.setProperty("--rail-study-progress", progress.toFixed(4));
  const revealBase = windowProgress(progress, 0.12, 0.34);
  const holdBase = windowProgress(progress, 0.26, 0.88);
  const exitBase = windowProgress(progress, 0.9, 1);
  const archiveNode = studyNode.querySelector<HTMLElement>("[data-product-archive]");
  const boardNode = studyNode.querySelector<HTMLElement>("[data-product-board]");
  const runwayStripNode = studyNode.querySelector<HTMLElement>("[data-runway-strip]");
  const runwayCardNodes = Array.from(studyNode.querySelectorAll<HTMLElement>("[data-runway-card]"));
  const ver7RowNodes = Array.from(studyNode.querySelectorAll<HTMLElement>("[data-ver7-row]"));
  const laneSectionNodes = Array.from(studyNode.querySelectorAll<HTMLElement>("[data-product-lane]"));
  const laneRigNodes = Array.from(studyNode.querySelectorAll<HTMLElement>("[data-product-lane-rig]"));
  const laneNodes = Array.from(studyNode.querySelectorAll<HTMLElement>("[data-rail-study-track]"));
  const orbitalCtaNode = studyNode.querySelector<HTMLElement>('[data-product-lane="cta"]');

  if (productVariant) {
    studyNode.style.setProperty("--variant-progress", progress.toFixed(4));
    studyNode.style.setProperty("--variant-aperture", mix(8, 92, smoothStep(progress)).toFixed(3));
    studyNode.style.setProperty("--variant-wave", ((Math.sin(progress * Math.PI * 2) + 1) / 2).toFixed(4));
    studyNode.style.setProperty("--variant-parallax", (Math.cos(progress * Math.PI * 2) * 0.5 + 0.5).toFixed(4));
    studyNode.style.setProperty("--variant-runway", smoothStep(progress).toFixed(4));
  }

  if (productVariant && isAnyThreeDimensionalVariant(productVariant) && archiveNode && boardNode) {
    const profile = isResearchLabVariant(productVariant)
      ? researchLabMotionProfile(productVariant, progress)
      : threeDimensionalLabMotionProfile(productVariant, progress, orbitalConfig ?? undefined);

    boardNode.style.setProperty("--scene-rotate-x", `${profile.pitch.toFixed(3)}deg`);
    boardNode.style.setProperty("--scene-rotate-y", `${profile.yaw.toFixed(3)}deg`);
    boardNode.style.setProperty("--scene-rotate-z", `${profile.bank.toFixed(3)}deg`);
    boardNode.style.setProperty("--scene-translate-x", `${profile.lateral.toFixed(3)}rem`);
    boardNode.style.setProperty("--scene-translate-y", `${profile.vertical.toFixed(3)}rem`);
    boardNode.style.setProperty("--scene-translate-z", `${profile.depth.toFixed(3)}rem`);
    boardNode.style.setProperty("--scene-scale", profile.scale.toFixed(4));

    archiveNode.style.setProperty("--lab-aura", profile.aura.toFixed(4));
    archiveNode.style.setProperty("--lab-sheen", profile.sheen.toFixed(4));
    archiveNode.style.setProperty("--lab-floor", profile.floor.toFixed(4));

    if (orbitalConfig && isOrbitalInspectionVariant(productVariant)) {
      const family = orbitalConfig.familyTuning;
      const driftWindow = Math.sin(progress * Math.PI * 2 - Math.PI / 2) * family.drift;
      const sweepWindow = Math.sin(Math.PI * windowProgress(progress, 0.08, 0.92)) * family.lightSweep;
      const finaleWindow = smoothStep(windowProgress(progress, 0.68, 1)) * family.finaleBias;
      const perspectiveX = 26 + driftWindow * 10 + family.torsion * 2;
      const perspectiveY = 30 - family.lift * 3 - sweepWindow * 1.5;

      studyNode.style.setProperty("--orbital-perspective-x", `${perspectiveX.toFixed(3)}%`);
      studyNode.style.setProperty("--orbital-perspective-y", `${perspectiveY.toFixed(3)}%`);
      studyNode.style.setProperty("--orbital-aura-shift-x", `${(driftWindow * 1.6).toFixed(3)}rem`);
      studyNode.style.setProperty("--orbital-aura-shift-y", `${(-family.lift * 0.8 - finaleWindow * 0.9).toFixed(3)}rem`);
      boardNode.style.setProperty("--orbital-sheen-tilt", `${(sweepWindow * 18 + driftWindow * 6).toFixed(3)}deg`);
      boardNode.style.setProperty("--orbital-edge-emphasis", (1 + family.torsion * 0.36 + family.finaleBias * 0.18).toFixed(4));
      boardNode.style.setProperty("--orbital-board-skew", `${(driftWindow * 1.4).toFixed(3)}deg`);

      let orbitalCtaFocus = 0;
      if (typeof window !== "undefined" && orbitalCtaNode) {
        const ctaRect = orbitalCtaNode.getBoundingClientRect();
        const viewportCenter = window.innerHeight * 0.5;
        const ctaCenter = ctaRect.top + ctaRect.height * 0.5;
        const ctaDistance = Math.abs(ctaCenter - viewportCenter);
        const centerWindow = Math.max(window.innerHeight * 0.9, 1);
        const proximity = clamp(1 - ctaDistance / centerWindow);
        const lateStage = smoothStep(windowProgress(progress, 0.62, 1));
        orbitalCtaFocus = Math.pow(proximity, 0.72) * lateStage;
      }

      studyNode.style.setProperty("--orbital-cta-focus", orbitalCtaFocus.toFixed(4));
    }

    if (
      orbitalConfig?.debugEnabled &&
      typeof window !== "undefined" &&
      process.env.NODE_ENV !== "production"
    ) {
      const metrics: OrbitalDebugMetrics = {
        presetKey: orbitalConfig.presetKey,
        familyKey: orbitalConfig.familyKey,
        progress,
        layers: orbitalConfig.layers,
        motion: {
          spanDvh: orbitalConfig.motion.spanDvh,
          settleStart: orbitalConfig.motion.settleStart,
          endYaw: orbitalConfig.motion.endYaw,
          endPitch: orbitalConfig.motion.endPitch,
          endBank: orbitalConfig.motion.endBank,
          endLateral: orbitalConfig.motion.endLateral,
          endVertical: orbitalConfig.motion.endVertical,
          endDepth: orbitalConfig.motion.endDepth,
        },
        familyTuning: orbitalConfig.familyTuning,
        pose: {
          yaw: profile.yaw,
          pitch: profile.pitch,
          bank: profile.bank,
          lateral: profile.lateral,
          vertical: profile.vertical,
          depth: profile.depth,
          scale: profile.scale,
        },
      };

      const debugWindow = window as typeof window & { __orbitalInspectionDebug?: OrbitalDebugMetrics };
      debugWindow.__orbitalInspectionDebug = metrics;
      window.dispatchEvent(new CustomEvent<OrbitalDebugMetrics>("orbital-inspection-debug", { detail: metrics }));
    }

    if (isResearchLabVariant(productVariant)) {
      applyResearchLabRuntimeState(studyNode, productVariant, progress);
    } else if (productVariant === "depth-runway-stack") {
      const perspective = Math.sin(Math.PI * windowProgress(progress, 0.08, 0.88));
      boardNode.style.setProperty("--runway-shift-x", `${mix(-1.8, 2.8, smoothStep(progress)).toFixed(3)}rem`);
      boardNode.style.setProperty("--runway-shift-y", `${mix(0.8, -0.9, smoothStep(progress)).toFixed(3)}rem`);
      boardNode.style.setProperty("--runway-scale", `${(0.985 + perspective * 0.075).toFixed(4)}`);
      boardNode.style.setProperty("--runway-step-x", `${mix(6.2, 8.4, perspective).toFixed(3)}rem`);
      boardNode.style.setProperty("--runway-step-y", `${mix(-0.5, -1.5, perspective).toFixed(3)}rem`);
      boardNode.style.setProperty("--runway-shrink", `${mix(0.045, 0.072, perspective).toFixed(4)}`);

      if (runwayStripNode) {
        const stripTravel = smoothStep(progress);
        runwayStripNode.style.transform = `translate3d(${mix(-5.4, 4.8, stripTravel).toFixed(3)}rem, ${mix(
          2.8,
          -1.6,
          stripTravel,
        ).toFixed(3)}rem, 0) rotate(${mix(-10, 7, stripTravel).toFixed(3)}deg) scale(${mix(
          0.95,
          1.06,
          perspective,
        ).toFixed(4)})`;
      }

      if (runwayCardNodes.length > 0) {
        const stripTravel = smoothStep(progress);
        runwayCardNodes.forEach((cardNode, cardIndex) => {
          const left = cardIndex * mix(5.8, 8.9, perspective);
          const top = 11 + cardIndex * mix(-0.25, -1.85, perspective) + Math.sin(progress * Math.PI * 1.2) * cardIndex * 0.18;
          const scale = 1 - cardIndex * mix(0.028, 0.062, perspective);
          const rotation = cardIndex * 0.14 + (stripTravel - 0.5) * 3.4;
          const lift = (0.5 - stripTravel) * cardIndex * 0.16;

          cardNode.style.left = `${left.toFixed(3)}rem`;
          cardNode.style.top = `${top.toFixed(3)}rem`;
          cardNode.style.transform = `translate3d(0, ${lift.toFixed(3)}rem, 0) scale(${scale.toFixed(
            4,
          )}) rotate(${rotation.toFixed(3)}deg)`;
        });
      }
    } else {
      boardNode.style.setProperty("--runway-shift-x", "0rem");
      boardNode.style.setProperty("--runway-shift-y", "0rem");
      boardNode.style.setProperty("--runway-scale", "1");
      boardNode.style.setProperty("--runway-step-x", "6.2rem");
      boardNode.style.setProperty("--runway-step-y", "-0.5rem");
      boardNode.style.setProperty("--runway-shrink", "0.045");

      if (runwayStripNode) {
        runwayStripNode.style.transform = "";
      }

      if (runwayCardNodes.length > 0) {
        runwayCardNodes.forEach((cardNode) => {
          cardNode.style.left = "";
          cardNode.style.top = "";
          cardNode.style.transform = "";
        });
      }
    }

    if (laneRigNodes.length > 0) {
      const center = (laneRigNodes.length - 1) / 2;
      laneRigNodes.forEach((rig, laneIndex) => {
        const signed = center === 0 ? 0 : (laneIndex - center) / center;
        const depthWeight = 1 - Math.abs(signed) * 0.45;
        let laneDepth = profile.laneDepth * depthWeight;
        let laneTiltY = profile.laneYaw * signed;
        let laneTiltX = profile.lanePitch * (Math.abs(signed) - 0.5);
        let laneVertical = profile.laneLift * signed;
        let laneLateral = profile.laneSpread * signed;
        let laneScale = 0.986 + depthWeight * 0.02;

        if (orbitalConfig && isOrbitalInspectionVariant(productVariant)) {
          const family = orbitalConfig.familyKey;
          const finale = smoothStep(windowProgress(progress, 0.68, 1));
          const inspect = Math.sin(Math.PI * windowProgress(progress, 0.14, 0.84));

          if (family === "torsion-reveal") {
            laneDepth += Math.abs(signed) * 1.8;
            laneTiltY += signed * 10;
            laneTiltX += signed * 8 + (laneIndex % 2 === 0 ? -4 : 4);
            laneVertical += signed * 0.9;
            laneLateral += signed * 0.7;
            laneScale -= Math.abs(signed) * 0.03;
          } else if (family === "apex-lift-finale") {
            const rightBias = Math.max(0, signed);
            laneDepth += rightBias * (1.4 + finale * 3.2);
            laneTiltY += signed * 5 + rightBias * finale * 12;
            laneTiltX += rightBias * finale * 16;
            laneVertical -= rightBias * (0.8 + finale * 2.6);
            laneLateral += signed * 0.9 + rightBias * finale * 1.4;
            laneScale -= rightBias * 0.08;
          } else if (family === "parallax-shear") {
            laneDepth += laneIndex * 0.35;
            laneTiltY += signed * 14;
            laneTiltX += signed * -6;
            laneVertical += signed * 0.3;
            laneLateral += signed * 2.4 + laneIndex * 0.18;
            laneScale -= Math.abs(signed) * 0.05;
          } else if (family === "halo-scan") {
            laneDepth += Math.sin(progress * Math.PI * 2 + laneIndex * 0.7) * 0.6;
            laneTiltY += signed * 3;
            laneTiltX += Math.sin(progress * Math.PI * 2 + laneIndex * 0.55) * 2.6;
            laneVertical += Math.cos(progress * Math.PI * 2 + laneIndex * 0.8) * 0.34;
            laneLateral += signed * 0.35;
            laneScale += inspect * 0.01;
          } else {
            laneDepth += Math.abs(signed) * 0.4;
            laneTiltY += signed * 4;
            laneTiltX += signed * 2.4;
            laneVertical += signed * 0.24;
            laneLateral += signed * 0.4;
          }
        }

        rig.style.setProperty("--lane-depth-z", `${laneDepth.toFixed(3)}rem`);
        rig.style.setProperty("--lane-tilt-y", `${laneTiltY.toFixed(3)}deg`);
        rig.style.setProperty("--lane-tilt-x", `${laneTiltX.toFixed(3)}deg`);
        rig.style.setProperty("--lane-vertical-offset", `${laneVertical.toFixed(3)}rem`);
        rig.style.setProperty("--lane-lateral-offset", `${laneLateral.toFixed(3)}rem`);
        rig.style.setProperty("--lane-scale", `${laneScale.toFixed(4)}`);
        rig.style.zIndex = String(140 - Math.round(Math.abs(signed) * 16));
      });
    }
  }

  if (productVariant === "ver7" && archiveNode && ver7RowNodes.length > 0) {
    const stageProgresses = [
      windowProgress(progress, 0.06, 0.24),
      windowProgress(progress, 0.2, 0.4),
      windowProgress(progress, 0.36, 0.58),
      windowProgress(progress, 0.54, 0.76),
    ];
    const wallProgress = stageProgresses[3];
    const ctaProgress = windowProgress(progress, 0.76, 0.94);
    const activeStage = stageProgresses.reduce((current, value, index) => (
      value > 0.01 ? index + 1 : current
    ), 0);

    archiveNode.dataset.ver7Stage = String(activeStage);
    archiveNode.style.setProperty("--ver7-stage-1", stageProgresses[0].toFixed(4));
    archiveNode.style.setProperty("--ver7-stage-2", stageProgresses[1].toFixed(4));
    archiveNode.style.setProperty("--ver7-stage-3", stageProgresses[2].toFixed(4));
    archiveNode.style.setProperty("--ver7-stage-4", stageProgresses[3].toFixed(4));
    archiveNode.style.setProperty("--ver7-wall-progress", wallProgress.toFixed(4));
    archiveNode.style.setProperty("--ver7-cta-progress", ctaProgress.toFixed(4));

    ver7RowNodes.forEach((rowNode, rowIndex) => {
      const rowRole = rowNode.dataset.rowRole;
      const rowDelay = rowRole === "cta" ? 0.82 : 0.1 + rowIndex * 0.062;
      const rowDuration = rowRole === "cta" ? 0.14 : 0.19;
      const stairProgress = smoothStep(clamp((progress - rowDelay) / rowDuration));
      const rowProgress = rowRole === "cta"
        ? stairProgress
        : clamp(stairProgress * 0.82 + wallProgress * 0.18);
      rowNode.style.setProperty("--ver7-row-progress", rowProgress.toFixed(4));
    });

    studyNode.style.setProperty("--rail-study-reveal", wallProgress.toFixed(4));
    studyNode.style.setProperty("--rail-study-hold", "1.0000");
    studyNode.style.setProperty("--rail-study-exit", "0.0000");
    return;
  }

  if (laneNodes.length === 0) {
    studyNode.style.setProperty("--rail-study-reveal", revealBase.toFixed(4));
    studyNode.style.setProperty("--rail-study-hold", holdBase.toFixed(4));
    studyNode.style.setProperty("--rail-study-exit", exitBase.toFixed(4));
    return;
  }

  if (productVariant === "ver7" && archiveNode && laneSectionNodes.length > 1 && laneRigNodes.length > 0) {
    const rowPitch = Math.max(laneSectionNodes[1].offsetTop - laneSectionNodes[0].offsetTop, 1);
    studyNode.style.setProperty("--stack-shift-y", "0px");
    studyNode.style.setProperty("--lane-row-pitch", `${rowPitch.toFixed(3)}px`);

    laneRigNodes.forEach((rig, laneIndex) => {
      const viewportNode = rig.parentElement;

      rig.dataset.laneCenterDistance = "0.0000";
      if (viewportNode) {
        viewportNode.dataset.laneSide = "center";
      }
      rig.style.transformOrigin = "50% 50%";
      rig.style.setProperty("--lane-center-distance", "0.0000");
      rig.style.setProperty("--lane-center-abs", "0.0000");
      rig.style.setProperty("--lane-center-proximity", "1.0000");
      rig.style.setProperty("--lane-tilt-x", "0deg");
      rig.style.setProperty("--lane-tilt-y", "0deg");
      rig.style.setProperty("--lane-depth-z", "0px");
      rig.style.setProperty("--lane-scale", "1.0000");
      rig.style.setProperty("--lane-blur", "0px");
      rig.style.setProperty("--lane-opacity", "1.0000");
      rig.style.setProperty("--lane-vertical-offset", "0px");
      rig.style.setProperty("--lane-lateral-offset", "0px");
      rig.style.zIndex = String(160 - laneIndex);
    });
  }

  laneNodes.forEach((track, laneIndex) => {
    const direction = Number(track.dataset.laneDirection ?? (laneIndex % 2 === 0 ? -1 : 1));
    if (track.classList.contains(styles.productRailRowTrack)) {
      const reveal = productVariant === "ver7"
        ? smoothStep(clamp(progress / 0.18))
        : smoothStep(clamp((progress - 0.12 - laneIndex * 0.055) / 0.24));
      const baseDuration = Number(track.dataset.baseDuration ?? 40);
      let duration = baseDuration;

      if (productVariant === "ver2") {
        duration = baseDuration + (laneIndex % 3) * 1.6 - reveal * 1.1;
      } else if (productVariant === "ver3") {
        duration = mix(baseDuration * 1.14, baseDuration * 0.84, smoothStep((Math.sin(progress * Math.PI * 3 + laneIndex * 0.75) + 1) / 2));
      } else if (productVariant === "ver4") {
        duration = baseDuration + Math.sin(progress * Math.PI * 2 + laneIndex * 0.55) * 0.9;
      } else if (productVariant === "ver5") {
        duration = baseDuration + laneIndex * 0.35;
      } else if (productVariant === "ver6") {
        duration = baseDuration + (laneIndex < 4 ? -1.2 : 1.4);
      } else if (productVariant === "ver7") {
        duration = baseDuration + Math.cos(progress * Math.PI * 2 + laneIndex * 0.4) * 0.35;
      } else if (productVariant === "ver8") {
        duration = laneIndex < 4 ? baseDuration * 1.18 : baseDuration * 0.82;
      } else if (productVariant === "ver9") {
        duration = baseDuration + Math.sin(progress * Math.PI * 4 + laneIndex * 1.4) * 1.2;
      } else if (productVariant === "ver10") {
        duration = laneIndex < 3 ? baseDuration * 1.08 : laneIndex > 5 ? baseDuration * 0.88 : baseDuration;
      } else if (productVariant && isAnyThreeDimensionalVariant(productVariant)) {
        duration = baseDuration + (laneIndex - 3.5) * 0.22;
      }

      track.style.opacity = productVariant === "ver7" ? "1.0000" : reveal.toFixed(4);
      track.style.animationDuration = `${Math.max(duration, 18).toFixed(3)}s`;
      track.style.setProperty("--rail-entry", reveal.toFixed(4));
      track.style.setProperty("--rail-hold", productVariant === "ver7" ? "1.0000" : clamp(reveal * 1.08).toFixed(4));
      track.style.setProperty("--rail-exit", "0.0000");
      track.style.setProperty("--rail-direction", String(direction));
      track.style.setProperty("--lane-reveal", reveal.toFixed(4));
      track.style.setProperty("--velocity-shift", ((baseDuration - duration) / Math.max(baseDuration, 1)).toFixed(4));
      track.style.setProperty("--caption-phase", (progress * Math.PI * 2 + laneIndex * 0.54).toFixed(4));
      track.style.setProperty(
        "--lane-float",
        productVariant === "ver7" || (productVariant && isAnyThreeDimensionalVariant(productVariant))
          ? "0.0000"
          : (Math.sin(progress * Math.PI * 2 + laneIndex * 0.65) * 0.7).toFixed(4),
      );
      track.style.setProperty(
        "--lane-scale-runtime",
        productVariant === "ver7" || (productVariant && isThreeDimensionalLabVariant(productVariant))
          ? "1.0000"
          : mix(0.985, 1.02, reveal).toFixed(4),
      );
      track.style.setProperty(
        "--caption-shift",
        productVariant === "ver7" || (productVariant && isThreeDimensionalLabVariant(productVariant))
          ? "0rem"
          : `${(Math.sin(progress * Math.PI * 4 + laneIndex * 0.9) * 0.5).toFixed(4)}rem`,
      );
      track.style.setProperty(
        "--caption-opacity",
        productVariant === "ver7"
          ? "1.0000"
          : productVariant && isThreeDimensionalLabVariant(productVariant)
            ? mix(0.88, 1, reveal).toFixed(4)
            : mix(0.76, 1, reveal).toFixed(4),
      );
      return;
    }

    const stagger = laneIndex * 0.045;
    const reveal = smoothStep(clamp((progress - 0.12 - stagger) / 0.22));
    const hold = smoothStep(clamp((progress - 0.28 - stagger * 0.5) / 0.54));
    const exit = smoothStep(clamp((progress - 0.9 - laneIndex * 0.008) / 0.1));

    let entryDistance = 26;
    let holdShift = 0;
    let exitDistance = 16;

    switch (layout) {
      case "serialShelf":
        entryDistance = 22;
        holdShift = 0;
        exitDistance = 12;
        break;
      case "duplexSlow":
        entryDistance = 34;
        holdShift = direction * 4;
        exitDistance = 18;
        break;
      case "quietConveyor":
        entryDistance = 16;
        holdShift = direction * -6 * hold;
        exitDistance = 10;
        break;
      case "lateExitArchive":
        entryDistance = 24;
        holdShift = 0;
        exitDistance = 10;
        break;
      case "opposedLedger":
        entryDistance = laneIndex < 2 ? 28 : 20;
        holdShift = laneIndex < 2 ? -3 : 3;
        exitDistance = 16;
        break;
      case "holdRail":
        entryDistance = 18;
        holdShift = 0;
        exitDistance = 8;
        break;
      case "staggeredShelf":
        entryDistance = 26 + laneIndex * 4;
        holdShift = 0;
        exitDistance = 14;
        break;
      case "softDuplex":
        entryDistance = 20;
        holdShift = direction * 2;
        exitDistance = 10;
        break;
      case "splitHold":
        entryDistance = laneIndex < 2 ? 24 : 30;
        holdShift = laneIndex < 2 ? -4 : 4;
        exitDistance = 14;
        break;
      case "archiveBelt":
        entryDistance = 14;
        holdShift = direction * -10 * hold;
        exitDistance = 8;
        break;
      default:
        break;
    }

    const entryX = mix(direction * entryDistance, holdShift, reveal);
    const x = mix(entryX, holdShift - direction * exitDistance, exit);
    const opacity = reveal > 0.03 ? 1 - exit * 0.96 : 0;

    track.style.transform = `translate3d(${x.toFixed(3)}rem, 0, 0)`;
    track.style.opacity = opacity.toFixed(4);
    track.style.setProperty("--rail-entry", reveal.toFixed(4));
    track.style.setProperty("--rail-hold", hold.toFixed(4));
    track.style.setProperty("--rail-exit", exit.toFixed(4));
  });

  studyNode.style.setProperty("--rail-study-reveal", revealBase.toFixed(4));
  studyNode.style.setProperty("--rail-study-hold", holdBase.toFixed(4));
  studyNode.style.setProperty("--rail-study-exit", exitBase.toFixed(4));
}

export default function MotionHouseShowcase({
  mode = "full",
  roomSlug,
  railStudySlug,
  previewQuery = "",
}: {
  mode?: MotionHouseShowcaseMode;
  roomSlug?: string;
  railStudySlug?: string;
  previewQuery?: string;
}) {
  const familyZonesTwoInsertOnly = mode === "family-zones-2-insert";
  const preRailOnly = mode === "family-zones-3-prerail";
  const familyZonesThreeOnly = mode === "family-zones-3";
  const productLabOnly = mode === "product-lab";
  const productLabVer12Only = mode === "product-lab-ver12";
  const duplexRailsRoomOnly = mode === "duplex-rails-room";
  const singleRoomPreview = Boolean(roomSlug);
  const singleRailStudyPreview = Boolean(railStudySlug);
  const showFamilyZonesTwo =
    familyZonesTwoInsertOnly ||
    (mode === "full" && !singleRoomPreview && !singleRailStudyPreview && !duplexRailsRoomOnly);
  const showFamilyZonesThree =
    !familyZonesTwoInsertOnly &&
    !productLabOnly &&
    !productLabVer12Only &&
    !duplexRailsRoomOnly &&
    !singleRoomPreview &&
    !singleRailStudyPreview;
  const [progress, setProgress] = useState(0.14);
  const [secondProgress, setSecondProgress] = useState(0.12);
  const [thirdProgress, setThirdProgress] = useState(0.08);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [ready, setReady] = useState(false);
  const shellRef = useRef<HTMLElement | null>(null);
  const trackRef = useRef<HTMLElement | null>(null);
  const secondTrackRef = useRef<HTMLElement | null>(null);
  const thirdTrackRef = useRef<HTMLElement | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const secondViewportRef = useRef<HTMLDivElement | null>(null);
  const thirdViewportRef = useRef<HTMLDivElement | null>(null);

  const zones = useMemo(
    () => zoneDefinitions.filter((zone) => tilesForGroup(zone.key).length > 0),
    [],
  );
  const zonesThree = useMemo(
    () => familyZonesThreeLayout.filter((zone) => tilesForGroup(zone.key).length > 0),
    [],
  );
  const previewRoomDefinition = useMemo(() => {
    const slug = roomSlug ?? (duplexRailsRoomOnly ? duplexRailsRoomSlug : undefined);
    return slug ? galleryRooms.find((room) => room.slug === slug) ?? null : null;
  }, [duplexRailsRoomOnly, roomSlug]);
  const previewRoomIndex = useMemo(() => {
    if (!previewRoomDefinition) {
      return 0;
    }
    return galleryRooms.findIndex((room) => room.slug === previewRoomDefinition.slug);
  }, [previewRoomDefinition]);
  const previewRailStudies = useMemo(() => {
    if (!railStudySlug) {
      return [];
    }
    return [...baselineRailStudyDefinitions, ...threeDimensionalLabDefinitions, ...researchLabDefinitions].filter(
      (study) => study.slug === railStudySlug,
    );
  }, [railStudySlug]);
  const orbitalPreviewStudy = useMemo(() => {
    if (previewRailStudies.length !== 1) {
      return null;
    }

    const [study] = previewRailStudies;
    return isOrbitalInspectionVariant(study.variantKey) ? study : null;
  }, [previewRailStudies]);
  const serverResolvedOrbitalConfig = useMemo(
    () => (orbitalPreviewStudy ? resolveOrbitalInspectionConfig(previewQuery) : null),
    [orbitalPreviewStudy, previewQuery],
  );
  const [orbitalConfig, setOrbitalConfig] = useState<OrbitalResolvedConfig | null>(serverResolvedOrbitalConfig);
  const [orbitalDebug, setOrbitalDebug] = useState<OrbitalDebugMetrics | null>(null);
  const effectiveOrbitalConfig = orbitalConfig ?? serverResolvedOrbitalConfig;
  const orbitalRuntimeKey = effectiveOrbitalConfig ? serializeOrbitalInspectionConfig(effectiveOrbitalConfig) : "";

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => setReducedMotion(mediaQuery.matches);
    updatePreference();

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", updatePreference);
      return () => mediaQuery.removeEventListener("change", updatePreference);
    }

    mediaQuery.addListener(updatePreference);
    return () => mediaQuery.removeListener(updatePreference);
  }, []);

  useEffect(() => {
    if (!orbitalPreviewStudy) {
      setOrbitalConfig(null);
      setOrbitalDebug(null);
      return;
    }

    const syncFromLocation = () => {
      setOrbitalConfig(resolveOrbitalInspectionConfig(window.location.search || previewQuery));
    };

    syncFromLocation();
    window.addEventListener("popstate", syncFromLocation);
    return () => window.removeEventListener("popstate", syncFromLocation);
  }, [orbitalPreviewStudy, previewQuery]);

  useEffect(() => {
    if (!effectiveOrbitalConfig?.debugEnabled) {
      setOrbitalDebug(null);
      return;
    }

    const handleDebug = (event: Event) => {
      const customEvent = event as CustomEvent<OrbitalDebugMetrics>;
      setOrbitalDebug(customEvent.detail);
    };

    window.addEventListener("orbital-inspection-debug", handleDebug as EventListener);
    return () => window.removeEventListener("orbital-inspection-debug", handleDebug as EventListener);
  }, [effectiveOrbitalConfig?.debugEnabled]);

  const updateOrbitalLocation = (nextConfig: OrbitalResolvedConfig, forceReload = false) => {
    const nextSearch = serializeOrbitalInspectionConfig(nextConfig);
    const nextUrl = `${window.location.pathname}?${nextSearch}`;

    if (forceReload) {
      window.location.assign(nextUrl);
      return;
    }

    window.history.replaceState(null, "", nextUrl);
    setOrbitalConfig(nextConfig);
  };

  const applyOrbitalPreset = (presetKey: OrbitalPresetKey) => {
    if (!effectiveOrbitalConfig) {
      return;
    }

    const nextConfig = {
      ...createOrbitalResolvedConfig({
        presetKey,
        familyKey: effectiveOrbitalConfig.familyKey,
      }),
      controlsEnabled: effectiveOrbitalConfig.controlsEnabled,
      debugEnabled: effectiveOrbitalConfig.debugEnabled,
      debugScroll: effectiveOrbitalConfig.debugScroll,
    };

    updateOrbitalLocation(
      nextConfig,
      nextConfig.layers.previewChrome !== effectiveOrbitalConfig.layers.previewChrome,
    );
  };

  const resetOrbitalPreset = () => {
    if (!effectiveOrbitalConfig) {
      return;
    }

    const nextConfig = {
      ...createOrbitalResolvedConfig({
        presetKey: effectiveOrbitalConfig.presetKey,
        familyKey: effectiveOrbitalConfig.familyKey,
      }),
      controlsEnabled: effectiveOrbitalConfig.controlsEnabled,
      debugEnabled: effectiveOrbitalConfig.debugEnabled,
      debugScroll: effectiveOrbitalConfig.debugScroll,
    };

    updateOrbitalLocation(
      nextConfig,
      nextConfig.layers.previewChrome !== effectiveOrbitalConfig.layers.previewChrome,
    );
  };

  const updateOrbitalFamily = (familyKey: OrbitalMotionFamilyKey) => {
    if (!effectiveOrbitalConfig) {
      return;
    }

    const nextConfig = {
      ...effectiveOrbitalConfig,
      familyKey,
      familyTuning: {
        ...orbitalMotionFamilyCatalog[familyKey].tuning,
      },
    };

    updateOrbitalLocation(nextConfig);
  };

  const updateOrbitalFamilyTuning = (field: keyof OrbitalFamilyTuning, value: number) => {
    if (!effectiveOrbitalConfig) {
      return;
    }

    updateOrbitalLocation({
      ...effectiveOrbitalConfig,
      familyTuning: {
        ...effectiveOrbitalConfig.familyTuning,
        [field]: value,
      },
    });
  };

  const updateOrbitalMotion = (field: keyof OrbitalMotionConfig, value: number) => {
    if (!effectiveOrbitalConfig) {
      return;
    }

    updateOrbitalLocation({
      ...effectiveOrbitalConfig,
      motion: {
        ...effectiveOrbitalConfig.motion,
        [field]: value,
      },
    });
  };

  const updateOrbitalLayer = (field: keyof OrbitalLayerConfig, value: boolean) => {
    if (!effectiveOrbitalConfig) {
      return;
    }

    const nextConfig = {
      ...effectiveOrbitalConfig,
      layers: {
        ...effectiveOrbitalConfig.layers,
        [field]: value,
      },
    };

    updateOrbitalLocation(nextConfig, field === "previewChrome");
  };

  const updateOrbitalDebug = (value: boolean) => {
    if (!effectiveOrbitalConfig) {
      return;
    }

    updateOrbitalLocation({
      ...effectiveOrbitalConfig,
      debugEnabled: value,
    });
  };

  const copyOrbitalUrl = async () => {
    if (!effectiveOrbitalConfig) {
      return;
    }

    const nextSearch = serializeOrbitalInspectionConfig(effectiveOrbitalConfig);
    const nextUrl = `${window.location.origin}${window.location.pathname}?${nextSearch}`;
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(nextUrl);
    }
  };

  useEffect(() => {
    if (!ready || process.env.NODE_ENV === "production") {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const debugScroll = Number(params.get("debugScroll"));
    if (!Number.isFinite(debugScroll)) {
      return;
    }

    const clamped = clamp(debugScroll);
    const id = window.setTimeout(() => {
      window.scrollTo({ top: document.body.scrollHeight * clamped, behavior: "auto" });
    }, 180);

    return () => window.clearTimeout(id);
  }, [ready]);

  useLayoutEffect(() => {
    const shell = shellRef.current;
    const track = trackRef.current;
    const secondTrack = secondTrackRef.current;
    const thirdTrack = thirdTrackRef.current;
    const viewport = viewportRef.current;
    const secondViewport = secondViewportRef.current;
    const thirdViewport = thirdViewportRef.current;

    if (!shell) {
      return;
    }

    if (mode === "full" && !singleRoomPreview && !singleRailStudyPreview && (!track || !viewport || !secondTrack || !secondViewport)) {
      return;
    }

    if (showFamilyZonesTwo && (!secondTrack || !secondViewport)) {
      return;
    }

    if (showFamilyZonesThree && (!thirdTrack || !thirdViewport)) {
      return;
    }

    viewport?.style.setProperty("--scroll-progress", "0.1400");
    secondViewport?.style.setProperty("--scroll-progress", "0.1200");
    thirdViewport?.style.setProperty("--scroll-progress", "0.0800");
    const roomNodes = Array.from(shell.querySelectorAll<HTMLElement>("[data-room]"));
    const appendixNodes = Array.from(shell.querySelectorAll<HTMLElement>("[data-appendix-study]"));
    const railStudyNodes = Array.from(shell.querySelectorAll<HTMLElement>("[data-rail-study]"));
    const secondActNode = shell.querySelector<HTMLElement>("[data-second-act]");

    const writeDebugMetrics = (
      heroTrigger: ScrollTrigger | null,
      secondTrigger: ScrollTrigger | null,
      thirdTrigger: ScrollTrigger | null,
      lowerTrigger: ScrollTrigger | null,
    ) => {
      if (process.env.NODE_ENV === "production") {
        return;
      }

      const debugWindow = window as typeof window & {
        __motionShowcaseDebug?: {
          heroSpan: number;
          secondHeroSpan: number;
          thirdHeroSpan: number;
          lowerSpan: number;
          pinCount: number;
          pinBudget: number;
          maskHeavyBudget: number;
          familyZones3FinaleUniqueCount: number;
          familyZones3LaneCount: number;
          roomMetrics: Array<{
            slug?: string;
            roomType?: string;
            pin: boolean;
            progress: string;
            performanceClass?: string;
          }>;
          railStudyMetrics: Array<{
            slug?: string;
            variant?: string;
            presentation?: string;
            boardTransform: string;
            cardCount: number;
            stripCount: number;
          }>;
        };
      };

      debugWindow.__motionShowcaseDebug = {
        heroSpan: heroTrigger ? heroTrigger.end - heroTrigger.start : 0,
        secondHeroSpan: secondTrigger ? secondTrigger.end - secondTrigger.start : 0,
        thirdHeroSpan: thirdTrigger ? thirdTrigger.end - thirdTrigger.start : 0,
        lowerSpan: lowerTrigger ? lowerTrigger.end - lowerTrigger.start : 0,
        pinCount: roomNodes.filter((roomNode) => roomNode.dataset.roomPin === "true").length,
        pinBudget: roomPerformanceBudget.pinMax,
        maskHeavyBudget: roomPerformanceBudget.maskHeavyMax,
        familyZones3FinaleUniqueCount: uniqueFinaleFrames.length,
        familyZones3LaneCount: familyZonesThreeLaneCount,
        roomMetrics: roomNodes.map((roomNode) => ({
          slug: roomNode.dataset.room,
          roomType: roomNode.dataset.roomType,
          pin: roomNode.dataset.roomPin === "true",
          progress: roomNode.style.getPropertyValue("--room-progress"),
          performanceClass: roomNode.dataset.performanceClass,
        })),
        railStudyMetrics: railStudyNodes.map((railStudyNode) => ({
          slug: railStudyNode.dataset.railStudy,
          variant: railStudyNode.dataset.productVariant,
          presentation: railStudyNode
            .querySelector<HTMLElement>("[data-product-presentation]")
            ?.dataset.productPresentation,
          boardTransform:
            railStudyNode.querySelector<HTMLElement>("[data-product-board]")?.style.transform ??
            railStudyNode
              .querySelector<HTMLElement>("[data-product-board]")
              ?.getAttribute("style") ??
            "",
          cardCount: railStudyNode.querySelectorAll("[data-research-card]").length,
          stripCount:
            railStudyNode.querySelectorAll("[data-research-strip]").length +
            railStudyNode.querySelectorAll("[data-runway-strip]").length,
        })),
      };
    };

    if (reducedMotion) {
      setReady(true);
      setProgress(0.16);
      setSecondProgress(0.14);
      setThirdProgress(1);
      viewport?.style.setProperty("--scroll-progress", "0.1600");
      secondViewport?.style.setProperty("--scroll-progress", "0.1400");
      thirdViewport?.style.setProperty("--scroll-progress", "1.0000");
      roomNodes.forEach((roomNode) => applyRoomRuntimeState(roomNode, 1));
      appendixNodes.forEach((appendixNode) => applyAppendixRuntimeState(appendixNode, 1));
      railStudyNodes.forEach((studyNode) => {
        const productVariant = studyNode.dataset.productVariant as ProductRailVariant | undefined;
        applyRailStudyRuntimeState(studyNode, isAnyThreeDimensionalVariant(productVariant) ? 0.48 : 1);
      });
      writeDebugMetrics(null, null, null, null);
      return;
    }

    const lenis = new Lenis({
      duration: 1.05,
      wheelMultiplier: 0.9,
      touchMultiplier: 0.9,
      smoothWheel: true,
      syncTouch: false,
    });

    let rafId = 0;
    let queuedFrame = 0;
    let secondQueuedFrame = 0;
    let thirdQueuedFrame = 0;
    let latestProgress = 0.14;
    let latestSecondProgress = 0.12;
    let latestThirdProgress = 0.08;
    let heroTrigger: ScrollTrigger | null = null;
    let secondHeroTrigger: ScrollTrigger | null = null;
    let thirdHeroTrigger: ScrollTrigger | null = null;
    let lowerTrigger: ScrollTrigger | null = null;

    const syncProgress = (nextProgress: number) => {
      latestProgress = nextProgress;
      viewport?.style.setProperty("--scroll-progress", nextProgress.toFixed(4));
      if (queuedFrame === 0) {
        queuedFrame = window.requestAnimationFrame(() => {
          setProgress(latestProgress);
          queuedFrame = 0;
        });
      }
    };

    const syncSecondProgress = (nextProgress: number) => {
      latestSecondProgress = nextProgress;
      secondViewport?.style.setProperty("--scroll-progress", nextProgress.toFixed(4));
      if (secondQueuedFrame === 0) {
        secondQueuedFrame = window.requestAnimationFrame(() => {
          setSecondProgress(latestSecondProgress);
          secondQueuedFrame = 0;
        });
      }
    };

    const syncThirdProgress = (nextProgress: number) => {
      latestThirdProgress = nextProgress;
      thirdViewport?.style.setProperty("--scroll-progress", nextProgress.toFixed(4));
      if (thirdQueuedFrame === 0) {
        thirdQueuedFrame = window.requestAnimationFrame(() => {
          setThirdProgress(latestThirdProgress);
          thirdQueuedFrame = 0;
        });
      }
    };

    const loop = (time: number) => {
      lenis.raf(time);
      rafId = window.requestAnimationFrame(loop);
    };

    rafId = window.requestAnimationFrame(loop);
    lenis.on("scroll", ScrollTrigger.update);

    const ctx = gsap.context(() => {
      if (mode === "full" && track && secondTrack) {
        heroTrigger = ScrollTrigger.create({
          trigger: track,
          start: "top top",
          end: "bottom bottom",
          scrub: 0.7,
          onUpdate: (self) => {
            syncProgress(self.progress);
          },
        });

      }

      if (showFamilyZonesTwo && secondTrack) {
        secondHeroTrigger = ScrollTrigger.create({
          trigger: secondTrack,
          start: "top top",
          end: "bottom bottom",
          scrub: 0.72,
          onUpdate: (self) => {
            syncSecondProgress(self.progress);
          },
        });
      }

      if (showFamilyZonesThree && thirdTrack) {
        thirdHeroTrigger = ScrollTrigger.create({
          trigger: thirdTrack,
          start: "top top",
          end: "bottom bottom",
          scrub: 0.76,
          onUpdate: (self) => {
            syncThirdProgress(self.progress);
          },
        });
      }

      if (mode === "full" && secondActNode) {
        lowerTrigger = ScrollTrigger.create({
          trigger: secondActNode,
          start: "top bottom",
          end: "bottom bottom",
        });
      }

      roomNodes.forEach((roomNode) => {
        applyRoomRuntimeState(roomNode, 0);

        ScrollTrigger.create({
          trigger: roomNode,
          start: roomNode.dataset.roomPin === "true" ? "top top" : "top 84%",
          end: roomNode.dataset.roomPin === "true" ? "bottom bottom" : "bottom 18%",
          scrub: roomNode.dataset.roomPin === "true" ? 0.42 : 0.65,
          onUpdate: (self) => {
            applyRoomRuntimeState(roomNode, self.progress);
          },
        });
      });

      appendixNodes.forEach((appendixNode) => {
        applyAppendixRuntimeState(appendixNode, 0);

        ScrollTrigger.create({
          trigger: appendixNode,
          start: "top 86%",
          end: "bottom 18%",
          scrub: 0.7,
          onUpdate: (self) => {
            applyAppendixRuntimeState(appendixNode, self.progress);
          },
        });
      });

      railStudyNodes.forEach((studyNode) => {
        applyRailStudyRuntimeState(studyNode, 0);
        const productVariant = studyNode.dataset.productVariant as ProductRailVariant | undefined;
        const isThreeDimensionalLab = isAnyThreeDimensionalVariant(productVariant);
        const orbitalConfig = isOrbitalInspectionVariant(productVariant)
          ? readOrbitalConfigFromNode(studyNode)
          : null;
        const strictOrbitalTrigger = Boolean(orbitalConfig?.layers.strictTrigger);

        ScrollTrigger.create({
          trigger: studyNode,
          start: strictOrbitalTrigger ? "top top" : isThreeDimensionalLab ? "top 76%" : "top 84%",
          end: strictOrbitalTrigger ? "bottom bottom" : isThreeDimensionalLab ? "bottom 26%" : "bottom 18%",
          scrub: strictOrbitalTrigger ? 0.32 : isThreeDimensionalLab ? 0.38 : 0.7,
          onUpdate: (self) => {
            applyRailStudyRuntimeState(studyNode, self.progress);
          },
        });
      });
    }, shell);

    const refreshId = window.setTimeout(() => {
      ScrollTrigger.refresh();
      writeDebugMetrics(heroTrigger, secondHeroTrigger, thirdHeroTrigger, lowerTrigger);
      setReady(true);
    }, 120);

    return () => {
      window.clearTimeout(refreshId);
      if (queuedFrame) {
        window.cancelAnimationFrame(queuedFrame);
      }
      if (secondQueuedFrame) {
        window.cancelAnimationFrame(secondQueuedFrame);
      }
      if (thirdQueuedFrame) {
        window.cancelAnimationFrame(thirdQueuedFrame);
      }
      if (rafId) {
        window.cancelAnimationFrame(rafId);
      }
      lenis.destroy();
      ctx.revert();
    };
  }, [
    mode,
    orbitalRuntimeKey,
    reducedMotion,
    showFamilyZonesThree,
    showFamilyZonesTwo,
    singleRoomPreview,
    singleRailStudyPreview,
  ]);

  const effectiveThirdProgress = preRailOnly ? mix(0.02, 0.685, thirdProgress) : thirdProgress;
  const effectiveSecondProgress = familyZonesTwoInsertOnly
    ? clamp(secondProgress * 1.12 + 0.028)
    : secondProgress;
  const displayedFamilyZonesThreeActs = preRailOnly ? familyZonesThreeActs.slice(0, 2) : familyZonesThreeActs;
  const currentAct = activeAct(progress);
  const secondAct = activeAct(effectiveSecondProgress);
  const thirdAct = activeAct(effectiveThirdProgress, displayedFamilyZonesThreeActs);

  if (
    ((showFamilyZonesTwo && zones.length === 0) || (mode === "full" && zones.length === 0) || (showFamilyZonesThree && zonesThree.length === 0)) &&
    !singleRoomPreview &&
    !singleRailStudyPreview &&
    !duplexRailsRoomOnly
  ) {
    return (
      <main className={styles.pageShell}>
        <section className={styles.emptyState}>
          <p className={styles.emptyEyebrow}>No Renderable Families</p>
          <h1>12 Family Zones</h1>
          <p>
            `new-stage-fabrics` manifest에 렌더 가능한 그룹이 없습니다. 현재 자산 상태를 먼저
            확인해야 합니다.
          </p>
        </section>
      </main>
    );
  }

  if (familyZonesTwoInsertOnly) {
    const insertChapterStyle = {
      "--scroll-progress": effectiveSecondProgress.toFixed(4),
      "--chapter-shift": `${(reducedMotion ? 0 : mix(0, -15, effectiveSecondProgress)).toFixed(3)}rem`,
    } as CSSProperties;

    return (
      <main className={`${styles.pageShell} ${styles.pageShellInsert}`} ref={shellRef}>
        <section className={styles.openInsertTrack} ref={secondTrackRef}>
          <div
            className={`${styles.openInsertViewport} ${ready ? styles.stageViewportReady : ""}`}
            ref={secondViewportRef}
            style={insertChapterStyle}
          >
            <div className={styles.openInsertChapter}>
              <div className={styles.openInsertPlane} />
              {[...familyZonesTwoInsertLayout, ...familyZonesTwoInsertEchoLayout].map((layout, index) => {
                const zone = zones.find((candidate) => candidate.key === layout.key);
                if (!zone) {
                  return null;
                }

                const isEcho = layout.band === 3;
                const bandReveal = windowProgress(
                  effectiveSecondProgress,
                  isEcho ? 0.54 : layout.band * 0.16,
                  isEcho ? 0.9 : 0.44 + layout.band * 0.16,
                );
                const readableHold =
                  1 -
                  windowProgress(
                    effectiveSecondProgress,
                    isEcho ? 0.95 : 0.87 + layout.band * 0.035,
                    1,
                  );
                const baseProgress = clamp(
                  effectiveSecondProgress * 0.78 -
                    layout.band * 0.026 +
                    (layout.band === 0 ? 0.05 : 0.035),
                );
                const zoneProgress = isEcho
                  ? clamp(1 - (effectiveSecondProgress * 0.42 - 0.06))
                  : baseProgress;
                const driftWave = Math.sin(effectiveSecondProgress * Math.PI * (isEcho ? 3.2 : 2.3) + index * 0.74);
                const xDrift =
                  driftWave * (isEcho ? 2.2 : 1.15) * bandReveal * Math.max(readableHold, 0.34) * (layout.reverse ? -1 : 1);
                const localLift = isEcho
                  ? mix(18, 1.2, bandReveal) * Math.max(readableHold, 0.42)
                  : mix(6.4, 0.8, bandReveal) * Math.max(readableHold, 0.55);

                return (
                  <FamilyZone
                    key={`${layout.key}-insert-${index}`}
                    zone={zone}
                    progress={zoneProgress}
                    reducedMotion={reducedMotion}
                    priority={index < 4}
                    theme="light"
                    detailedCaption
                    detachedCaption
                    hideRail
                    className={`${styles.familyZoneInsert} ${layout.reverse ? styles.familyZoneInsertEcho : ""}`}
                    layoutOverride={{
                      x: layout.x,
                      y: layout.y,
                      widthRem: layout.widthRem,
                      yShiftRem: localLift,
                      xShiftRem: xDrift,
                    }}
                  />
                );
              })}
            </div>
          </div>
        </section>
      </main>
    );
  }

  let roomIndex = 0;

  if (previewRoomDefinition) {
    return (
      <main className={styles.pageShell} ref={shellRef}>
        <section className={styles.chapterBlock}>
          <div className={styles.chapterRooms}>
            <GalleryRoomSection
              room={previewRoomDefinition}
              roomIndex={previewRoomIndex >= 0 ? previewRoomIndex : roomIndex}
            />
          </div>
        </section>
      </main>
    );
  }

  if (previewRailStudies.length > 0) {
    const isOrbitalPreview = previewRailStudies.some((study) => isOrbitalInspectionVariant(study.variantKey));
    const orbitalExportUrl = effectiveOrbitalConfig
      ? `${typeof window !== "undefined" ? window.location.pathname : `/fabric-duplex-rails/${previewRailStudies[0]?.slug ?? ""}`}?${serializeOrbitalInspectionConfig(effectiveOrbitalConfig)}`
      : "";

    return (
      <main className={`${styles.pageShell} ${isOrbitalPreview ? styles.pageShellWhite : ""}`} ref={shellRef}>
        <section className={`${styles.railStudies} ${isOrbitalPreview ? styles.railStudiesOrbital : ""}`}>
          <div className={styles.railStudiesStack}>
            {previewRailStudies.map((study, index) => (
              <RailStudySection
                key={study.slug}
                study={study}
                index={index}
                orbitalConfig={isOrbitalInspectionVariant(study.variantKey) ? effectiveOrbitalConfig : undefined}
              />
            ))}
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className={styles.pageShell} ref={shellRef}>
      {mode === "full" ? (
      <section className={styles.scrollTrack} ref={trackRef}>
        <div
          className={`${styles.stageViewport} ${ready ? styles.stageViewportReady : ""}`}
          ref={viewportRef}
          style={{ "--scroll-progress": progress.toFixed(4) } as CSSProperties}
        >
          <div className={styles.stageBackdrop} />

          <div className={styles.stageFrame}>
            <header className={styles.stageHeader}>
              <div>
                <p className={styles.eyebrow}>Motion Study 12</p>
                <h1>Family Zones</h1>
              </div>
              <p className={styles.stageDescription}>
                같은 패밀리는 같은 좌표에 머물고, 스크롤에 따라 각기 다른 리빌 문법으로만
                전환됩니다.
              </p>
            </header>

            <aside className={styles.actRail} aria-label="scroll acts">
              {acts.map((act, index) => {
                const fill = clamp((progress - act.start) / (act.end - act.start || 1));
                return (
                  <div
                    key={act.label}
                    className={`${styles.actItem} ${currentAct === index ? styles.actItemActive : ""}`}
                  >
                    <span className={styles.actLabel}>{act.label}</span>
                    <span className={styles.actBar}>
                      <span
                        className={styles.actBarFill}
                        style={{ transform: `scaleX(${fill.toFixed(3)})` }}
                      />
                    </span>
                  </div>
                );
              })}
            </aside>

            <div className={styles.stageCanvas}>
              {zones.map((zone, index) => (
                <FamilyZone
                  key={zone.key}
                  zone={zone}
                  progress={progress}
                  reducedMotion={reducedMotion}
                  priority={index < 4}
                />
              ))}
            </div>

            <footer className={styles.stageFooter}>
              <div className={styles.footerPill}>12 Family Zones Only</div>
              <div className={styles.footerPill}>Scroll Progress {(progress * 100).toFixed(0)}%</div>
              <div className={styles.footerPill}>{acts[currentAct]?.label}</div>
              {reducedMotion ? <div className={styles.footerPill}>Reduced Motion</div> : null}
            </footer>
          </div>
        </div>
      </section>
      ) : null}

      {showFamilyZonesTwo ? (
      <section
        className={`${styles.scrollTrack} ${styles.scrollTrackLight} ${familyZonesTwoInsertOnly ? styles.scrollTrackInsert : ""}`}
        ref={secondTrackRef}
      >
        <div
          className={`${styles.stageViewport} ${styles.stageViewportLight} ${familyZonesTwoInsertOnly ? styles.stageViewportInsert : ""} ${ready ? styles.stageViewportReady : ""}`}
          ref={secondViewportRef}
          style={{ "--scroll-progress": effectiveSecondProgress.toFixed(4) } as CSSProperties}
        >
          <div
            className={`${styles.stageBackdrop} ${styles.stageBackdropLight} ${familyZonesTwoInsertOnly ? styles.stageBackdropInsert : ""}`}
          />

          <div
            className={`${styles.stageFrame} ${styles.stageFrameLight} ${familyZonesTwoInsertOnly ? styles.stageFrameInsert : ""}`}
          >
            {!familyZonesTwoInsertOnly ? (
            <header className={`${styles.stageHeader} ${styles.stageHeaderLight}`}>
              <div>
                <p className={`${styles.eyebrow} ${styles.eyebrowLight}`}>Motion Study 12.2</p>
                <h1>Family Zones 2</h1>
              </div>
              <p className={`${styles.stageDescription} ${styles.stageDescriptionLight}`}>
                같은 좌표 규칙은 유지하되, 흰 바탕 위에서 조금 더 조용하고 미니멀하게 원단 이름까지
                함께 전환된다.
              </p>
            </header>
            ) : null}

            <aside
              className={`${styles.actRail} ${styles.actRailLight} ${familyZonesTwoInsertOnly ? styles.actRailInsert : ""}`}
              aria-label="scroll acts light"
            >
              {acts.map((act, index) => {
                const fill = clamp((effectiveSecondProgress - act.start) / (act.end - act.start || 1));
                return (
                  <div
                    key={`${act.label}-light`}
                    className={`${styles.actItem} ${secondAct === index ? styles.actItemActive : ""}`}
                  >
                    <span className={`${styles.actLabel} ${styles.actLabelLight}`}>{act.label}</span>
                    <span className={`${styles.actBar} ${styles.actBarLight}`}>
                      <span
                        className={`${styles.actBarFill} ${styles.actBarFillLight}`}
                        style={{ transform: `scaleX(${fill.toFixed(3)})` }}
                      />
                    </span>
                  </div>
                );
              })}
            </aside>

            <div
              className={`${styles.stageCanvas} ${styles.stageCanvasLight} ${familyZonesTwoInsertOnly ? styles.stageCanvasInsert : ""}`}
            >
              {zones.map((zone, index) => (
                <FamilyZone
                  key={`${zone.key}-light`}
                  zone={zone}
                  progress={effectiveSecondProgress}
                  reducedMotion={reducedMotion}
                  priority={index < 4}
                  theme="light"
                  detailedCaption
                />
              ))}
            </div>

            <footer className={`${styles.stageFooter} ${styles.stageFooterLight} ${familyZonesTwoInsertOnly ? styles.stageFooterInsert : ""}`}>
              {!familyZonesTwoInsertOnly ? (
                <div className={`${styles.footerPill} ${styles.footerPillLight}`}>Family Zones 2</div>
              ) : null}
              <div className={`${styles.footerPill} ${styles.footerPillLight}`}>
                Scroll Progress {(effectiveSecondProgress * 100).toFixed(0)}%
              </div>
              <div className={`${styles.footerPill} ${styles.footerPillLight}`}>{acts[secondAct]?.label}</div>
              <div className={`${styles.footerPill} ${styles.footerPillLight}`}>Fabric Detail Sync</div>
            </footer>
          </div>
        </div>
      </section>
      ) : null}

      {productLabOnly || productLabVer12Only ? <ProductLabIntro /> : null}

      {showFamilyZonesThree ? (
      <section className={`${styles.scrollTrack} ${styles.scrollTrackLight} ${styles.scrollTrackThree}`} ref={thirdTrackRef}>
        <div
          className={`${styles.stageViewport} ${styles.stageViewportLight} ${styles.stageViewportThree} ${ready ? styles.stageViewportReady : ""}`}
          ref={thirdViewportRef}
          style={{ "--scroll-progress": effectiveThirdProgress.toFixed(4) } as CSSProperties}
        >
          <div className={`${styles.stageBackdrop} ${styles.stageBackdropLight} ${styles.stageBackdropThree}`} />

          <div className={`${styles.stageFrame} ${styles.stageFrameLight} ${styles.stageFrameThree}`}>
            <header className={`${styles.stageHeader} ${styles.stageHeaderLight} ${styles.stageHeaderThree}`}>
              <div>
                <p className={`${styles.eyebrow} ${styles.eyebrowLight}`}>
                  {preRailOnly ? "Homepage insertion" : productLabOnly ? "Product Motion Prologue" : "Motion Study 12.3"}
                </p>
                <h1>{preRailOnly ? "Family Zones 3 Prelude" : productLabOnly ? "Fabric Motion Lab" : "Family Zones 3"}</h1>
              </div>
              <p className={`${styles.stageDescription} ${styles.stageDescriptionLight}`}>
                {preRailOnly
                  ? "상단 영상 바로 아래에서 Family Zones 2 계열의 quiet assembly와 specimen drift만 이어진다. rail 전환은 완전히 제거하고, 상품 코드는 계속 선명하게 유지한다."
                  : productLabOnly
                    ? "제품 페이지에 들어갈 원단 등장 연출의 최종 프롤로그다. Duplex Rails만 남기고, 전체 원단을 여러 rail layer로 분산해 archive 전체가 계속 살아 있는 것처럼 보이게 한다."
                    : "Family Zones 2의 읽기감을 충분히 유지한 뒤, 4줄씩 두 번 읽히는 느린 rail archive로 넘어간다. 상품 코드는 끝까지 또렷하게 남고, 전체 원단은 series 순으로 중복 없이 한 번씩만 지나간다."}
              </p>
            </header>

            <aside className={`${styles.actRail} ${styles.actRailLight} ${styles.actRailThree}`} aria-label="scroll acts family zones three">
              {displayedFamilyZonesThreeActs.map((act, index) => {
                const fill = clamp((effectiveThirdProgress - act.start) / (act.end - act.start || 1));
                return (
                  <div
                    key={`${act.label}-three`}
                    className={`${styles.actItem} ${thirdAct === index ? styles.actItemActive : ""}`}
                  >
                    <span className={`${styles.actLabel} ${styles.actLabelLight}`}>{act.label}</span>
                    <span className={`${styles.actBar} ${styles.actBarLight}`}>
                      <span
                        className={`${styles.actBarFill} ${styles.actBarFillLight}`}
                        style={{ transform: `scaleX(${fill.toFixed(3)})` }}
                      />
                    </span>
                  </div>
                );
              })}
            </aside>

            <div
              className={`${styles.stageCanvas} ${styles.stageCanvasLight} ${styles.stageCanvasThree}`}
              data-family-zones-three
            >
              <div className={styles.familyZonesThreePlane} />
              {zonesThree.map((zone, index) => (
                <FamilyZoneThree
                  key={`${zone.key}-three`}
                  zone={zone}
                  progress={effectiveThirdProgress}
                  reducedMotion={reducedMotion}
                  priority={index < 5}
                />
              ))}
              {preRailOnly ? null : (
                <FamilyZonesThreeFinale progress={effectiveThirdProgress} reducedMotion={reducedMotion} />
              )}
            </div>

            <footer className={`${styles.stageFooter} ${styles.stageFooterLight}`}>
              <div className={`${styles.footerPill} ${styles.footerPillLight}`}>
                {preRailOnly ? "Family Zones 3 Prelude" : productLabOnly ? "Duplex Rails Prologue" : "Family Zones 3"}
              </div>
              <div className={`${styles.footerPill} ${styles.footerPillLight}`}>
                Scroll Progress {(effectiveThirdProgress * 100).toFixed(0)}%
              </div>
              <div className={`${styles.footerPill} ${styles.footerPillLight}`}>{displayedFamilyZonesThreeActs[thirdAct]?.label}</div>
              {preRailOnly ? (
                <div className={`${styles.footerPill} ${styles.footerPillLight}`}>Pre-Rail Only</div>
              ) : (
                <div className={`${styles.footerPill} ${styles.footerPillLight}`}>
                  Archive {uniqueFinaleFrames.length} Fabrics / No Duplicates
                </div>
              )}
            </footer>
          </div>
        </div>
      </section>
      ) : null}

      {familyZonesThreeOnly || productLabOnly || productLabVer12Only ? (
        <section className={styles.railStudies}>
          {productLabOnly ? null : (
            <header className={styles.railStudiesHeader}>
              <div>
                <p className={styles.railStudiesEyebrow}>
                  {productLabVer12Only ? "Archive Restore" : "Rail Comparison"}
                </p>
                <h2>{productLabVer12Only ? "Cyberpunk 1 / 2" : "14 Slow Horizontal Rails"}</h2>
              </div>
              <p className={styles.railStudiesNote}>
                {productLabVer12Only
                  ? "처음 구현했던 사이버 펑크 무드의 1안과, 그 다음 2안을 그대로 다시 비교할 수 있게 복원한 로컬 전용 페이지다."
                  : "Codrops horizontal editorial references를 기준으로, 같은 시리얼 묶음을 유지한 채 rail 진입, hold, exit만 다르게 설계한 비교용 시안들이다."}
              </p>
            </header>
          )}

          <div className={styles.railStudiesStack}>
            {(productLabVer12Only
              ? productLabVer12Studies
              : productLabOnly
                ? productLabRailStudies
                : baselineRailStudyDefinitions
            ).map((study, index) => (
              <RailStudySection key={study.slug} study={study} index={index} minimal={productLabOnly} />
            ))}
          </div>
        </section>
      ) : null}

      {mode === "full" ? (
      <section className={styles.secondAct} data-second-act>
        <header className={styles.secondActHeader}>
          <div>
            <p className={styles.secondActEyebrow}>Motion Study 13</p>
            <h2>Curated Second Act</h2>
          </div>
          <p className={styles.secondActNote}>
            하단은 데모 목록이 아니라, 카드 스택과 레일, 서랍, 챔버가 차례로 이어지는 하나의
            gallery sequence로 재구성했다. 총 {galleryRooms.length}개의 room만 남기고 밀도를 올렸다.
          </p>
        </header>

        {galleryChapters.map((chapter) => {
          const startIndex = roomIndex;
          roomIndex += chapter.rooms.length;
          return <ChapterSection key={chapter.slug} chapter={chapter} startIndex={startIndex} />;
        })}
      </section>
      ) : null}

      {mode === "full" ? (
      <section className={styles.appendixSection}>
        <header className={styles.appendixHeader}>
          <div>
            <p className={styles.appendixEyebrow}>Motion Study 14</p>
            <h2>Lower Appendix</h2>
          </div>
          <p className={styles.appendixNote}>
            같은 분위기를 유지하되, 아래에는 문법이 겹치지 않는 별도 study들을 전부 다른 형태로 추가했다.
          </p>
        </header>

        <div className={styles.appendixStack}>
          {appendixStudies.map((study, index) => (
            <AppendixStudySection key={study.slug} study={study} index={index} />
          ))}
        </div>
      </section>
      ) : null}
    </main>
  );
}
