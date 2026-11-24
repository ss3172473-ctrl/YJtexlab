"use client";

import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import type { Swiper as SwiperInstance } from "swiper";
import { EffectCoverflow } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/effect-coverflow";
import type { Variant } from "./catalog";
import { colorName, swatchesText, type Language } from "./language";
import { chip } from "./swatch-color";
import styles from "./color-gallery.module.css";
import FoldCorner from "./fold-corner";
import { validFoldSku } from "./fold-surface";
import shared from "./swatches.module.css";

const wrap = (index: number, count: number) => ((index % count) + count) % count;
const modules = [EffectCoverflow];
const coverflow = { rotate: 49, stretch: "23%", depth: 170, modifier: 1, slideShadows: false } as const;

export default function ColorGallery({
  variants, active, onSelect, language, sampleImages,
}: {
  variants: Variant[];
  active: number;
  onSelect: (index: number) => void;
  language: Language;
  sampleImages?: boolean;
}) {
  const count = variants.length;
  const canRotate = count > 1;
  const t = swatchesText(language);
  const [reducedMotion, setReducedMotion] = useState(false);
  const swiper = useRef<SwiperInstance | null>(null);
  const stage = useRef<HTMLDivElement>(null);
  const resizeCorrecting = useRef(false);
  const currentSku = variants[active]?.sku;
  const intro = useRef({ sku: currentSku, consumed: false });
  const claimIntro = useCallback((sku: string) => {
    if (intro.current.consumed || intro.current.sku !== sku) return false;
    intro.current.consumed = true;
    return true;
  }, []);
  useEffect(() => {
    if (currentSku !== intro.current.sku) intro.current.consumed = true;
  }, [currentSku]);
  const selected = useRef(active);
  const [center, setCenter] = useState(active + Number(canRotate));
  const slots = canRotate ? [variants[count - 1], ...variants, variants[0]] : variants;

  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(preference.matches);
    update();
    preference.addEventListener("change", update);
    return () => preference.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const node = stage.current;
    if (!node || !("ResizeObserver" in window)) return;
    let previous = node.clientWidth;
    let frame = 0;
    const resize = new ResizeObserver(() => {
      const next = node.clientWidth;
      if (!next || Math.abs(next - previous) < 1) return;
      previous = next;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const instance = swiper.current;
        if (!instance || instance.destroyed) return;
        const target = selected.current + Number(canRotate);
        resizeCorrecting.current = true;
        try { instance.update(); instance.slideTo(target, 0, false); }
        finally { resizeCorrecting.current = false; }
        setCenter(target);
      });
    });
    resize.observe(node);
    return () => { resize.disconnect(); cancelAnimationFrame(frame); };
  }, [canRotate]);

  useEffect(() => {
    if (selected.current === active) return;
    selected.current = active;
    const target = active + Number(canRotate);
    swiper.current?.slideTo(target, 0, false);
    setCenter(target);
  }, [active, canRotate]);

  function selectSlide(slot: number) {
    const instance = swiper.current;
    if (!instance || instance.destroyed || !canRotate) return;
    const distance = Math.abs(slot - instance.activeIndex);
    if (!distance) return;
    const duration = reducedMotion ? 0 : Math.min(1850, 340 + distance * 150);
    instance.slideTo(slot, duration);
  }

  function step(delta: number) {
    const current = swiper.current?.activeIndex ?? active + 1;
    selectSlide(Math.max(0, Math.min(count + 1, current + delta)));
  }

  function selectFromSwiper(instance: SwiperInstance) {
    if (resizeCorrecting.current) return;
    const index = canRotate ? wrap(instance.activeIndex - 1, count) : 0;
    setCenter(instance.activeIndex);
    if (index === selected.current) return;
    selected.current = index;
    onSelect(index);
  }

  function normalizeEdge(instance: SwiperInstance) {
    if (!canRotate || instance.destroyed) return;
    const index = instance.activeIndex;
    if (index === 0 || index === count + 1) {
      const equivalent = index === 0 ? count : 1;
      instance.slideTo(equivalent, 0, false);
      setCenter(equivalent);
    }
  }

  function colorLabel(variant: Variant) {
    return `${colorName(variant.color, language)} · ${variant.sku}`;
  }

  return (
    <section className={styles.gallery} aria-label={t("gallery")} onKeyDown={(event) => {
      const delta = event.key === "ArrowLeft" ? -1 : event.key === "ArrowRight" ? 1 : 0;
      if (delta && canRotate) {
        event.preventDefault();
        step(delta);
      }
    }}>
      <div className={styles.stage} ref={stage} data-carousel-engine="swiper-coverflow">
        <Swiper
          modules={modules}
          effect="coverflow"
          coverflowEffect={coverflow}
          slidesPerView="auto"
          centeredSlides
          initialSlide={active + Number(canRotate)}
          speed={reducedMotion ? 0 : 510}
          allowTouchMove={canRotate}
          watchOverflow={false}
          threshold={6}
          onSwiper={(instance) => { swiper.current = instance; }}
          onSlideChange={selectFromSwiper}
          onTransitionEnd={normalizeEdge}
        >
          {slots.map((variant, slot) => {
            const relative = slot - center;
            const direction = relative === 0 ? "center" : relative === -1 ? "left" : relative === 1 ? "right" : undefined;
            return <SwiperSlide key={`${slot}-${variant.sku}`} className={styles.panel}
              data-panel-sku={variant.sku} data-panel-position={direction}>
              {Math.abs(relative) <= 2 && variant.image && <Image src={variant.image} alt={direction === "center" ? colorLabel(variant) : ""}
                fill unoptimized loading="eager" fetchPriority={relative === 0 ? "high" : "low"} decoding="async" draggable={false} referrerPolicy="no-referrer" />}
              {direction === "center" && variant.sku === currentSku && validFoldSku(variant.sku) && variant.image && variant.reverse &&
                <FoldCorner sku={variant.sku} frontSrc={variant.image} reverseSrc={variant.reverse} claimIntro={claimIntro}
                  label={language === "ko" ? `${variant.sku} 원단 뒷면 보기` : language === "zh-CN" ? `查看 ${variant.sku} 面料背面` : `Show reverse of ${variant.sku}`} />}
              <span className={styles.edge} style={{ "--panel-color": chip(variant.color) } as CSSProperties} aria-hidden="true" />
            </SwiperSlide>;
          })}
        </Swiper>
        {canRotate && <>
          <button type="button" className={`${styles.panelSelect} ${styles.left}`}
            aria-label={`${t("previous")}, ${colorLabel(variants[wrap(active - 1, count)])}`}
            onClick={() => step(-1)} />
          <button type="button" className={`${styles.panelSelect} ${styles.right}`}
            aria-label={`${t("next")}, ${colorLabel(variants[wrap(active + 1, count)])}`}
            onClick={() => step(1)} />
        </>}
      </div>
      {canRotate && <div className={styles.controls}>
        <button type="button" className={shared.iconButton} onClick={() => step(-1)} aria-label={t("previous")}><ChevronLeft size={17} /></button>
        <span className={shared.mono} aria-live="polite">{String(active + 1).padStart(2, "0")} / {String(count).padStart(2, "0")}</span>
        <button type="button" className={shared.iconButton} onClick={() => step(1)} aria-label={t("next")}><ChevronRight size={17} /></button>
      </div>}
      <div className={shared.chips} aria-label={t("colors")}>
        {variants.map((item, index) => <button
          key={item.sku}
          type="button"
          className={shared.chipButton}
          aria-pressed={index === active}
          aria-label={colorLabel(item)}
          title={colorLabel(item)}
          onClick={() => selectSlide(index + Number(canRotate))}
        >
          <span className={shared.chip} style={{ background: chip(item.color) }} />
        </button>)}
      </div>
      {sampleImages && <p className={styles.previewNote}>{t("previewPhoto")}</p>}
    </section>
  );
}
