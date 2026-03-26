"use client";

import Link from "next/link";
import { type CSSProperties, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import manifest from "../../../../public/new-stage-fabrics/manifest.json";
import styles from "./ProductsCorridorPreview.module.css";

gsap.registerPlugin(ScrollTrigger);

type FabricCategory = "checks" | "stripes" | "others";
type ZoneMotion = "split-h" | "split-v" | "drift" | "rail-left" | "rail-right" | "band" | "shutter" | "pulse";

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
  echoEnabled: boolean;
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
};

type EmbeddedSeedSnapshot = {
  itemName: string;
  src: string;
  srcSet?: string | null;
  styleText: string;
  style: CSSProperties;
};

function parseInlineStyle(styleText: string): CSSProperties {
  return Object.fromEntries(
    styleText
      .split(";")
      .map((declaration) => declaration.trim())
      .filter(Boolean)
      .map((declaration) => {
        const [key, ...rest] = declaration.split(":");
        return [key.trim(), rest.join(":").trim()];
      }),
  ) as CSSProperties;
}

const embeddedSeedSnapshots: Record<string, EmbeddedSeedSnapshot> = {
  CK_D: {
    itemName: "CK_D04",
    src: "/new-stage-fabrics/checks/26-ck_d04.webp",
    srcSet: null,
    styleText: "--x:6.859999999999999%;--y:7.84%;--tx:-2.652rem;--ty:6.790rem;--scale:0.934;--alpha:0.837;--clip-top:4.59%;--clip-right:0.00%;--clip-bottom:4.59%;--clip-left:0.00%;--blur:0.41px;--sat:0.965;--zone-width:10.8rem;--img-tx:0.098rem;--img-ty:0.274rem;--img-scale:1.0193",
    style: parseInlineStyle("--x:6.859999999999999%;--y:7.84%;--tx:-2.652rem;--ty:6.790rem;--scale:0.934;--alpha:0.837;--clip-top:4.59%;--clip-right:0.00%;--clip-bottom:4.59%;--clip-left:0.00%;--blur:0.41px;--sat:0.965;--zone-width:10.8rem;--img-tx:0.098rem;--img-ty:0.274rem;--img-scale:1.0193"),
  },
  CK_O: {
    itemName: "CK_O04",
    src: "/new-stage-fabrics/checks/37-ck_o04.webp",
    srcSet: null,
    styleText: "--x:18.62%;--y:11.76%;--tx:2.112rem;--ty:6.982rem;--scale:0.934;--alpha:0.837;--clip-top:0.00%;--clip-right:0.00%;--clip-bottom:0.00%;--clip-left:0.00%;--blur:0.41px;--sat:0.965;--zone-width:10.6rem;--img-tx:0.200rem;--img-ty:0.266rem;--img-scale:1.0204",
    style: parseInlineStyle("--x:18.62%;--y:11.76%;--tx:2.112rem;--ty:6.982rem;--scale:0.934;--alpha:0.837;--clip-top:0.00%;--clip-right:0.00%;--clip-bottom:0.00%;--clip-left:0.00%;--blur:0.41px;--sat:0.965;--zone-width:10.6rem;--img-tx:0.200rem;--img-ty:0.266rem;--img-scale:1.0204"),
  },
  ST_N: {
    itemName: "ST_N08",
    src: "/new-stage-fabrics/stripes/28-st_n08.webp",
    srcSet: null,
    styleText: "--x:64.67999999999999%;--y:8.82%;--tx:6.261rem;--ty:8.120rem;--scale:0.934;--alpha:0.837;--clip-top:0.00%;--clip-right:0.00%;--clip-bottom:0.00%;--clip-left:7.43%;--blur:0.41px;--sat:0.965;--zone-width:12.2rem;--img-tx:-0.009rem;--img-ty:0.277rem;--img-scale:1.0211",
    style: parseInlineStyle("--x:64.67999999999999%;--y:8.82%;--tx:6.261rem;--ty:8.120rem;--scale:0.934;--alpha:0.837;--clip-top:0.00%;--clip-right:0.00%;--clip-bottom:0.00%;--clip-left:7.43%;--blur:0.41px;--sat:0.965;--zone-width:12.2rem;--img-tx:-0.009rem;--img-ty:0.277rem;--img-scale:1.0211"),
  },
  CK_AF: {
    itemName: "CK_AF03",
    src: "/homepage-fabrics/slow-field-first-frame/desktop/ck_af-ck_af03.webp",
    srcSet: "/homepage-fabrics/slow-field-first-frame/mobile/ck_af-ck_af03.webp 256w, /homepage-fabrics/slow-field-first-frame/desktop/ck_af-ck_af03.webp 400w",
    styleText: "--x:17.64%;--y:30.38%;--tx:1.686rem;--ty:6.690rem;--scale:0.934;--alpha:0.837;--clip-top:0.00%;--clip-right:4.81%;--clip-bottom:0.00%;--clip-left:4.81%;--blur:0.41px;--sat:0.965;--zone-width:10.4rem;--img-tx:0.142rem;--img-ty:0.157rem;--img-scale:1.0228",
    style: parseInlineStyle("--x:17.64%;--y:30.38%;--tx:1.686rem;--ty:6.690rem;--scale:0.934;--alpha:0.837;--clip-top:0.00%;--clip-right:4.81%;--clip-bottom:0.00%;--clip-left:4.81%;--blur:0.41px;--sat:0.965;--zone-width:10.4rem;--img-tx:0.142rem;--img-ty:0.157rem;--img-scale:1.0228"),
  },
  ST_G: {
    itemName: "ST_G06",
    src: "/new-stage-fabrics/stripes/17-st_g06.webp",
    srcSet: null,
    styleText: "--x:54.879999999999995%;--y:29.4%;--tx:-4.794rem;--ty:7.575rem;--scale:0.934;--alpha:0.837;--clip-top:3.94%;--clip-right:0.00%;--clip-bottom:3.94%;--clip-left:0.00%;--blur:0.41px;--sat:0.965;--zone-width:10.8rem;--img-tx:0.069rem;--img-ty:0.179rem;--img-scale:1.0233",
    style: parseInlineStyle("--x:54.879999999999995%;--y:29.4%;--tx:-4.794rem;--ty:7.575rem;--scale:0.934;--alpha:0.837;--clip-top:3.94%;--clip-right:0.00%;--clip-bottom:3.94%;--clip-left:0.00%;--blur:0.41px;--sat:0.965;--zone-width:10.8rem;--img-tx:0.069rem;--img-ty:0.179rem;--img-scale:1.0233"),
  },
  CK_AC: {
    itemName: "CK_AC04",
    src: "/new-stage-fabrics/checks/07-ck_ac04.webp",
    srcSet: null,
    styleText: "--x:37.24%;--y:42.14%;--tx:-3.205rem;--ty:7.567rem;--scale:0.925;--alpha:0.827;--clip-top:4.95%;--clip-right:0.00%;--clip-bottom:4.95%;--clip-left:0.00%;--blur:0.44px;--sat:0.961;--zone-width:10.3rem;--img-tx:0.219rem;--img-ty:0.133rem;--img-scale:1.0238",
    style: parseInlineStyle("--x:37.24%;--y:42.14%;--tx:-3.205rem;--ty:7.567rem;--scale:0.925;--alpha:0.827;--clip-top:4.95%;--clip-right:0.00%;--clip-bottom:4.95%;--clip-left:0.00%;--blur:0.44px;--sat:0.961;--zone-width:10.3rem;--img-tx:0.219rem;--img-ty:0.133rem;--img-scale:1.0238"),
  },
  ST_B: {
    itemName: "ST_B05",
    src: "/new-stage-fabrics/stripes/09-st_b05.webp",
    srcSet: null,
    styleText: "--x:69.58%;--y:48.019999999999996%;--tx:-10.757rem;--ty:8.147rem;--scale:0.925;--alpha:0.827;--clip-top:0.00%;--clip-right:8.02%;--clip-bottom:0.00%;--clip-left:0.00%;--blur:0.44px;--sat:0.961;--zone-width:10.5rem;--img-tx:0.164rem;--img-ty:0.057rem;--img-scale:1.0240",
    style: parseInlineStyle("--x:69.58%;--y:48.019999999999996%;--tx:-10.757rem;--ty:8.147rem;--scale:0.925;--alpha:0.827;--clip-top:0.00%;--clip-right:8.02%;--clip-bottom:0.00%;--clip-left:0.00%;--blur:0.44px;--sat:0.961;--zone-width:10.5rem;--img-tx:0.164rem;--img-ty:0.057rem;--img-scale:1.0240"),
  },
  CK_T: {
    itemName: "CK_T05",
    src: "/homepage-fabrics/slow-field-first-frame/desktop/ck_t-ck_t05.webp",
    srcSet: "/homepage-fabrics/slow-field-first-frame/mobile/ck_t-ck_t05.webp 256w, /homepage-fabrics/slow-field-first-frame/desktop/ck_t-ck_t05.webp 400w",
    styleText: "--x:9.8%;--y:54.879999999999995%;--tx:0.872rem;--ty:7.470rem;--scale:0.925;--alpha:0.827;--clip-top:0.00%;--clip-right:0.00%;--clip-bottom:0.00%;--clip-left:0.00%;--blur:0.44px;--sat:0.961;--zone-width:10.9rem;--img-tx:-0.077rem;--img-ty:0.048rem;--img-scale:1.0239",
    style: parseInlineStyle("--x:9.8%;--y:54.879999999999995%;--tx:0.872rem;--ty:7.470rem;--scale:0.925;--alpha:0.827;--clip-top:0.00%;--clip-right:0.00%;--clip-bottom:0.00%;--clip-left:0.00%;--blur:0.44px;--sat:0.961;--zone-width:10.9rem;--img-tx:-0.077rem;--img-ty:0.048rem;--img-scale:1.0239"),
  },
  CK_AI: {
    itemName: "CK_AI03",
    src: "/new-stage-fabrics/checks/16-ck_ai03.webp",
    srcSet: null,
    styleText: "--x:27.439999999999998%;--y:64.67999999999999%;--tx:-2.573rem;--ty:7.077rem;--scale:0.925;--alpha:0.827;--clip-top:0.00%;--clip-right:5.19%;--clip-bottom:0.00%;--clip-left:5.19%;--blur:0.44px;--sat:0.961;--zone-width:10.1rem;--img-tx:0.113rem;--img-ty:-0.103rem;--img-scale:1.0233",
    style: parseInlineStyle("--x:27.439999999999998%;--y:64.67999999999999%;--tx:-2.573rem;--ty:7.077rem;--scale:0.925;--alpha:0.827;--clip-top:0.00%;--clip-right:5.19%;--clip-bottom:0.00%;--clip-left:5.19%;--blur:0.44px;--sat:0.961;--zone-width:10.1rem;--img-tx:0.113rem;--img-ty:-0.103rem;--img-scale:1.0233"),
  },
  CK_S: {
    itemName: "CK_S03",
    src: "/homepage-fabrics/slow-field-first-frame/desktop/ck_s-ck_s03.webp",
    srcSet: "/homepage-fabrics/slow-field-first-frame/mobile/ck_s-ck_s03.webp 256w, /homepage-fabrics/slow-field-first-frame/desktop/ck_s-ck_s03.webp 400w",
    styleText: "--x:47.04%;--y:61.74%;--tx:0.565rem;--ty:6.800rem;--scale:0.932;--alpha:0.827;--clip-top:0.00%;--clip-right:0.00%;--clip-bottom:0.00%;--clip-left:0.00%;--blur:0.44px;--sat:0.961;--zone-width:9.9rem;--img-tx:0.214rem;--img-ty:-0.152rem;--img-scale:1.0225",
    style: parseInlineStyle("--x:47.04%;--y:61.74%;--tx:0.565rem;--ty:6.800rem;--scale:0.932;--alpha:0.827;--clip-top:0.00%;--clip-right:0.00%;--clip-bottom:0.00%;--clip-left:0.00%;--blur:0.44px;--sat:0.961;--zone-width:9.9rem;--img-tx:0.214rem;--img-ty:-0.152rem;--img-scale:1.0225"),
  },
  ST_A: {
    itemName: "ST_A01",
    src: "/new-stage-fabrics/stripes/01-st_a01.webp",
    srcSet: null,
    styleText: "--x:72.52%;--y:70.56%;--tx:7.952rem;--ty:7.570rem;--scale:0.915;--alpha:0.817;--clip-top:0.00%;--clip-right:0.00%;--clip-bottom:0.00%;--clip-left:8.62%;--blur:0.48px;--sat:0.957;--zone-width:11.2rem;--img-tx:0.035rem;--img-ty:-0.136rem;--img-scale:1.0218",
    style: parseInlineStyle("--x:72.52%;--y:70.56%;--tx:7.952rem;--ty:7.570rem;--scale:0.915;--alpha:0.817;--clip-top:0.00%;--clip-right:0.00%;--clip-bottom:0.00%;--clip-left:8.62%;--blur:0.48px;--sat:0.957;--zone-width:11.2rem;--img-tx:0.035rem;--img-ty:-0.136rem;--img-scale:1.0218"),
  },
  ETC_B: {
    itemName: "ETC_B02",
    src: "/homepage-fabrics/slow-field-first-frame/desktop/etc_b-etc_b02.webp",
    srcSet: "/homepage-fabrics/slow-field-first-frame/mobile/etc_b-etc_b02.webp 256w, /homepage-fabrics/slow-field-first-frame/desktop/etc_b-etc_b02.webp 400w",
    styleText: "--x:22.54%;--y:78.4%;--tx:-2.149rem;--ty:6.486rem;--scale:0.915;--alpha:0.817;--clip-top:2.79%;--clip-right:2.79%;--clip-bottom:2.79%;--clip-left:2.79%;--blur:0.48px;--sat:0.957;--zone-width:9.6rem;--img-tx:0.074rem;--img-ty:-0.285rem;--img-scale:1.0195",
    style: parseInlineStyle("--x:22.54%;--y:78.4%;--tx:-2.149rem;--ty:6.486rem;--scale:0.915;--alpha:0.817;--clip-top:2.79%;--clip-right:2.79%;--clip-bottom:2.79%;--clip-left:2.79%;--blur:0.48px;--sat:0.957;--zone-width:9.6rem;--img-tx:0.074rem;--img-ty:-0.285rem;--img-scale:1.0195"),
  },
  CK_AM: {
    itemName: "CK_AM02",
    src: "/new-stage-fabrics/checks/19-ck_am02.webp",
    srcSet: null,
    styleText: "--x:67.62%;--y:81.34%;--tx:0.986rem;--ty:6.940rem;--scale:0.920;--alpha:0.817;--clip-top:0.00%;--clip-right:0.00%;--clip-bottom:0.00%;--clip-left:0.00%;--blur:0.48px;--sat:0.957;--zone-width:10.2rem;--img-tx:-0.052rem;--img-ty:-0.290rem;--img-scale:1.0184",
    style: parseInlineStyle("--x:67.62%;--y:81.34%;--tx:0.986rem;--ty:6.940rem;--scale:0.920;--alpha:0.817;--clip-top:0.00%;--clip-right:0.00%;--clip-bottom:0.00%;--clip-left:0.00%;--blur:0.48px;--sat:0.957;--zone-width:10.2rem;--img-tx:-0.052rem;--img-ty:-0.290rem;--img-scale:1.0184"),
  },
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

const baseLayouts: LayoutDefinition[] = [
  { key: "CK_D", x: 5, y: 6, widthRem: 11.8, band: 0 },
  { key: "CK_O", x: 23, y: 11, widthRem: 11.1, band: 0 },
  { key: "ST_N", x: 70, y: 8, widthRem: 12.4, band: 0 },
  { key: "CK_AF", x: 11, y: 27, widthRem: 10.3, band: 0 },
  { key: "ST_G", x: 58, y: 32, widthRem: 11.2, band: 0 },
  { key: "CK_AC", x: 36, y: 47, widthRem: 10.5, band: 1 },
  { key: "ST_B", x: 79, y: 47, widthRem: 10.7, band: 1 },
  { key: "CK_T", x: 7, y: 58, widthRem: 11.5, band: 1 },
  { key: "CK_AI", x: 28, y: 68, widthRem: 10.4, band: 1 },
  { key: "CK_S", x: 58, y: 65, widthRem: 10.2, band: 1 },
  { key: "ST_A", x: 73, y: 76, widthRem: 11.5, band: 2 },
  { key: "ETC_B", x: 15, y: 88, widthRem: 10.1, band: 2 },
  { key: "CK_AM", x: 76, y: 92, widthRem: 10.4, band: 2 },
];

function mergeLayouts(overrides: Partial<Record<string, Partial<LayoutDefinition>>>) {
  return baseLayouts.map((layout) => ({ ...layout, ...overrides[layout.key] }));
}

const connectedSalonConfig: VariantConfig = {
  slug: "connected-salon",
  layouts: mergeLayouts({
    CK_D: { x: 7, y: 8, widthRem: 10.8 },
    CK_O: { x: 19, y: 12, widthRem: 10.6 },
    ST_N: { x: 66, y: 9, widthRem: 12.2 },
    CK_AF: { x: 18, y: 31, widthRem: 10.4 },
    ST_G: { x: 56, y: 30, widthRem: 10.8 },
    CK_AC: { x: 38, y: 43, widthRem: 10.3 },
    ST_B: { x: 71, y: 49, widthRem: 10.5 },
    CK_T: { x: 10, y: 56, widthRem: 10.9 },
    CK_AI: { x: 28, y: 66, widthRem: 10.1 },
    CK_S: { x: 48, y: 63, widthRem: 9.9 },
    ST_A: { x: 74, y: 72, widthRem: 11.2 },
    ETC_B: { x: 23, y: 80, widthRem: 9.6 },
    CK_AM: { x: 69, y: 83, widthRem: 10.2 },
  }),
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
  echoEnabled: true,
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

const excludedExact = new Set(["ST_M02", "ETC_C01"]);
const excludedFamilies = new Set(["ETC_C", "ST_M"]);

function clamp(value: number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
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
for (const frames of Array.from(families.values())) {
  frames.sort((left, right) => serialNumber(left.name) - serialNumber(right.name));
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
      emphasis,
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
    (zone.motion === "rail-left" || zone.motion === "rail-right")
      ? (1 - visibilityDrive) * zone.direction * 12
      : zone.direction * (1 - emphasis) * zone.drift * 2.6;
  const xShift = lateralBase + (progress - 0.5) * zone.depth * 2.8;
  const yShift = (1 - emphasis) * zone.depth * 3.6 - waveProgress * zone.depth * 1.4;
  const pulse = zone.motion === "pulse" ? Math.sin(progress * Math.PI * 10 + 0.04 * zone.x) * pulseAmplitude : 0;
  const scale = 0.88 + 0.17 * visibilityDrive + (zone.motion === "pulse" ? 0.03 * waveProgress : 0) + pulse;
  const alpha = canShow ? clamp((isEcho ? 0.78 : 0.24) + visibilityDrive * (isEcho ? 0.18 : 0.82)) : 0;
  const blur = canShow ? (1 - visibilityDrive) * 5 : 10;
  const saturation = isEcho ? 0.94 + 0.08 * visibilityDrive : 0.84 + 0.34 * visibilityDrive;

  return {
    item,
    visible: canShow,
    emphasis,
    cyclePhase: wrapped - frameIndex,
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
  };
}

function Tile({
  layout,
  zone,
  progress,
  reducedMotion,
  index,
  seeded = false,
  seedSnapshot,
}: {
  layout: LayoutDefinition;
  zone: ZoneDefinition;
  progress: number;
  reducedMotion: boolean;
  index: number;
  seeded?: boolean;
  seedSnapshot?: EmbeddedSeedSnapshot;
}) {
  const items = families.get(zone.key) ?? [];
  if (items.length === 0) {
    return null;
  }

  const isEcho = layout.band === 3;
  const emphasisProgress = isEcho
    ? clamp(1 - (progress * connectedSalonConfig.echoSpeed - connectedSalonConfig.echoBias))
    : clamp(progress * connectedSalonConfig.primarySpeed - layout.band * connectedSalonConfig.primaryBandLag + connectedSalonConfig.primaryBoost);

  const emphasisIn = smoothstep(
    progress,
    isEcho ? connectedSalonConfig.echoStart : 0.16 * layout.band,
    isEcho ? connectedSalonConfig.echoEnd : 0.44 + 0.16 * layout.band,
  );
  const exitProgress = 1 - smoothstep(
    progress,
    isEcho ? connectedSalonConfig.exitStart + 0.01 : connectedSalonConfig.exitStart + 0.02 * layout.band,
    1,
  );

  const tile = computeTileState(
    zone,
    items,
    emphasisProgress,
    reducedMotion,
    connectedSalonConfig.transitionGain,
    connectedSalonConfig.pulseAmplitude,
    isEcho,
  );

  const wave = Math.sin(progress * Math.PI * connectedSalonConfig.waveFrequency + 0.74 * index);
  const embeddedXDrift = 0.48 * Math.sin(progress * Math.PI * 1.02 + 0.05 * zone.x + 0.21 * index);
  const embeddedYDrift = 0.34 * Math.cos(progress * Math.PI * 0.82 + 0.03 * zone.y);
  const embeddedImageX = 0.22 * Math.sin(progress * Math.PI * 0.88 + 0.04 * zone.x);
  const embeddedImageY = 0.3 * Math.cos(progress * Math.PI * 0.72 + 0.03 * zone.y);
  const imageScale = 1.018 + 0.006 * Math.sin(progress * Math.PI * 0.54 + 0.17 * index + 0.01 * zone.y);
  const driftX =
    wave *
      (isEcho ? connectedSalonConfig.echoDrift : connectedSalonConfig.primaryDrift) *
      emphasisIn *
      Math.max(exitProgress, isEcho ? 0.36 : 0.5) *
      (layout.reverse ? -1 : 1) +
    embeddedXDrift;
  const liftRange = isEcho
    ? connectedSalonConfig.echoLiftStart + (connectedSalonConfig.echoLiftEnd - connectedSalonConfig.echoLiftStart) * clamp(emphasisIn)
    : connectedSalonConfig.primaryLiftStart + (connectedSalonConfig.primaryLiftEnd - connectedSalonConfig.primaryLiftStart) * clamp(emphasisIn);
  const driftY = liftRange * Math.max(exitProgress, isEcho ? 0.42 : 0.58) + (isEcho ? 0 : embeddedYDrift);
  const firstFrame = firstFrameEntries[zone.key];
  const useFirstFrame = firstFrame?.itemName === tile.item.name;
  const imageSrc = useFirstFrame ? firstFrame.desktop.src : tile.item.src;
  const imageSrcSet = useFirstFrame
    ? `${firstFrame.mobile.src} ${firstFrame.mobile.width}w, ${firstFrame.desktop.src} ${firstFrame.desktop.width}w`
    : undefined;
  const width = useFirstFrame ? firstFrame.desktop.width : 900;
  const height = useFirstFrame ? firstFrame.desktop.height : 1200;
  const loading = index < 4 ? "eager" : "lazy";
  const fetchPriority = index < 2 ? "high" : "auto";
  const renderedItemName = seeded ? seedSnapshot?.itemName ?? tile.item.name : tile.item.name;
  const renderedImageSrc = seeded ? seedSnapshot?.src ?? imageSrc : imageSrc;
  const renderedImageSrcSet = seeded ? seedSnapshot?.srcSet ?? undefined : imageSrcSet;
  const renderedWidth = seeded ? (renderedImageSrcSet ? 400 : 900) : width;
  const renderedHeight = seeded ? (renderedImageSrcSet ? 533 : 1200) : height;
  const renderedSizes = seeded
    ? renderedImageSrcSet
      ? "(max-width: 720px) 118px, (max-width: 1200px) 148px, 198px"
      : undefined
    : useFirstFrame
      ? "(max-width: 720px) 118px, (max-width: 1200px) 148px, 198px"
      : undefined;
  const renderedStyle = seeded && seedSnapshot
    ? seedSnapshot.style
    : ({
        "--x": `${layout.x * connectedSalonConfig.spacingScale}%`,
        "--y": `${layout.y * connectedSalonConfig.spacingScale}%`,
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
      } as CSSProperties);

  return (
    <section
      className={`${styles.tile} ${isEcho ? styles.tileEcho : ""}`}
      data-embedded-zone="true"
      data-zone-key={zone.key}
      data-current-item={renderedItemName}
      data-first-frame-desktop-src={firstFrame?.desktop.src}
      data-first-frame-mobile-src={firstFrame?.mobile.src}
      data-loading={loading}
      data-fetch-priority={fetchPriority}
      data-loading-strategy="decode-smoothed-scrub"
      style={renderedStyle}
    >
      <div className={styles.tileAnchor}>
        <figure className={styles.tileFigure}>
          <img
            alt={renderedItemName.replaceAll("_", " ")}
            className={styles.tileImage}
            decoding="async"
            fetchPriority={fetchPriority as "high" | "auto"}
            height={renderedHeight}
            loading={loading}
            sizes={renderedSizes}
            src={renderedImageSrc}
            srcSet={renderedImageSrcSet ?? undefined}
            width={renderedWidth}
          />
        </figure>
        <div className={styles.tileCaption}>
          <span className={styles.tileCaptionTitle}>{renderedItemName.replaceAll("_", " ")}</span>
        </div>
      </div>
    </section>
  );
}

export default function ProductsCorridorPreview({
  verifyMode = false,
}: {
  verifyMode?: boolean;
}) {
  const rootRef = useRef<HTMLElement | null>(null);
  const [reducedMotion, setReducedMotion] = useState(verifyMode);
  const [rawProgress, setRawProgress] = useState(verifyMode ? 1 : 0.08);
  const [progress, setProgress] = useState(verifyMode ? 1 : 0.08);
  const layouts = useMemo(
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
    if (reducedMotion) {
      setRawProgress(1);
      setProgress(1);
      return;
    }

    setProgress((previous) => {
      const next = previous + (rawProgress - previous) * 0.18;
      return Math.abs(next - previous) > 0.0005 ? next : previous;
    });
  }, [rawProgress, reducedMotion]);

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
  }, [reducedMotion, verifyMode]);

  const seeded = !reducedMotion && progress < 0.16;

  return (
    <section
      className={styles.pageShell}
      ref={rootRef}
      aria-label="View more products and contact us"
      data-products-preview="true"
      data-verify-mode={verifyMode ? "true" : undefined}
    >
      <div className={styles.variantStack}>
        <section
          className={`${styles.variantTrack} ${styles.variantTrackEmbedded}`}
          data-lab-variant="true"
          style={
            {
              "--variant-progress": progress.toFixed(4),
              "--variant-shift": `${(connectedSalonConfig.chapterShift * clamp(progress)).toFixed(3)}rem`,
              "--variant-track": `${connectedSalonConfig.trackVh}dvh`,
              "--variant-chapter": `${connectedSalonConfig.chapterVh}dvh`,
              "--variant-chapter-width": `${connectedSalonConfig.chapterWidthPx}px`,
              "--variant-chapter-inset": `${connectedSalonConfig.chapterInsetRem}rem`,
            } as React.CSSProperties
          }
        >
          <div className={`${styles.variantViewport} ${styles.variantViewportEmbedded}`}>
            <div className={`${styles.variantChapter} ${styles.variantChapterEmbedded}`}>
              <div className={styles.variantPlane} />
              {layouts.map(({ layout, zone }, index) => (
                <Tile
                  index={index}
                  key={`${connectedSalonConfig.slug}-${layout.key}-${index}`}
                  layout={layout}
                  progress={progress}
                  reducedMotion={reducedMotion}
                  seedSnapshot={seeded ? embeddedSeedSnapshots[layout.key] : undefined}
                  seeded={seeded}
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
