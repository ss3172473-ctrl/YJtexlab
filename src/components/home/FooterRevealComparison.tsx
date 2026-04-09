"use client";

import { Fragment_Mono } from "next/font/google";
import Link from "next/link";
import {
  type CSSProperties,
  type Dispatch,
  type SetStateAction,
  useEffect,
  useRef,
  useState,
} from "react";

import type { FolderVariant } from "@/components/home/HomeFolderHub";
import FooterRevealPanelAdapters from "@/components/home/FooterRevealPanelAdapters";
import Footer from "@/components/site/Footer";
import styles from "./FooterRevealComparison.module.css";

const fragmentMono = Fragment_Mono({
  subsets: ["latin"],
  weight: ["400"],
  display: "swap",
});

export type FooterRevealVariant = "lift-replace" | "hold-swap" | "lift-ghost";
export type FooterRevealStage =
  | "free"
  | "rail-lock"
  | "prompt-lock"
  | "footer-release"
  | "released";

type PickKey = "a" | "b" | "c";
type SectionId = "trusted" | "global" | "facilities";
type RailHoverId = SectionId | "products";
type ActivePanel = { sectionId: SectionId; variantKey: PickKey } | null;

type ComparisonProps = {
  folderVariant?: FolderVariant;
  initialPick?: PickKey;
  verifyMode?: boolean;
};

type VariantSpec = {
  anchor: string;
  id: FooterRevealVariant;
  key: PickKey;
  name: string;
  note: string;
  recommendation?: string;
  promptLift: number;
  releaseLift: number;
  promptOpacity: number;
  footerPreviewDepth: number;
  footerPreviewBlur: number;
};

const STAGES: FooterRevealStage[] = [
  "free",
  "rail-lock",
  "prompt-lock",
  "footer-release",
  "released",
];

const hubItems: Array<{ id: SectionId; monoLabel: string }> = [
  { id: "trusted", monoLabel: "PARTNERS" },
  { id: "global", monoLabel: "GLOBAL NETWORK" },
  { id: "facilities", monoLabel: "PRODUCTION BASES" },
];

const variants: VariantSpec[] = [
  {
    anchor: "variant-a",
    id: "lift-replace",
    key: "a",
    name: "Lift Replace",
    note: "Bottom Rail이 한 단계 위로 분명히 물러나고, 원래 rail 자리에 prompt가 정확히 들어오는 기본안.",
    recommendation: "Recommended",
    promptLift: 104,
    releaseLift: 136,
    promptOpacity: 1,
    footerPreviewDepth: 1,
    footerPreviewBlur: 0,
  },
  {
    anchor: "variant-b",
    id: "hold-swap",
    key: "b",
    name: "Hold Swap",
    note: "Rail은 덜 움직이고, prompt와 footer가 더 정돈되게 이어지는 보수적인 안.",
    promptLift: 18,
    releaseLift: 42,
    promptOpacity: 0.94,
    footerPreviewDepth: 0.78,
    footerPreviewBlur: 0,
  },
  {
    anchor: "variant-c",
    id: "lift-ghost",
    key: "c",
    name: "Lift Ghost",
    note: "Lift 흔적을 잔상처럼 남기고 footer가 더 감각적으로 떠오르는 연출안.",
    promptLift: 86,
    releaseLift: 118,
    promptOpacity: 0.98,
    footerPreviewDepth: 1.08,
    footerPreviewBlur: 10,
  },
];

function clamp(value: number, min = 0, max = 1) {
  return Math.min(Math.max(value, min), max);
}

function useReducedMotion(defaultValue: boolean) {
  const [reducedMotion, setReducedMotion] = useState(defaultValue);

  useEffect(() => {
    if (defaultValue) {
      setReducedMotion(true);
      return;
    }

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(mediaQuery.matches);
    update();

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", update);
      return () => mediaQuery.removeEventListener("change", update);
    }

    mediaQuery.addListener(update);
    return () => mediaQuery.removeListener(update);
  }, [defaultValue]);

  return reducedMotion;
}

function buildCompareHref(pick: PickKey, folderVariant: FolderVariant, anchor?: string) {
  const params = new URLSearchParams({ pick });
  if (folderVariant !== "open-bottom") {
    params.set("folder", folderVariant);
  }

  return `/local-preview/footer-reveal-compare?${params.toString()}${anchor ? `#${anchor}` : ""}`;
}

function nextStage(stage: FooterRevealStage): FooterRevealStage {
  if (stage === "released") {
    return stage;
  }

  return STAGES[STAGES.indexOf(stage) + 1];
}

function previousStage(stage: FooterRevealStage): FooterRevealStage {
  if (stage === "free") {
    return stage;
  }

  return STAGES[STAGES.indexOf(stage) - 1];
}

function BottomRail({
  activeId,
  hoveredId,
  onHoverChange,
  onSelect,
}: {
  activeId: SectionId | null;
  hoveredId: RailHoverId | null;
  onHoverChange: Dispatch<SetStateAction<RailHoverId | null>>;
  onSelect: (next: SectionId) => void;
}) {
  return (
    <div className={styles.bottomRail}>
      <div className={styles.railRow}>
        <div aria-hidden="true" className={styles.railSpacer} />
        <div className={styles.labelGroup}>
          {hubItems.map((item) => {
            const isActive = activeId === item.id;
            const isDimmed = hoveredId !== null && hoveredId !== item.id;

            return (
              <button
                aria-expanded={isActive}
                className={`${styles.labelButton} ${fragmentMono.className}`}
                data-active={isActive ? "true" : undefined}
                data-dimmed={isDimmed ? "true" : undefined}
                key={item.id}
                onBlur={() => onHoverChange(null)}
                onClick={() => onSelect(item.id)}
                onFocus={() => onHoverChange(item.id)}
                onMouseDown={(event) => event.preventDefault()}
                onMouseEnter={() => onHoverChange(item.id)}
                onMouseLeave={() => onHoverChange(null)}
                type="button"
              >
                <span className={styles.railText}>{item.monoLabel}</span>
              </button>
            );
          })}
        </div>
        <div className={styles.productsSlot}>
          <Link
            className={`${styles.productsCta} ${fragmentMono.className}`}
            data-dimmed={hoveredId !== null && hoveredId !== "products" ? "true" : undefined}
            href="/products"
            onBlur={() => onHoverChange(null)}
            onFocus={() => onHoverChange("products")}
            onMouseEnter={() => onHoverChange("products")}
            onMouseLeave={() => onHoverChange(null)}
          >
            <span className={styles.railText}>View more products</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

function FooterReleasePreview({
  blur,
  depth,
}: {
  blur: number;
  depth: number;
}) {
  return (
    <div
      className={styles.footerPreviewCard}
      style={
        {
          "--footer-preview-blur": `${blur}px`,
          "--footer-preview-depth": `${depth}`,
        } as CSSProperties
      }
    >
      <div className={styles.footerPreviewBrand}>
        <span>YJ TEXLAB</span>
        <span>SINCE 1962</span>
      </div>
      <div className={styles.footerPreviewColumns}>
        <div>
          <span>Products</span>
          <span>Checks</span>
          <span>Stripes</span>
        </div>
        <div>
          <span>Company</span>
          <span>About Us</span>
          <span>Contact</span>
        </div>
        <div>
          <span>Follow</span>
          <span>Instagram</span>
          <span>LinkedIn</span>
        </div>
      </div>
    </div>
  );
}

function FooterRevealPanel({
  activeSection,
  onClose,
}: {
  activeSection: SectionId | null;
  onClose: () => void;
}) {
  if (!activeSection) {
    return null;
  }

  const activeLabel = hubItems.find((item) => item.id === activeSection)?.monoLabel ?? "";

  return (
    <>
      <button aria-label="Close panel" className={styles.overlayDismiss} onClick={onClose} type="button" />
      <div className={`${styles.panel} ${styles.panelTop}`} role="dialog" aria-modal="true" aria-label={activeLabel}>
        <div className={styles.panelHeader}>
          <span className={`${styles.panelLabel} ${fragmentMono.className}`}>{activeLabel}</span>
          <button className={`${styles.closeButton} ${fragmentMono.className}`} onClick={onClose} type="button">
            [ CLOSE ]
          </button>
        </div>
        <div className={styles.panelBody}>
          <div className={styles.panelInner}>
            <FooterRevealPanelAdapters sectionId={activeSection} />
          </div>
        </div>
      </div>
    </>
  );
}

function FooterRevealDemo({
  activeSection,
  folderVariant,
  onOpenPanel,
  panelOpen,
  selected,
  variant,
  verifyMode,
}: {
  activeSection: SectionId | null;
  folderVariant: FolderVariant;
  onOpenPanel: (next: SectionId) => void;
  panelOpen: boolean;
  selected: boolean;
  variant: VariantSpec;
  verifyMode: boolean;
}) {
  const reducedMotion = useReducedMotion(verifyMode);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const transitionTimerRef = useRef<number | null>(null);
  const lastIntentAtRef = useRef(0);
  const touchStartYRef = useRef<number | null>(null);
  const [hoveredId, setHoveredId] = useState<RailHoverId | null>(null);
  const [stage, setStage] = useState<FooterRevealStage>(verifyMode ? "released" : "free");

  useEffect(() => {
    if (verifyMode || reducedMotion) {
      setStage("released");
      return;
    }

    setStage("free");
  }, [reducedMotion, verifyMode]);

  useEffect(() => {
    if (stage !== "footer-release") {
      return;
    }

    transitionTimerRef.current = window.setTimeout(() => {
      setStage("released");
    }, 340);

    return () => {
      if (transitionTimerRef.current) {
        window.clearTimeout(transitionTimerRef.current);
      }
    };
  }, [stage]);

  useEffect(() => {
    if (verifyMode || reducedMotion) {
      return;
    }

    const getPinnedState = () => {
      const track = trackRef.current;
      if (!track) {
        return false;
      }

      const rect = track.getBoundingClientRect();
      return rect.top <= 0 && rect.bottom > window.innerHeight;
    };

    const canAdvance = (now: number) => now - lastIntentAtRef.current > 420;

    const commitAdvance = (next: FooterRevealStage, now: number) => {
      lastIntentAtRef.current = now;
      setStage(next);
    };

    const onWheel = (event: WheelEvent) => {
      if (panelOpen || !getPinnedState()) {
        return;
      }

      const now = performance.now();

      if (stage !== "released") {
        event.preventDefault();
      }

      if (!canAdvance(now) || Math.abs(event.deltaY) < 10) {
        return;
      }

      if (event.deltaY > 0 && stage !== "released") {
        commitAdvance(nextStage(stage), now);
        return;
      }

      if (event.deltaY < 0 && stage !== "free") {
        commitAdvance(previousStage(stage), now);
      }
    };

    const onTouchStart = (event: TouchEvent) => {
      touchStartYRef.current = event.touches[0]?.clientY ?? null;
    };

    const onTouchMove = (event: TouchEvent) => {
      if (panelOpen || !getPinnedState()) {
        return;
      }

      const startY = touchStartYRef.current;
      const currentY = event.touches[0]?.clientY;
      if (startY == null || currentY == null) {
        return;
      }

      const delta = startY - currentY;
      const now = performance.now();

      if (stage !== "released") {
        event.preventDefault();
      }

      if (!canAdvance(now) || Math.abs(delta) < 22) {
        return;
      }

      touchStartYRef.current = currentY;

      if (delta > 0 && stage !== "released") {
        commitAdvance(nextStage(stage), now);
        return;
      }

      if (delta < 0 && stage !== "free") {
        commitAdvance(previousStage(stage), now);
      }
    };

    const onScroll = () => {
      const track = trackRef.current;
      if (!track) {
        return;
      }

      const rect = track.getBoundingClientRect();
      if (rect.top > 24 && stage !== "free") {
        setStage("free");
      }
    };

    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("scroll", onScroll);
    };
  }, [panelOpen, reducedMotion, stage, verifyMode]);

  const railLift =
    stage === "prompt-lock"
      ? variant.promptLift
      : stage === "footer-release" || stage === "released"
        ? variant.releaseLift
        : 0;

  const promptOpacity =
    stage === "prompt-lock"
      ? variant.promptOpacity
      : stage === "footer-release"
        ? 0.12
        : 0;

  const footerPreviewOpacity = stage === "footer-release" ? 1 : 0;
  const footerPreviewHeight = stage === "footer-release" ? 38 : 0;

  const previewStyle = {
    "--rail-lift": `${railLift}px`,
    "--prompt-opacity": `${clamp(promptOpacity, 0, 1)}`,
    "--prompt-shift": `${stage === "prompt-lock" ? 0 : 18}px`,
    "--footer-preview-opacity": `${footerPreviewOpacity}`,
    "--footer-preview-height": `${footerPreviewHeight}svh`,
  } as CSSProperties;

  return (
    <section className={styles.demoSection} id={variant.anchor}>
      <div className={styles.demoIntro}>
        <div className={styles.demoHeadingRow}>
          <div>
            <p className={`${styles.demoKicker} ${fragmentMono.className}`}>Variant {variant.key.toUpperCase()}</p>
            <h2 className={styles.demoTitle}>
              {variant.key.toUpperCase()}. {variant.name}
            </h2>
          </div>
          <div className={styles.demoBadges}>
            {variant.recommendation ? (
              <span className={`${styles.demoBadge} ${fragmentMono.className}`}>{variant.recommendation}</span>
            ) : null}
            {selected ? <span className={`${styles.demoBadge} ${fragmentMono.className}`}>Selected</span> : null}
          </div>
        </div>
        <p className={styles.demoNote}>{variant.note}</p>
      </div>

      <div className={styles.demoTrack} ref={trackRef}>
        <div className={styles.demoSticky}>
          <div className={styles.demoShell} data-stage={stage} data-variant={variant.id} style={previewStyle}>
            <div className={styles.demoCanvas}>
              <div className={styles.demoCanvasLine} />
              <div className={`${styles.demoCanvasLabel} ${fragmentMono.className}`}>Bottom Rail to Footer</div>
            </div>

            <div aria-hidden="true" className={styles.promptSlot}>
              <span className={`${styles.promptArrow} ${fragmentMono.className}`}>↓</span>
              <span className={`${styles.promptCopy} ${fragmentMono.className}`}>Scroll once more</span>
            </div>

            <div className={styles.railLayer}>
              <BottomRail
                activeId={activeSection}
                hoveredId={hoveredId}
                onHoverChange={setHoveredId}
                onSelect={onOpenPanel}
              />
            </div>

            <div aria-hidden="true" className={styles.footerPreviewShell}>
              <div className={styles.footerPreviewBackdrop} />
              <FooterReleasePreview blur={variant.footerPreviewBlur} depth={variant.footerPreviewDepth} />
            </div>
          </div>
        </div>
      </div>

      <div className={styles.demoFooterFlow}>
        <Footer />
      </div>

      <div className={styles.demoSelectRow}>
        <Link className={`${styles.selectButton} ${fragmentMono.className}`} href={buildCompareHref(variant.key, folderVariant, variant.anchor)}>
          [ SELECT {variant.key.toUpperCase()} ]
        </Link>
      </div>
    </section>
  );
}

export default function FooterRevealComparison({
  folderVariant = "open-bottom",
  initialPick = "a",
  verifyMode = false,
}: ComparisonProps) {
  const selectedVariant = variants.find((variant) => variant.key === initialPick) ?? variants[0];
  const [activePanel, setActivePanel] = useState<ActivePanel>(null);

  useEffect(() => {
    if (!activePanel) {
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
      return;
    }

    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";

    return () => {
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
    };
  }, [activePanel]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setActivePanel(null);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const activeVariantSection = activePanel?.sectionId ?? null;

  return (
    <div className={styles.page}>
      <header className={styles.hero}>
        <p className={`${styles.heroKicker} ${fragmentMono.className}`}>Local Preview</p>
        <h1 className={styles.heroTitle}>Footer Reveal Comparison</h1>
        <p className={styles.heroSummary}>
          같은 Bottom Rail과 같은 footer content를 유지한 채, rail/prompt/footer handoff choreography만 A/B/C로 비교합니다.
        </p>
      </header>

      <div className={styles.compareBar}>
        <div className={styles.compareBarInner}>
          <nav aria-label="Footer reveal variants" className={styles.compareNav}>
            {variants.map((variant) => (
              <Link
                className={`${styles.compareNavLink} ${fragmentMono.className}`}
                data-active={selectedVariant.key === variant.key ? "true" : undefined}
                href={buildCompareHref(variant.key, folderVariant, variant.anchor)}
                key={variant.key}
              >
                [{variant.key.toUpperCase()}]
              </Link>
            ))}
          </nav>
          <div className={styles.compareStatus}>
            <span className={`${styles.compareStatusLabel} ${fragmentMono.className}`}>Current pick</span>
            <strong>
              {selectedVariant.key.toUpperCase()}. {selectedVariant.name}
            </strong>
          </div>
        </div>
      </div>

      <div className={styles.variantStack}>
        {variants.map((variant) => (
          <FooterRevealDemo
            activeSection={activePanel?.variantKey === variant.key ? activeVariantSection : null}
            folderVariant={folderVariant}
            key={variant.key}
            onOpenPanel={(sectionId) => setActivePanel({ sectionId, variantKey: variant.key })}
            panelOpen={activePanel !== null}
            selected={selectedVariant.key === variant.key}
            variant={variant}
            verifyMode={verifyMode}
          />
        ))}
      </div>

      <FooterRevealPanel activeSection={activeVariantSection} onClose={() => setActivePanel(null)} />
    </div>
  );
}
