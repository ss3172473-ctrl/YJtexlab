"use client";

import { Fragment_Mono } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import { aboutPageContent, type LocalizedLines, type LocalizedText } from "@/content/about";

import styles from "./AboutPage.module.css";

type Language = "ko" | "en";
const LANGUAGE_STORAGE_KEY = "about-language";
const fragmentMono = Fragment_Mono({
  subsets: ["latin"],
  weight: ["400"],
  display: "swap",
});

function pick(text: LocalizedText, language: Language) {
  return text[language];
}

function pickLines(text: LocalizedLines, language: Language) {
  return text[language];
}

export default function AboutPage() {
  const [language, setLanguage] = useState<Language>("ko");
  const [isPreferenceResolved, setIsPreferenceResolved] = useState(false);
  const [showLanguageEntry, setShowLanguageEntry] = useState(false);
  const [canPersistPreference, setCanPersistPreference] = useState(true);

  useEffect(() => {
    let nextLanguage: Language = "ko";

    try {
      const storedLanguage = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
      if (storedLanguage === "ko" || storedLanguage === "en") {
        nextLanguage = storedLanguage;
      }
    } catch {
      setCanPersistPreference(false);
    }

    setLanguage(nextLanguage);
    setShowLanguageEntry(true);
    setIsPreferenceResolved(true);
  }, []);

  useEffect(() => {
    if (!showLanguageEntry) return;

    const root = document.documentElement;
    const body = document.body;
    const previousRootOverflow = root.style.overflow;
    const previousBodyOverflow = body.style.overflow;
    const previousOverscroll = body.style.overscrollBehavior;
    const previousTouchAction = body.style.touchAction;
    const previousScrollRestoration =
      "scrollRestoration" in window.history ? window.history.scrollRestoration : null;

    if (previousScrollRestoration !== null) {
      window.history.scrollRestoration = "manual";
    }

    window.scrollTo(0, 0);
    requestAnimationFrame(() => window.scrollTo(0, 0));

    root.style.overflow = "hidden";
    body.style.overflow = "hidden";
    body.style.overscrollBehavior = "none";
    body.style.touchAction = "none";

    return () => {
      root.style.overflow = previousRootOverflow;
      body.style.overflow = previousBodyOverflow;
      body.style.overscrollBehavior = previousOverscroll;
      body.style.touchAction = previousTouchAction;

      if (previousScrollRestoration !== null) {
        window.history.scrollRestoration = previousScrollRestoration;
      }
    };
  }, [showLanguageEntry]);

  function persistLanguage(nextLanguage: Language) {
    if (!canPersistPreference) return;

    try {
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, nextLanguage);
    } catch {
      setCanPersistPreference(false);
    }
  }

  function handleLanguageSelection(nextLanguage: Language) {
    setLanguage(nextLanguage);
    setShowLanguageEntry(false);
    persistLanguage(nextLanguage);
  }

  const isReadingReady = isPreferenceResolved && !showLanguageEntry;
  const currentLanguage = language;

  return (
    <main
      className={styles.pageShell}
      data-language={currentLanguage}
      data-language-ready={isReadingReady ? "true" : "false"}
    >
      <section className={styles.heroSection}>
        <Image
          src="/about/bg-ch4.png"
          alt="Engineering authority background"
          fill
          priority
          className={styles.heroImage}
          sizes="100vw"
        />
        <div className={styles.heroOverlay} />
        <div className={styles.heroContent}>
          {isReadingReady ? (
            <div className={[styles.languageToggle, fragmentMono.className].join(" ")} aria-label="Language switcher">
              <button
                type="button"
                className={[
                  styles.languageButton,
                  currentLanguage === "ko" ? styles.languageButtonActive : "",
                ].join(" ").trim()}
                onClick={() => handleLanguageSelection("ko")}
                aria-pressed={currentLanguage === "ko"}
              >
                KO
              </button>
              <button
                type="button"
                className={[
                  styles.languageButton,
                  currentLanguage === "en" ? styles.languageButtonActive : "",
                ].join(" ").trim()}
                onClick={() => handleLanguageSelection("en")}
                aria-pressed={currentLanguage === "en"}
              >
                EN
              </button>
            </div>
          ) : null}

          {isPreferenceResolved && showLanguageEntry ? (
            <div
              className={[styles.entryPanel, fragmentMono.className].join(" ")}
              role="dialog"
              aria-modal="false"
              aria-label="Choose language"
            >
              <p className={styles.entryTitle}>LANGUAGE</p>
              <div className={styles.entryActions}>
                <button
                  type="button"
                  className={styles.entryButton}
                  onClick={() => handleLanguageSelection("ko")}
                >
                  <span className={styles.entryButtonText}>Korean</span>
                </button>
                <button
                  type="button"
                  className={styles.entryButton}
                  onClick={() => handleLanguageSelection("en")}
                >
                  <span className={styles.entryButtonText}>English</span>
                </button>
              </div>
            </div>
          ) : null}

          <div className={[styles.heroCopy, !isReadingReady ? styles.heroCopyPending : ""].join(" ").trim()}>
            {isReadingReady ? (
              <h1 className={styles.title}>{pick(aboutPageContent.title, currentLanguage)}</h1>
            ) : null}
            {isReadingReady ? (
              <p className={styles.heroIntro}>
                {pickLines(aboutPageContent.heroIntroLines, currentLanguage).map((line) => (
                  <span key={line} className={styles.manualLine}>
                    {line}
                  </span>
                ))}
              </p>
            ) : null}
          </div>
        </div>
      </section>

      <div className={[styles.contentWrap, !isReadingReady ? styles.contentWrapPending : ""].join(" ").trim()}>
        <div className={styles.container}>
          {isReadingReady ? (
            <>
              <header className={styles.header}>
                <p className={styles.kicker}>YJ TexLab</p>
                <div className={styles.preface}>
                  {aboutPageContent.intro.slice(1).map((paragraph) => (
                    <p key={paragraph.en} className={styles.introParagraph}>
                      {pick(paragraph, currentLanguage)}
                    </p>
                  ))}
                </div>
              </header>

              <section className={styles.valuesSection}>
                {aboutPageContent.values.map((value) => (
                  <article key={value.id} className={styles.valueBlock}>
                    <h2 className={styles.valueTitle}>{pick(value.title, currentLanguage)}</h2>
                    <div className={styles.valueBody}>
                      {value.body.map((paragraph, index) => (
                        <p
                          key={`${value.id}-${paragraph.en}`}
                          className={[
                            styles.valueParagraph,
                            index === 0 ? styles.valueParagraphLead : "",
                          ].join(" ").trim()}
                        >
                          {index === 0 && value.leadLines
                            ? pickLines(value.leadLines, currentLanguage).map((line) => (
                                <span key={`${value.id}-${line}`} className={styles.manualLine}>
                                  {line}
                                </span>
                              ))
                            : pick(paragraph, currentLanguage)}
                        </p>
                      ))}
                    </div>
                  </article>
                ))}
              </section>

              <nav className={styles.linksSection} aria-label="About links">
                <Link href="/products" className={styles.linkLabel}>
                  Products
                </Link>
                <span className={styles.linkDivider} aria-hidden="true">
                  ㅣ
                </span>
                <Link href="/contact" className={styles.linkLabel}>
                  Contact
                </Link>
              </nav>
            </>
          ) : (
            <div className={styles.contentPlaceholder} aria-hidden="true" />
          )}
        </div>
      </div>
    </main>
  );
}
