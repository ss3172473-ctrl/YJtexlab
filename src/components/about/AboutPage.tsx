"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { aboutPanels } from "@/content/about";

import styles from "./AboutPage.module.css";

export default function AboutPage() {
  const rootRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const panelRefs = useRef<Array<HTMLElement | null>>([]);
  const [activePanel, setActivePanel] = useState(0);
  const [language, setLanguage] = useState<"ko" | "en">("ko");
  const [reducedMotion, setReducedMotion] = useState(false);

  const maxIndex = aboutPanels.length - 1;
  const progress = useMemo(() => {
    if (maxIndex <= 0) {
      return 0;
    }

    return activePanel / maxIndex;
  }, [activePanel, maxIndex]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReducedMotion(mediaQuery.matches);

    sync();

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", sync);
      return () => mediaQuery.removeEventListener("change", sync);
    }

    mediaQuery.addListener(sync);
    return () => mediaQuery.removeListener(sync);
  }, []);

  useEffect(() => {
    const viewport = viewportRef.current;
    const panels = panelRefs.current.filter(Boolean) as HTMLElement[];

    if (!viewport || panels.length === 0) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (!visible) {
          return;
        }

        const nextIndex = Number(visible.target.getAttribute("data-panel-index"));

        if (!Number.isNaN(nextIndex)) {
          setActivePanel((current) => (current === nextIndex ? current : nextIndex));
        }
      },
      {
        root: viewport,
        threshold: [0.5, 0.66, 0.82],
      },
    );

    panels.forEach((panel) => observer.observe(panel));

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    rootRef.current?.style.setProperty("--about-progress", progress.toFixed(4));
  }, [progress]);

  const jumpToPanel = (index: number) => {
    const nextPanel = panelRefs.current[index];

    if (!nextPanel) {
      return;
    }

    nextPanel.scrollIntoView({
      behavior: reducedMotion ? "auto" : "smooth",
      block: "start",
    });
  };

  return (
    <div
      ref={rootRef}
      className={[styles.pageShell, reducedMotion ? styles.pageShellReduced : ""].join(" ").trim()}
    >
      <section className={styles.stageShell}>
        <h1 className={styles.srOnly}>About Us</h1>
        <div className={styles.noiseLayer} aria-hidden="true" />
        <div className={styles.gridLayer} aria-hidden="true" />
        <div className={styles.motionLayer} aria-hidden="true">
          <span className={styles.ringA} />
          <span className={styles.ringB} />
          <span className={styles.ringC} />
          <span className={styles.verticalBeam} />
          <span className={styles.horizontalBeam} />
          <span className={styles.scanline} />
        </div>

        <header className={styles.stageHeader}>
          <div className={styles.stageIntro}>
            <p className={styles.eyebrow}>YJ TEXLAB / ABOUT US</p>
            <p className={styles.stageTitle}>A four-slide history of fabric conviction.</p>
          </div>

          <div className={styles.stageHeaderRight}>
            <div className={styles.languageToggle}>
              <button
                type="button"
                className={[
                  styles.languageButton,
                  language === "ko" ? styles.languageButtonActive : "",
                ].join(" ").trim()}
                onClick={() => setLanguage("ko")}
                aria-pressed={language === "ko"}
              >
                KO
              </button>
              <button
                type="button"
                className={[
                  styles.languageButton,
                  language === "en" ? styles.languageButtonActive : "",
                ].join(" ").trim()}
                onClick={() => setLanguage("en")}
                aria-pressed={language === "en"}
              >
                EN
              </button>
            </div>

            <div className={styles.stageStatus}>
              <span>{aboutPanels[activePanel]?.code}</span>
              <span className={styles.stageStatusLabel}>{aboutPanels[activePanel]?.label}</span>
            </div>
          </div>
        </header>

        <div className={styles.stageBody}>
          <aside className={styles.slideRail} aria-label="About slide navigation">
            <div className={styles.progressRail} aria-hidden="true">
              <span className={styles.progressTrack} />
              <span className={styles.progressFill} />
            </div>

            <div className={styles.slideDots}>
              {aboutPanels.map((panel, index) => (
                <button
                  key={panel.id}
                  type="button"
                  className={[
                    styles.slideDot,
                    index === activePanel ? styles.slideDotActive : "",
                  ].join(" ").trim()}
                  onClick={() => jumpToPanel(index)}
                  aria-label={`Go to slide ${panel.code} ${panel.label}`}
                  aria-current={index === activePanel ? "true" : undefined}
                >
                  <span className={styles.slideDotIndex}>{panel.code}</span>
                  <span className={styles.slideDotLabel}>{panel.label}</span>
                </button>
              ))}
            </div>
          </aside>

          <div
            ref={viewportRef}
            className={[styles.stageViewport, reducedMotion ? styles.stageViewportReduced : ""].join(" ").trim()}
          >
            {aboutPanels.map((panel, index) => {
              const headingTag = index === 0 ? "h2" : "h3";
              const Heading = headingTag;

              return (
                <article
                  key={panel.id}
                  ref={(node) => {
                    panelRefs.current[index] = node;
                  }}
                  data-panel-index={index}
                  className={[
                    styles.panelSlide,
                    index === activePanel ? styles.panelSlideActive : "",
                  ].join(" ").trim()}
                >
                  <div className={styles.panelFrame}>
                    <div className={styles.panelMeta}>
                      <span className={styles.panelCode}>{panel.code}</span>
                      <span className={styles.panelLabel}>{panel.label}</span>
                    </div>

                    <div className={styles.panelMain}>
                      <Heading className={styles.panelDisplay}>{panel.label}</Heading>
                      <div className={styles.panelBlocks}>
                        {panel.blocks.map((block) => (
                          <p key={block.ko} className={styles.panelCopy}>
                            {block[language]}
                          </p>
                        ))}
                      </div>
                    </div>

                    <div className={styles.panelFooter}>
                      <span className={styles.panelFooterText}>
                        {index === maxIndex ? "Archive complete" : "Scroll for next slide"}
                      </span>
                      {index < maxIndex ? (
                        <button
                          type="button"
                          className={styles.panelAdvance}
                          onClick={() => jumpToPanel(index + 1)}
                        >
                          Next
                        </button>
                      ) : null}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
