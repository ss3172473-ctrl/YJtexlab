"use client";

import { Fragment_Mono } from "next/font/google";
import Link from "next/link";
import {
  type CSSProperties,
  type ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";

import GlobalPresence from "@/components/home/GlobalPresence";
import Locations from "@/components/home/Locations";
import Partners from "@/components/home/Partners";
import styles from "./HomeFolderHub.module.css";

const fragmentMono = Fragment_Mono({
  subsets: ["latin"],
  weight: ["400"],
  display: "swap",
});

const MOBILE_VIEWPORT_MAX = 767;

export type FolderVariant = "open-bottom" | "open-center" | "inline";

type SectionId = "trusted" | "global" | "facilities";
type RailHoverId = SectionId | "products";
type FooterRevealStage = "free" | "rail-lock" | "prompt-lock" | "footer-release" | "released";

type HubItem = {
  id: SectionId;
  monoLabel: string;
  panel: (verifyMode: boolean) => ReactNode;
};

const hubItems: HubItem[] = [
  {
    id: "trusted",
    monoLabel: "TRUSTED",
    panel: () => <Partners variant="panel" />,
  },
  {
    id: "global",
    monoLabel: "GLOBAL",
    panel: (verifyMode) => <GlobalPresence variant="panel" verifyMode={verifyMode} />,
  },
  {
    id: "facilities",
    monoLabel: "FACILITIES",
    panel: (verifyMode) => <Locations variant="panel" verifyMode={verifyMode} />,
  },
];

const STAGES: FooterRevealStage[] = [
  "free",
  "rail-lock",
  "prompt-lock",
  "footer-release",
  "released",
];

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

function FooterReleasePreview() {
  return (
    <div className={styles.footerPreviewCard}>
      <div className={styles.footerPreviewBrand}>
        <span>YJ TEXLAB</span>
        <span>SINCE 1962</span>
      </div>
      <div className={styles.footerPreviewColumns}>
        <div>
          <span>Products</span>
          <span>Checks</span>
          <span>Stripes</span>
          <span>ETC</span>
        </div>
        <div>
          <span>Company</span>
          <span>About Us</span>
          <span>Contact</span>
          <span>The Milestones</span>
        </div>
        <div>
          <span>Follow Us</span>
          <span>Instagram</span>
          <span>LinkedIn</span>
        </div>
      </div>
    </div>
  );
}

export default function HomeFolderHub({
  verifyMode = false,
  folderVariant = "open-bottom",
}: {
  verifyMode?: boolean;
  folderVariant?: FolderVariant;
}) {
  const rootRef = useRef<HTMLElement | null>(null);
  const railDockRef = useRef<HTMLDivElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const frameRef = useRef<HTMLDivElement | null>(null);
  const touchStartYRef = useRef<number | null>(null);
  const transitionTimerRef = useRef<number | null>(null);
  const lastIntentAtRef = useRef(0);
  const reducedMotion = useReducedMotion(verifyMode);
  const [activeId, setActiveId] = useState<SectionId | null>(null);
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const [railVisible, setRailVisible] = useState(verifyMode);
  const [mobileRailOpen, setMobileRailOpen] = useState(false);
  const [mobileRailDismissed, setMobileRailDismissed] = useState(false);
  const [hoveredId, setHoveredId] = useState<RailHoverId | null>(null);
  const [footerStage, setFooterStage] = useState<FooterRevealStage>("free");

  const activeItem = useMemo(() => hubItems.find((item) => item.id === activeId) ?? null, [activeId]);

  useEffect(() => {
    const updateViewportMode = () => {
      const nextIsMobile = window.innerWidth <= MOBILE_VIEWPORT_MAX;
      setIsMobileViewport(nextIsMobile);

      if (!nextIsMobile) {
        setMobileRailOpen(false);
        setMobileRailDismissed(false);
      }
    };

    updateViewportMode();
    window.addEventListener("resize", updateViewportMode);
    return () => window.removeEventListener("resize", updateViewportMode);
  }, []);

  useEffect(() => {
    if (verifyMode || reducedMotion) {
      setFooterStage("free");
      setMobileRailOpen(true);
      return;
    }

    setFooterStage("free");
  }, [reducedMotion, verifyMode]);

  useEffect(() => {
    const railDock = railDockRef.current;
    if (!railDock) {
      return;
    }

    if (verifyMode) {
      setRailVisible(true);
      return;
    }

    const syncRailVisibility = () => {
      const revealLine = window.innerHeight - 24;
      const seamTop = rootRef.current?.getBoundingClientRect().top ?? Number.POSITIVE_INFINITY;
      const categoryTrack = document.querySelector<HTMLElement>('[data-lab-variant="true"]');
      const categoryTrackBottom = categoryTrack?.getBoundingClientRect().bottom ?? Number.POSITIVE_INFINITY;
      const variantProgress = Number.parseFloat(
        categoryTrack?.style.getPropertyValue("--variant-progress") || "0",
      );
      const isMobileViewport = window.innerWidth <= MOBILE_VIEWPORT_MAX;
      const categoryBottomReached = categoryTrackBottom <= window.innerHeight;
      const shouldShow = isMobileViewport
        ? categoryBottomReached || variantProgress >= 0.97
        : seamTop <= revealLine;
      setRailVisible(shouldShow);

      if (shouldShow && !reducedMotion && window.innerWidth > MOBILE_VIEWPORT_MAX) {
        railDock.removeAttribute("data-rail-flicker");
        void railDock.offsetWidth;
        railDock.setAttribute("data-rail-flicker", "true");
      } else {
        railDock.removeAttribute("data-rail-flicker");
      }
    };

    syncRailVisibility();
    window.addEventListener("scroll", syncRailVisibility, { passive: true });
    window.addEventListener("resize", syncRailVisibility);

    return () => {
      window.removeEventListener("scroll", syncRailVisibility);
      window.removeEventListener("resize", syncRailVisibility);
    };
  }, [reducedMotion, verifyMode]);

  useEffect(() => {
    if (!isMobileViewport || verifyMode || reducedMotion || activeItem) {
      return;
    }

    if (!railVisible) {
      setMobileRailOpen(false);
      setMobileRailDismissed(false);
      return;
    }

    if (!mobileRailDismissed) {
      setMobileRailOpen(true);
      setFooterStage("rail-lock");
    }
  }, [activeItem, isMobileViewport, mobileRailDismissed, railVisible, reducedMotion, verifyMode]);

  useEffect(() => {
    if (footerStage !== "footer-release") {
      return;
    }

    transitionTimerRef.current = window.setTimeout(() => {
      setFooterStage("released");
    }, 420);

    return () => {
      if (transitionTimerRef.current) {
        window.clearTimeout(transitionTimerRef.current);
      }
    };
  }, [footerStage]);

  useEffect(() => {
    if (!activeItem && !(isMobileViewport && mobileRailOpen)) {
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
  }, [activeItem, isMobileViewport, mobileRailOpen]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setActiveId(null);
        setMobileRailOpen(false);
        setMobileRailDismissed(true);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (verifyMode || reducedMotion || isMobileViewport) {
      return;
    }

    const getPinnedState = () => {
      const track = trackRef.current;
      const frame = frameRef.current;
      if (!track || !frame) {
        return false;
      }

      const trackRect = track.getBoundingClientRect();
      const stickyTop = Number.parseFloat(window.getComputedStyle(frame).top || "0");
      return trackRect.top <= stickyTop + 2 && trackRect.bottom - stickyTop > window.innerHeight;
    };

    const canAdvance = (now: number) => now - lastIntentAtRef.current > 560;

    const commitAdvance = (next: FooterRevealStage, now: number) => {
      lastIntentAtRef.current = now;
      setFooterStage(next);
    };

    const onWheel = (event: WheelEvent) => {
      if (activeItem || !getPinnedState()) {
        return;
      }

      const now = performance.now();
      const deltaY = event.deltaY;

      if (footerStage !== "released") {
        event.preventDefault();
      }

      if (!canAdvance(now) || Math.abs(deltaY) < 18) {
        return;
      }

      if (deltaY > 0 && footerStage !== "released") {
        commitAdvance(nextStage(footerStage), now);
        return;
      }

      if (deltaY < 0 && footerStage !== "free") {
        commitAdvance(previousStage(footerStage), now);
      }
    };

    const onTouchStart = (event: TouchEvent) => {
      touchStartYRef.current = event.touches[0]?.clientY ?? null;
    };

    const onTouchMove = (event: TouchEvent) => {
      if (activeItem || !getPinnedState()) {
        return;
      }

      const startY = touchStartYRef.current;
      const currentY = event.touches[0]?.clientY;
      if (startY == null || currentY == null) {
        return;
      }

      const delta = startY - currentY;
      const now = performance.now();

      if (footerStage !== "released") {
        event.preventDefault();
      }

      if (!canAdvance(now) || Math.abs(delta) < 26) {
        return;
      }

      touchStartYRef.current = currentY;

      if (delta > 0 && footerStage !== "released") {
        commitAdvance(nextStage(footerStage), now);
        return;
      }

      if (delta < 0 && footerStage !== "free") {
        commitAdvance(previousStage(footerStage), now);
      }
    };

    const onScroll = () => {
      const track = trackRef.current;
      const frame = frameRef.current;
      if (!track || !frame) {
        return;
      }

      const trackRect = track.getBoundingClientRect();
      const stickyTop = Number.parseFloat(window.getComputedStyle(frame).top || "0");
      if (trackRect.top > stickyTop + 24 && footerStage !== "free") {
        setFooterStage("free");
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
  }, [activeItem, footerStage, isMobileViewport, reducedMotion, verifyMode]);

  const railLift =
    footerStage === "prompt-lock"
      ? 86
      : footerStage === "footer-release" || footerStage === "released"
        ? 118
        : 0;

  const promptOpacity =
    footerStage === "prompt-lock"
      ? 0.98
      : footerStage === "footer-release"
        ? 0.16
        : 0;

  const previewStyle = {
    "--rail-lift": `${railLift}px`,
    "--prompt-opacity": `${promptOpacity}`,
    "--prompt-shift": `${footerStage === "prompt-lock" ? 0 : 18}px`,
    "--footer-preview-opacity": `${footerStage === "footer-release" ? 1 : 0}`,
    "--footer-preview-height": `${footerStage === "footer-release" ? 38 : 0}svh`,
  } as CSSProperties;

  const railNode = (
    <div className={styles.railLayer} style={previewStyle}>
      <div
        className={styles.bottomRail}
      >
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
                  onBlur={() => setHoveredId((current) => (current === item.id ? null : current))}
                  onClick={() => {
                    setActiveId(item.id);
                    setMobileRailOpen(false);
                    setMobileRailDismissed(true);
                  }}
                  onFocus={() => setHoveredId(item.id)}
                  onMouseDown={(event) => event.preventDefault()}
                  onMouseEnter={() => setHoveredId(item.id)}
                  onMouseLeave={() => setHoveredId((current) => (current === item.id ? null : current))}
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
              onClick={() => {
                setMobileRailOpen(false);
                setMobileRailDismissed(true);
              }}
              onBlur={() => setHoveredId((current) => (current === "products" ? null : current))}
              onFocus={() => setHoveredId("products")}
              onMouseEnter={() => setHoveredId("products")}
              onMouseLeave={() => setHoveredId((current) => (current === "products" ? null : current))}
            >
              <span className={styles.railText}>View more products</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <section
      ref={rootRef}
      className={styles.shell}
      data-home-section="folder-hub"
      data-home-folder-state={activeItem ? "panel-open" : "hub"}
      data-footer-stage={footerStage}
      data-home-folder-variant={folderVariant}
      data-mobile-overlay-open={mobileRailOpen ? "true" : undefined}
      data-panel-open={activeItem ? "true" : undefined}
      data-rail-visible={railVisible ? "true" : undefined}
      data-reduced-motion={reducedMotion ? "true" : undefined}
      data-verify-mode={verifyMode ? "true" : undefined}
    >
      <div className={styles.railDock} ref={railDockRef}>{railNode}</div>

      <div className={styles.track} ref={trackRef}>
        <div className={styles.frame} ref={frameRef}>
          <div
            className={styles.canvas}
            data-blurred={activeItem || (isMobileViewport && mobileRailOpen) ? "true" : undefined}
            data-overlay={isMobileViewport && mobileRailOpen ? "true" : undefined}
            style={previewStyle}
          >
            <div className={styles.canvasBlur} />

            <div aria-hidden="true" className={styles.promptSlot}>
              <span className={`${styles.promptArrow} ${fragmentMono.className}`}>↓</span>
              <span className={`${styles.promptCopy} ${fragmentMono.className}`}>Scroll once more</span>
            </div>

            <div aria-hidden="true" className={styles.footerPreviewShell}>
              <div className={styles.footerPreviewBackdrop} />
              <FooterReleasePreview />
            </div>
          </div>
        </div>
      </div>

      {activeItem || (isMobileViewport && mobileRailOpen) ? (
        <>
          <button
            aria-label={activeItem ? "Close panel" : "Close menu"}
            className={styles.overlayDismiss}
            onClick={() => {
              setActiveId(null);
              setMobileRailOpen(false);
              setMobileRailDismissed(true);
            }}
            type="button"
          />
        </>
      ) : null}

      {activeItem ? (
        <>
          <div
            aria-label={activeItem.monoLabel}
            aria-modal="true"
            className={`${styles.panel} ${styles.panelTop}`}
            role="dialog"
          >
            <div className={styles.panelHeader}>
              <span className={`${styles.panelLabel} ${fragmentMono.className}`}>{activeItem.monoLabel}</span>
              <button
                className={`${styles.closeButton} ${fragmentMono.className}`}
                onClick={() => {
                  setActiveId(null);
                  if (isMobileViewport) {
                    setMobileRailDismissed(false);
                    setMobileRailOpen(true);
                  }
                }}
                type="button"
              >
                [ CLOSE ]
              </button>
            </div>
            <div className={styles.panelBody}>
              <div className={styles.panelInner}>{activeItem.panel(verifyMode)}</div>
            </div>
          </div>
        </>
      ) : null}
    </section>
  );
}
