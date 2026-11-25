"use client";

import Image from "next/image";
import { firstRowCanary, PreparedCover } from "./prepared-cover";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowUpRight, Pause, Play } from "lucide-react";

import type { Pattern, Variant } from "./catalog";
import { packSwatchesRows, type SwatchesLayout } from "./design-layout";
import { chip } from "./swatch-color";
import { paintedAccent } from "./painted-accent";
import { arrangeSpecimens, curateSpecimens, type CuratedSpecimen } from "./curation";
import { colorName, countLabel, fabricName, swatchesText, type Language } from "./language";
import SwatchExpansion, { expansionSpring, type ExpansionBounds } from "./swatch-expansion";
import { fitSmallExpansion } from "./small-expansion-layout";
import { welcomeRowCovers } from "./welcome-covers";
import styles from "./swatches.module.css";

type OpenPattern = (group: Pattern, selected: Variant) => void;
type SpecimenData = CuratedSpecimen;
type GridEditor = { selected: string; onMove: (from: string, to: string) => void };
const patternDrag = "application/x-yj-swatch-pattern";

type Focus = { item: SpecimenData; source: DOMRect; rails: ExpansionBounds; offsets: Record<string, { x: number; hidden: boolean }> };

// One observer for the collection: do not create network requests for the full grid.
const photoObservers = new Map<Element, () => void>();
let photoObserver: IntersectionObserver | undefined;

function observePhoto(node: Element, load: () => void) {
  if (!("IntersectionObserver" in window)) { load(); return () => {}; }
  photoObserver ??= new IntersectionObserver((entries, observer) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      photoObservers.get(entry.target)?.();
      photoObservers.delete(entry.target);
      observer.unobserve(entry.target);
    }
  }, { rootMargin: "140px 0px", threshold: 0 });
  photoObservers.set(node, load);
  photoObserver.observe(node);
  return () => {
    photoObservers.delete(node);
    photoObserver?.unobserve(node);
  };
}

function SpecimenPhoto({ variant, variants, hero, cycle, index, manualSku, groupName, onShown, warmBehindWelcome, warmedCover, allowListThumb, onCoverReady }: {
  variant: Variant; variants: Variant[]; hero: boolean; cycle: boolean; index: number; manualSku?: string; groupName: string; onShown: (group: string, sku: string) => void;
  warmBehindWelcome: boolean; warmedCover: boolean; allowListThumb: boolean; onCoverReady?: () => void;
}) {
  const frame = useRef<HTMLSpanElement>(null);
  const [inRange, setInRange] = useState(false);
  const [shown, setShown] = useState(variant.sku);
  const [pending, setPending] = useState<string>();
  const [requested, setRequested] = useState<string[]>([variant.sku]);
  const [loaded, setLoaded] = useState<Record<string, string>>({});
  const pendingRef = useRef<{ sku: string; kind: "auto" | "manual" }>();
  const cycleEnabledRef = useRef(cycle);
  cycleEnabledRef.current = cycle;
  const mayAutoCommit = () => {
    const node = frame.current;
    if (!cycleEnabledRef.current || !node || document.hidden || node.closest("li")?.matches(":hover, :focus-within")) return false;
    const rect = node.getBoundingClientRect();
    return rect.bottom >= 0 && rect.top < window.innerHeight;
  };
  const imageFailed = (sku: string) => {
    setFailed((before) => before.includes(sku) ? before : [...before, sku]);
    if (pendingRef.current?.sku === sku) { pendingRef.current = undefined; setPending(undefined); }
  };
  const [failed, setFailed] = useState<string[]>([]);
  const choices = useMemo(() => [variant, ...variants.filter((v) => v.sku !== variant.sku && v.image)], [variant, variants]);

  useEffect(() => { onShown(groupName, shown); }, [groupName, onShown, shown]);
  useEffect(() => {
    const selectedSku = manualSku?.split(":")[0];
    if (!selectedSku || !choices.some((v) => v.sku === selectedSku)) return;
    if (selectedSku === shown) {
      pendingRef.current = undefined;
      setPending(undefined);
      return;
    }
    if (loaded[selectedSku]) { pendingRef.current = undefined; setPending(undefined); setShown(selectedSku); return; }
    if (failed.includes(selectedSku)) return;
    setInRange(true);
    pendingRef.current = { sku: selectedSku, kind: "manual" };
    setPending(selectedSku);
    setRequested((current) => current.includes(selectedSku) ? current : [...current, selectedSku]);
    // Manual selection is applied once, not a lock on later auto-rotation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [manualSku]);

  useEffect(() => {
    if (hero || inRange || warmBehindWelcome || !frame.current) return;
    return observePhoto(frame.current, () => setInRange(true));
  }, [hero, inRange, warmBehindWelcome]);

  useEffect(() => {
    if (!cycle || !(hero || inRange) || choices.length < 2 || pending) return;
    const timer = window.setInterval(() => {
      const node = frame.current;
      if (!node || document.hidden || node.closest("li")?.matches(":hover, :focus-within")) return;
      const rect = node.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top >= window.innerHeight) return;
      const usable = choices.filter((v) => !failed.includes(v.sku));
      if (usable.length < 2) return;
      const next = usable[(usable.findIndex((v) => v.sku === shown) + 1) % usable.length];
      if (loaded[next.sku]) setShown(next.sku);
      else {
        pendingRef.current = { sku: next.sku, kind: "auto" };
        setPending(next.sku);
        setRequested((current) => current.includes(next.sku) ? current : [...current, next.sku]);
      }
    }, 3600 + (index % 7) * 310);
    return () => window.clearInterval(timer);
  }, [cycle, choices, failed, hero, inRange, index, loaded, pending, shown]);

  const canRender = warmBehindWelcome ? warmedCover : (hero || inRange || warmedCover);
  const canUseThumb = allowListThumb && choices.some(entry => entry.listThumb);
  const [density, setDensity] = useState<"thumbnail" | "original">();
  const [thumbFailures, setThumbFailures] = useState<string[]>([]);
  useLayoutEffect(() => {
    const node = frame.current;
    if (!node || !canRender || !canUseThumb || density === "original") return;
    const measure = () => {
      const width = node.getBoundingClientRect().width;
      // Once an original was chosen, don't downgrade and fetch a second copy.
      const fits = width > 0 && Math.ceil(width * (window.devicePixelRatio || 1)) <= 384;
      setDensity(before => before === "original" || !fits ? "original" : "thumbnail");
    };
    measure();
    const resize = typeof ResizeObserver === "undefined" ? undefined : new ResizeObserver(measure);
    resize?.observe(node);
    window.addEventListener("resize", measure);
    return () => {
      resize?.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [canRender, canUseThumb, density]);
  const accent = loaded[shown];
  return <span ref={frame} className={styles.mainSpecimenPhoto} data-rendered-sku={shown} data-painted-sku={accent ? shown : undefined}>
    <span className={styles.unpaintedCover}>
      {failed.includes(shown) && <span className={styles.specimenPhotoError}>사진 로드 오류</span>}
    </span>
    {canRender && choices.filter((v) => v.image && requested.includes(v.sku)).map((entry) => {
      const thumbnail = canUseThumb && !!entry.listThumb && !thumbFailures.includes(entry.sku);
      if (thumbnail && !density) return null;
      const useThumb = thumbnail && density === "thumbnail";
      const src = useThumb ? entry.listThumb! : entry.image!;
      const loadFailed = () => {
        if (useThumb) setThumbFailures(before => before.includes(entry.sku) ? before : [...before, entry.sku]);
        else imageFailed(entry.sku);
      };
      // Next Image can rewrite a relative src attribute as an absolute URL.
      const isCurrentImage = (image: HTMLImageElement) => image.isConnected
        && image.src === new URL(src, image.baseURI).href;
      const Cover = firstRowCanary() ? PreparedCover : Image;
      return <Cover key={src} src={src} alt="" fill unoptimized loading="eager"
        className={styles.rotatingCover} data-cover-sku={entry.sku} data-visible={Boolean(loaded[entry.sku]) && shown === entry.sku} aria-hidden="true"
        fetchPriority={hero && entry.sku === variant.sku ? "high" : "low"} decoding="async" referrerPolicy="no-referrer"
        onLoad={async ({ currentTarget: image }) => {
          try { if (typeof image.decode === "function") await image.decode(); }
          catch { if (isCurrentImage(image)) loadFailed(); return; }
          if (!isCurrentImage(image)) return;
          if (!image.naturalWidth) { loadFailed(); return; }
          const color = paintedAccent(image, chip(entry.color));
          setLoaded((before) => before[entry.sku] === color ? before : { ...before, [entry.sku]: color });
          if (warmedCover && entry.sku === variant.sku) onCoverReady?.();
          const wanted = pendingRef.current;
          if (wanted?.sku === entry.sku) {
            pendingRef.current = undefined;
            setPending(undefined);
            if (wanted.kind === "manual" || mayAutoCommit()) setShown(entry.sku);
          }
        }}
        onError={({ currentTarget: image }) => { if (isCurrentImage(image)) loadFailed(); }} />;
    })}
    {accent && <span aria-hidden="true" className={styles.paintedAccent}
      data-accent-sku={shown} style={{ background: accent }} />}
  </span>;
}

function displayedVariant(node: HTMLElement, fallback: Variant, group: Pattern) {
  const sku = node.querySelector<HTMLElement>("[data-rendered-sku]")?.dataset.renderedSku;
  return group.variants.find((v) => v.sku === sku) ?? fallback;
}

export default function SpecimenGrid({ patterns, language, query, onQuery, onOpen, layout, editor, warmBehindWelcome = false, onFirstCoverReady }: {
  patterns: Pattern[];
  language: Language;
  query: string;
  onQuery: (value: string) => void;
  onOpen: OpenPattern;
  layout?: SwatchesLayout;
  editor?: GridEditor;
  warmBehindWelcome?: boolean;
  onFirstCoverReady?: () => void;
}) {
  const t = swatchesText(language);
  const search = Boolean(query.trim());
  const curated = useMemo(() => curateSpecimens(patterns), [patterns]);
  const order = layout?.order;
  const covers = layout?.covers;
  const sizes = layout?.sizes;
  const specimens = useMemo(() => arrangeSpecimens(curated, order, covers), [curated, order, covers]);
  const columns = layout?.columns ?? 5;
  const reposition = useMemo(() => ({ order, sizes, columns }), [order, sizes, columns]);
  const designed = !search && (layout?.columns || layout?.rowGap || layout?.columnGap);
  // Keep the exact initially warmed image nodes on reveal, even if the viewport,
  // search or catalog order changes later. The observer handles newly visible cards.
  const [warmedCovers] = useState(() => {
    if (!warmBehindWelcome || editor || search || typeof window === "undefined") return new Set<string>();
    return welcomeRowCovers(specimens.map(({ group, representative }) => ({
      image: representative.image, span: sizes?.[group.name] ?? 1,
    })), window.innerWidth, designed ? columns : 6);
  });
  const [drag, setDrag] = useState<{ from: string; over: string }>();
  const reducedMotion = useReducedMotion();
  const [cyclePaused, setCyclePaused] = useState(false);
  const cycleLabel = language === "ko" ? ["색상 자동 전환 일시 정지", "색상 자동 전환 재생"]
    : language === "zh-CN" ? ["暂停颜色轮换", "继续颜色轮换"] : ["Pause color rotation", "Play color rotation"];
  const list = useRef<HTMLUListElement>(null);
  const openTimer = useRef<number | undefined>(undefined);
  const closeTimer = useRef<number | undefined>(undefined);
  const suppressUntil = useRef(0);
  const [focus, setFocus] = useState<Focus | null>(null);
  const [shownByGroup, setShownByGroup] = useState<Record<string, string>>({});
  const [manual, setManual] = useState<Record<string, string>>({});
  const [hoveredChoice, setHoveredChoice] = useState<string>();
  const updateShown = useCallback((name: string, sku: string) => {
    setShownByGroup((prev) => prev[name] === sku ? prev : { ...prev, [name]: sku });
  }, []);

  const close = useCallback(() => {
    window.clearTimeout(openTimer.current);
    window.clearTimeout(closeTimer.current);
    suppressUntil.current = performance.now() + 245;
    setHoveredChoice(undefined);
    setFocus(null);
  }, []);

  useEffect(() => () => {
    window.clearTimeout(openTimer.current);
    window.clearTimeout(closeTimer.current);
  }, []);

  useEffect(() => {
    if (!focus) return;
    function checkPointer(event: globalThis.PointerEvent) {
      if (!focus) return;
      const { clientX: x, clientY: y } = event;
      const { source, rails } = focus;
      const overCover = x >= source.left - 8 && x <= source.right + 8 &&
        y >= source.top - 8 && y <= source.bottom + 35;
      const railLeft = rails.small ? source.left - (rails.leftWidth ? rails.leftWidth + rails.small.gap : 0)
        : rails.leftWidth ? rails.start : source.left;
      const railRight = rails.small ? source.right + (rails.rightWidth ? rails.rightWidth + rails.small.gap : 0)
        : rails.rightWidth ? rails.end : source.right;
      const overRail = y >= rails.top - 12 && y <= rails.top + rails.height + 12 &&
        x >= railLeft - 8 && x <= railRight + 8;
      const bridgesShiftedRail = rails.small && x >= source.left - 8 && x <= source.right + 8 &&
        y >= Math.min(source.top, rails.top) - 8 && y <= Math.max(source.bottom, rails.top + rails.height) + 8;
      window.clearTimeout(closeTimer.current);
      if (!overCover && !overRail && !bridgesShiftedRail) closeTimer.current = window.setTimeout(close, 110);
    }
    function escape(event: KeyboardEvent) {
      if (event.key === "Escape") close();
    }
    window.addEventListener("pointermove", checkPointer, { passive: true });
    window.addEventListener("blur", close);
    window.addEventListener("scroll", close, { passive: true });
    window.addEventListener("resize", close);
    window.addEventListener("keydown", escape);
    document.documentElement.addEventListener("pointerleave", close);
    return () => {
      window.removeEventListener("pointermove", checkPointer);
      window.removeEventListener("blur", close);
      window.removeEventListener("scroll", close);
      window.removeEventListener("resize", close);
      window.removeEventListener("keydown", escape);
      document.documentElement.removeEventListener("pointerleave", close);
    };
  }, [close, focus]);

  function begin(event: PointerEvent<HTMLDivElement>, item: SpecimenData) {
    if (editor || event.pointerType !== "mouse" || reducedMotion || focus || item.group.variants.length < 2 ||
        window.innerWidth < 780 || performance.now() < suppressUntil.current) return;
    const node = event.currentTarget;
    window.clearTimeout(openTimer.current);
    openTimer.current = window.setTimeout(() => {
      const grid = list.current;
      const selected = node.closest<HTMLElement>("[data-specimen]");
      if (!grid || !selected || !node.isConnected) return;
      const source = node.getBoundingClientRect();
      const row = selected.getBoundingClientRect();
      const rowCenter = row.top + row.height / 2;
      const designedRow = window.innerWidth > 900 ? selected.dataset.row : undefined;
      const gridBounds = grid.getBoundingClientRect();
      const start = Math.max(12, gridBounds.left);
      const end = Math.min(window.innerWidth - 12, gridBounds.right);
      const gap = 16;
      const left = source.left - gap - start;
      const right = end - source.right - gap;
      const isSmall = item.group.variants.length <= 3;
      const small = isSmall ? fitSmallExpansion(item.group.variants.length - 1, source.width,
        source.left - start, end - source.right, gap) : undefined;
      if (isSmall && !small) return;
      const leftWidth = small ? small.leftWidth : left >= 100 ? left : 0;
      const rightWidth = small ? small.rightWidth : right >= 100 ? right : 0;
      if (!leftWidth && !rightWidth) return;
      const height = small ? source.height : Math.min(238, source.height * .83);
      const maxTop = Math.max(0, window.innerHeight - height);
      const top = small ? Math.max(0, Math.min(source.top, maxTop))
        : Math.max(16, Math.min(source.top + (source.height - height) / 2, window.innerHeight - height - 16));
      const offsets: Focus["offsets"] = Object.create(null);
      for (const card of Array.from(grid.querySelectorAll<HTMLElement>("[data-specimen]"))) {
        const name = card.dataset.specimen;
        if (!name || card === selected) continue;
        const rect = card.getBoundingClientRect();
        const sameRow = designedRow ? card.dataset.row === designedRow : Math.abs(rect.top + rect.height / 2 - rowCenter) <= 2;
        if (!sameRow) continue;
        if (rect.right <= source.left && leftWidth) {
          const x = small ? -leftWidth - small.gap : -source.left - 24;
          offsets[name] = { x, hidden: !small || rect.left + x < start - 1 };
        }
        if (rect.left >= source.right && rightWidth) {
          const x = small ? rightWidth + small.gap : window.innerWidth - source.right + 24;
          offsets[name] = { x, hidden: !small || rect.right + x > end + 1 };
        }
      }
      setFocus({ item, source, rails: { start, end, top, height, leftWidth, rightWidth, small,
        leftEdge: source.left, rightEdge: source.right }, offsets });
    }, 285);
  }

  function open(group: Pattern, variant: Variant) {
    if (!editor) close();
    onOpen(group, variant);
  }

  const placement = packSwatchesRows(specimens.map(({ group }) => group.name), layout?.sizes ?? {}, columns);
  const placed = specimens.map((item, index) => {
    const { span, row } = placement[index];
    return { item, row, size: search ? 1 : span, height: search ? undefined : layout?.rowHeights[String(row)] };
  });

  return <section className={styles.fabricIndex} aria-label={t("catalog")}>
    {!editor && <div className={styles.indexTools}>
      <span>{countLabel(specimens.length, "pattern", language)}</span>
      <div className={styles.indexControlGroup}>
        {!search && !reducedMotion && <button type="button" className={styles.rotationButton}
          aria-label={cycleLabel[Number(cyclePaused)]} aria-pressed={cyclePaused}
          onClick={() => setCyclePaused((value) => !value)}>
          {cyclePaused ? <Play aria-hidden="true" size={13} /> : <Pause aria-hidden="true" size={13} />}
        </button>}
        <input type="search" value={query} onChange={(event) => {
          if (focus) close();
          else window.clearTimeout(openTimer.current);
          suppressUntil.current = 0;
          onQuery(event.target.value);
        }}
          aria-label={t("search")} placeholder={t("search")} />
      </div>
    </div>}
    {placed.length ? <ul ref={list} className={styles.collection} data-layout={search ? "results" : "exhibition"} data-editing={editor ? "" : undefined} data-designed={designed ? "" : undefined}
      style={designed ? {
        "--layout-columns": columns,
        "--layout-column-gap": layout?.columnGap ? `${layout.columnGap}px` : undefined,
        "--layout-row-gap": layout?.rowGap ? `${layout.rowGap}px` : undefined,
      } as CSSProperties : undefined}>
      {placed.map(({ item, row, size, height }, index) => {
        const { group, representative } = item;
        const title = fabricName(representative.productName, language) || group.name;
        const selected = editor?.selected === group.name;
        const offset = focus?.offsets[group.name];
        const activeSku = (focus?.item.group.name === group.name && hoveredChoice)
          || shownByGroup[group.name] || representative.sku;
        const dropSide = drag?.over === group.name && drag.from !== group.name
          ? specimens.findIndex(({ group: source }) => source.name === drag.from) < index ? "after" : "before"
          : undefined;
        return <motion.li key={group.name} data-specimen={group.name} data-pushed={Boolean(offset)} data-row={editor || designed ? row : undefined}
          data-selected={selected || undefined} data-height={height || undefined} data-drop={dropSide} data-dragging={drag?.from === group.name || undefined}
          layout={editor && !reducedMotion ? "position" : undefined} layoutDependency={reposition}
          onDragOver={editor ? (event) => {
            if (!event.dataTransfer.types.includes(patternDrag)) return;
            event.preventDefault();
            event.dataTransfer.dropEffect = "move";
            setDrag((current) => current && current.over !== group.name ? { ...current, over: group.name } : current);
          } : undefined}
          onDragLeave={editor ? (event) => {
            if (event.relatedTarget instanceof Node && event.currentTarget.contains(event.relatedTarget)) return;
            setDrag((current) => current?.over === group.name ? { ...current, over: "" } : current);
          } : undefined}
          onDrop={editor ? (event) => {
            event.preventDefault();
            setDrag(undefined);
            editor.onMove(event.dataTransfer.getData(patternDrag), group.name);
          } : undefined}
          animate={{ x: offset?.x ?? 0, opacity: offset?.hidden ? 0 : 1 }}
          style={{ "--card-columns": size, "--row-height": height ? `${height}px` : "auto", pointerEvents: offset?.hidden ? "none" : undefined } as CSSProperties}
          transition={{ ...expansionSpring, layout: { type: "spring", stiffness: 320, damping: 34 },
            opacity: { duration: .32, ease: [.22, .68, .26, 1], delay: offset?.hidden ? .02 : .03 } }}
        >
          <div className={styles.specimenImage} data-sku={representative.sku}
            draggable={editor ? true : undefined}
            onDragStart={editor ? (event) => {
              event.dataTransfer.setData(patternDrag, group.name);
              event.dataTransfer.effectAllowed = "move";
              setDrag({ from: group.name, over: "" });
            } : undefined}
            onDragEnd={editor ? () => setDrag(undefined) : undefined}
            onPointerEnter={(event) => begin(event, { ...item, representative: displayedVariant(event.currentTarget, representative, group) })}
            onPointerLeave={() => window.clearTimeout(openTimer.current)}
            onPointerCancel={() => window.clearTimeout(openTimer.current)}>
            <button type="button" className={styles.mainSpecimenButton} onClick={(event) => open(group, displayedVariant(event.currentTarget, representative, group))}
              aria-pressed={editor ? selected : undefined} aria-label={`${title} · ${group.name}`}>
              <SpecimenPhoto key={representative.image ?? representative.sku} variant={representative} variants={group.variants} hero={!editor && !search && index === 0} cycle={!warmBehindWelcome && !editor && !search && !reducedMotion && !cyclePaused && group.variants.length > 3} index={index}
                manualSku={manual[group.name]} groupName={group.name} onShown={updateShown}
                allowListThumb={!editor} warmBehindWelcome={warmBehindWelcome} warmedCover={Boolean(representative.image && warmedCovers.has(representative.image))}
                onCoverReady={onFirstCoverReady} />
            </button>
          </div>
          <button type="button" className={styles.specimenInfo} onClick={(event) => open(group, displayedVariant(event.currentTarget.parentElement ?? event.currentTarget, representative, group))}>
            <span className={styles.specimenLabel}><strong>{group.name}</strong><small>{title}</small></span>
            {editor ? <small>{row}행</small> : <ArrowUpRight size={15} strokeWidth={1.45} />}
          </button>
          {!editor && <div className={styles.indicators} data-color-indicators={group.name}>
            {group.variants.map((variant) => <button type="button" key={variant.sku} data-swatch-indicator={variant.sku} aria-pressed={activeSku === variant.sku}
              aria-label={`${colorName(variant.color, language)} · ${variant.sku}`}
              onClick={() => setManual((prev) => ({ ...prev, [group.name]: `${variant.sku}:${Date.now()}` }))}>
              <span style={{ background: chip(variant.color) }} />
            </button>)}
          </div>}
        </motion.li>;
      })}
    </ul> : <p className={styles.empty}>{query ? t("noMatch") : t("noFabrics")}</p>}
    <AnimatePresence>{focus && <SwatchExpansion key={focus.item.group.name} groupName={focus.item.group.name}
      cover={focus.item.representative} colors={focus.item.group.variants}
      language={language} bounds={focus.rails}
      onPreview={(variant) => setHoveredChoice(variant?.sku)} onOpen={(variant) => open(focus.item.group, variant)} />}</AnimatePresence>
  </section>;
}
