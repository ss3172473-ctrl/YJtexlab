"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import { aboutPanels } from "@/content/about";

import styles from "./AboutPage.module.css";

gsap.registerPlugin(ScrollTrigger);

export default function AboutPage() {
  const rootRef = useRef<HTMLDivElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const panelRefs = useRef<Array<HTMLElement | null>>([]);
  const [activePanel, setActivePanel] = useState(0);
  const [language, setLanguage] = useState<"ko" | "en">("ko");
  const [reducedMotion, setReducedMotion] = useState(false);

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

  useLayoutEffect(() => {
    if (!rootRef.current) {
      return;
    }

    const ctx = gsap.context(() => {
      const reveals = gsap.utils.toArray<HTMLElement>("[data-about-reveal]");
      const panels = panelRefs.current.filter(Boolean) as HTMLElement[];
      const maxIndex = Math.max(0, panels.length - 1);

      const syncProgress = (value: number) => {
        rootRef.current?.style.setProperty("--about-progress", value.toFixed(4));
      };

      syncProgress(0);

      gsap.fromTo(
        reveals,
        { autoAlpha: 0, y: 22 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.9,
          stagger: 0.06,
          ease: "power3.out",
          clearProps: "opacity,visibility,transform",
        },
      );

      const mm = gsap.matchMedia();

      mm.add("(min-width: 961px)", () => {
        if (reducedMotion || !stickyRef.current || panels.length === 0) {
          return undefined;
        }

        gsap.set(panels, {
          autoAlpha: (index) => (index === 0 ? 1 : 0),
          yPercent: (index) => (index === 0 ? 0 : 10),
          scale: (index) => (index === 0 ? 1 : 0.985),
          xPercent: 0,
        });

        const trigger = ScrollTrigger.create({
          trigger: stickyRef.current,
          start: "top top+=72",
          end: () => `+=${window.innerHeight * (panels.length - 1)}`,
          pin: stickyRef.current,
          scrub: 0.9,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            const rawIndex = gsap.utils.clamp(0, maxIndex, self.progress * maxIndex);
            const nextActive = Math.round(rawIndex);

            syncProgress(self.progress);
            setActivePanel((current) => (current === nextActive ? current : nextActive));

            panels.forEach((panel, index) => {
              const distance = Math.abs(rawIndex - index);
              const direction = index < rawIndex ? -1 : 1;
              const opacity = gsap.utils.clamp(0, 1, 1 - distance * 1.35);
              const yPercent = (index - rawIndex) * 6;
              const xPercent = distance < 0.16 ? 0 : direction * 3.5;
              const scale = gsap.utils.clamp(0.97, 1, 1 - distance * 0.02);
              const filter = `blur(${Math.min(distance * 8, 10)}px)`;

              gsap.to(panel, {
                autoAlpha: opacity,
                yPercent,
                xPercent,
                scale,
                filter,
                duration: 0.22,
                ease: "power3.out",
                overwrite: "auto",
              });
            });
          },
        });

        return () => {
          trigger.kill();
          gsap.set(panels, { clearProps: "all" });
        };
      });

      mm.add("(max-width: 960px)", () => {
        if (panels.length === 0) {
          return undefined;
        }

        gsap.set(panels, { clearProps: "all" });

        const triggers = panels.map((panel, index) =>
          ScrollTrigger.create({
            trigger: panel,
            start: "top 65%",
            end: "bottom 35%",
            onEnter: () => {
              setActivePanel(index);
              syncProgress(index / Math.max(1, maxIndex));
            },
            onEnterBack: () => {
              setActivePanel(index);
              syncProgress(index / Math.max(1, maxIndex));
            },
          }),
        );

        return () => {
          triggers.forEach((trigger) => trigger.kill());
        };
      });

      return () => {
        mm.revert();
      };
    }, rootRef);

    return () => {
      ctx.revert();
    };
  }, [reducedMotion]);

  return (
    <div
      ref={rootRef}
      className={[styles.pageShell, reducedMotion ? styles.pageShellReduced : ""].join(" ").trim()}
    >
      <section className={styles.stageShell}>
        <div
          ref={stickyRef}
          className={[styles.stageViewport, reducedMotion ? styles.stageViewportReduced : ""].join(" ").trim()}
        >
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
              <p className={styles.eyebrow} data-about-reveal>
                YJ TEXLAB / ABOUT US
              </p>
              <p className={styles.stageNote} data-about-reveal>
                TEXT CHAMBER
              </p>
            </div>

            <div className={styles.stageHeaderRight}>
              <div className={styles.languageToggle} data-about-reveal>
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

              <div className={styles.stageStatus} data-about-reveal>
                <span>{aboutPanels[activePanel]?.code}</span>
                <span className={styles.stageStatusLabel}>{aboutPanels[activePanel]?.label}</span>
              </div>
            </div>
          </header>

          <div className={styles.progressRail} aria-hidden="true">
            <span className={styles.progressTrack} />
            <span className={styles.progressFill} />
          </div>

          <div className={styles.panelDeck}>
            {aboutPanels.map((panel, index) => {
              const headingTag = index === 0 ? "h2" : "h3";
              const Heading = headingTag;

              return (
                <article
                  key={panel.id}
                  ref={(node) => {
                    panelRefs.current[index] = node;
                  }}
                  className={[
                    styles.panelCard,
                    index === activePanel ? styles.panelCardActive : "",
                  ].join(" ").trim()}
                >
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
                </article>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
