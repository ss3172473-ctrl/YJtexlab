"use client";

import Image from "next/image";
import { createPortal } from "react-dom";
import { useState } from "react";
import { motion, useIsPresent } from "motion/react";
import { Autoplay, FreeMode } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/free-mode";

import type { Variant } from "./catalog";
import type { SmallExpansion } from "./small-expansion-layout";
import { colorName, type Language } from "./language";
import { chip } from "./swatch-color";
import { paintedAccent } from "./painted-accent";
import styles from "./swatch-expansion.module.css";

const modules = [Autoplay, FreeMode];
export const expansionSpring = { type: "spring", stiffness: 170, damping: 31, mass: 0.9 } as const;
const revealEase = [.22, .68, .26, 1] as const;

export type ExpansionBounds = {
  start: number; end: number; top: number; height: number; leftWidth: number; rightWidth: number;
  leftEdge: number; rightEdge: number; small?: SmallExpansion;
};

function ColorRail({ variants, side, edge, width, top, height, language, onOpen, onPreview }: {
  variants: Variant[];
  side: "left" | "right";
  edge: number;
  width: number;
  top: number;
  height: number;
  language: Language;
  onOpen: (variant: Variant) => void;
  onPreview: (variant?: Variant) => void;
}) {
  const visible = useIsPresent();
  const left = side === "left";
  const folded = left ? "inset(0 0 0 100%)" : "inset(0 100% 0 0)";
  const slideWidth = Math.round(height * 2 / 3);

  return <motion.div
    className={styles.rail}
    data-color-rail={side}
    style={{ left: edge, top, width, height, pointerEvents: visible ? "auto" : "none" }}
    initial={{ clipPath: folded, x: left ? 14 : -14 }}
    animate={{ clipPath: "inset(0 0 0 0)", x: 0 }}
    exit={{ clipPath: folded, x: left ? 10 : -10, transition: { duration: .28, ease: revealEase } }}
    transition={{ duration: .46, ease: revealEase, delay: .07 }}
  >
    <Swiper
      modules={modules}
      slidesPerView="auto"
      spaceBetween={14}
      loop
      loopAdditionalSlides={4}
      freeMode={{ enabled: true, momentum: false }}
      speed={2550}
      allowTouchMove={false}
      autoplay={{ delay: 0, disableOnInteraction: false, pauseOnMouseEnter: true, reverseDirection: !left }}
    >
      {variants.map((variant, index) => <SwiperSlide key={`${variant.sku}:${index}`} style={{ width: slideWidth }}>
        <button type="button" tabIndex={-1} className={styles.photo}
          aria-label={`${colorName(variant.color, language)} · ${variant.sku}`} onPointerEnter={() => onPreview(variant)} onPointerLeave={() => onPreview()} onClick={() => onOpen(variant)}>
          {variant.image
            ? <Image src={variant.image} alt="" fill unoptimized loading="lazy" fetchPriority="low" decoding="async" referrerPolicy="no-referrer" />
            : <span style={{ background: chip(variant.color) }} className={styles.noImage} />}
        </button>
      </SwiperSlide>)}
    </Swiper>
  </motion.div>;
}

function StaticPhoto({ variant, width, language, onOpen, onPreview }: {
  variant: Variant; width: number; language: Language;
  onOpen: (variant: Variant) => void; onPreview: (variant?: Variant) => void;
}) {
  const [accent, setAccent] = useState<string>();
  const [missing, setMissing] = useState(false);
  const fallback = chip(variant.color);
  const showChip = missing || !variant.image;
  const loadedColor = showChip ? fallback : accent;
  return <button type="button" tabIndex={-1} className={styles.photo}
    data-static-swatch={variant.sku} data-ready={Boolean(loadedColor)} style={{ width }}
    aria-label={`${colorName(variant.color, language)} · ${variant.sku}`} onClick={() => onOpen(variant)}
    onPointerEnter={() => onPreview(variant)} onPointerLeave={() => onPreview()}>
    {!showChip ? <Image src={variant.image!} alt="" fill unoptimized loading="eager" fetchPriority="low"
      decoding="async" referrerPolicy="no-referrer" onError={() => setMissing(true)}
      onLoad={async ({ currentTarget: image }) => {
        try { if (typeof image.decode === "function") await image.decode(); }
        catch { if (image.isConnected) setMissing(true); return; }
        if (image.isConnected && image.naturalWidth) setAccent(paintedAccent(image, fallback));
      }} /> : <span style={{ background: fallback }} className={styles.noImage} />}
    {loadedColor && <span className={styles.staticAccent} data-accent-sku={variant.sku} aria-hidden="true"
      style={{ background: loadedColor }} />}
  </button>;
}

export default function SwatchExpansion({ groupName, cover, colors, language, bounds, onOpen, onPreview }: {
  groupName: string;
  cover: Variant;
  colors: Variant[];
  language: Language;
  bounds: ExpansionBounds;
  onOpen: (variant: Variant) => void;
  onPreview: (variant?: Variant) => void;
}) {
  const visible = useIsPresent();
  const alternatives = colors.filter(({ sku }) => sku !== cover.sku);
  if (!alternatives.length) return null;

  const { start, end, top, height, leftWidth, rightWidth } = bounds;
  if (bounds.small) {
    const { leftCount, cardWidth, gap } = bounds.small;
    const lane = (side: "left" | "right", variants: Variant[], x: number, width: number) => {
      if (!variants.length) return null;
      const left = side === "left";
      return <motion.div className={styles.staticRail} data-color-rail={side}
        style={{ left: x, top, height, width, gap, pointerEvents: visible ? "auto" : "none" }}
        initial={{ x: left ? 10 : -10, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: left ? 8 : -8, opacity: 0,
          transition: { x: expansionSpring, opacity: { duration: .23, ease: revealEase } } }}
        transition={{ x: expansionSpring, opacity: { duration: .36, delay: .035, ease: revealEase } }}>
        {variants.map((variant) => <StaticPhoto key={variant.sku} variant={variant} width={cardWidth}
          language={language} onOpen={onOpen} onPreview={onPreview} />)}
      </motion.div>;
    };
    return createPortal(<div className={styles.expansion} data-swatch-expansion={groupName} data-static-expansion>
      {lane("left", alternatives.slice(0, leftCount), bounds.leftEdge - gap - leftWidth, leftWidth)}
      {lane("right", alternatives.slice(leftCount), bounds.rightEdge + gap, rightWidth)}
    </div>, document.body);
  }
  const slideWidth = height * 2 / 3 + 14;
  // Leave enough track on either side for Swiper's loop, including a group with one alternative.
  const minimumSlides = Math.ceil(Math.max(leftWidth, rightWidth) / slideWidth) + 8;
  const repeats = Math.max(2, Math.ceil(minimumSlides / alternatives.length));
  const left = Array.from({ length: repeats }, () => alternatives).flat();
  const right = left.slice(1).concat(left[0]);

  return createPortal(<div className={styles.expansion} data-swatch-expansion={groupName}>
    {leftWidth > 0 && <ColorRail side="left" edge={start} width={leftWidth} top={top} height={height}
      variants={left} language={language} onOpen={onOpen} onPreview={onPreview} />}
    {rightWidth > 0 && <ColorRail side="right" edge={end - rightWidth} width={rightWidth} top={top} height={height}
      variants={right} language={language} onOpen={onOpen} onPreview={onPreview} />}
  </div>, document.body);
}
