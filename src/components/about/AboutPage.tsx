"use client";

import { Fragment_Mono } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import { aboutPageContent, type AboutLanguage, type LocalizedLines, type LocalizedText } from "@/content/about";

import styles from "./AboutPage.module.css";

const LANGUAGE_STORAGE_KEY = "about-language";
const languageOptions = [
  { id: "ko", label: "Korean", short: "KO" },
  { id: "en", label: "English", short: "EN" },
  { id: "zh-CN", label: "简体中文", short: "中文" },
] as const satisfies readonly { id: AboutLanguage; label: string; short: string }[];
const fragmentMono = Fragment_Mono({
  subsets: ["latin"],
  weight: ["400"],
  display: "swap",
});

function pick(text: LocalizedText, language: AboutLanguage) {
  return text[language];
}

function pickLines(text: LocalizedLines, language: AboutLanguage) {
  return text[language];
}

export default function AboutPage() {
  const [language, setLanguage] = useState<AboutLanguage>("ko");
  const [isPreferenceResolved, setIsPreferenceResolved] = useState(false);
  const [showLanguageEntry, setShowLanguageEntry] = useState(false);
  const [canPersistPreference, setCanPersistPreference] = useState(true);

  useEffect(() => {
    let nextLanguage: AboutLanguage = "ko";

    try {
      const storedLanguage = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
      nextLanguage = languageOptions.find(({ id }) => id === storedLanguage)?.id ?? "ko";
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

  function persistLanguage(nextLanguage: AboutLanguage) {
    if (!canPersistPreference) return;

    try {
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, nextLanguage);
    } catch {
      setCanPersistPreference(false);
    }
  }

  function handleLanguageSelection(nextLanguage: AboutLanguage) {
    setLanguage(nextLanguage);
    setShowLanguageEntry(false);
    persistLanguage(nextLanguage);
  }

  const isReadingReady = isPreferenceResolved && !showLanguageEntry;
  const currentLanguage = language;

  return (
    <main
      className={styles.pageShell}
      lang={currentLanguage}
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
            <div className={[styles.languageToggle, fragmentMono.className].join(" ")} aria-label={currentLanguage === "zh-CN" ? "切换语言" : "Language switcher"}>
              {languageOptions.map(({ id, label, short }) => (
                <button
                  key={id}
                  type="button"
                  aria-label={label}
                  lang={id === "ko" ? "en" : id}
                  className={currentLanguage === id
                    ? `${styles.languageButton} ${styles.languageButtonActive}`
                    : styles.languageButton}
                  onClick={() => handleLanguageSelection(id)}
                  aria-pressed={currentLanguage === id}
                >
                  {short}
                </button>
              ))}
            </div>
          ) : null}

          {isPreferenceResolved && showLanguageEntry ? (
            <div
              className={[styles.entryPanel, fragmentMono.className].join(" ")}
              role="dialog"
              aria-modal="false"
              aria-label="Choose language"
              lang="en"
            >
              <p className={styles.entryTitle}>LANGUAGE</p>
              <div className={styles.entryActions}>
                {languageOptions.map(({ id, label }) => (
                  <button
                    key={id}
                    type="button"
                    className={styles.entryButton}
                    lang={id === "ko" ? "en" : id}
                    onClick={() => handleLanguageSelection(id)}
                  >
                    <span className={styles.entryButtonText}>{label}</span>
                  </button>
                ))}
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

              <nav className={styles.linksSection} aria-label={currentLanguage === "zh-CN" ? "相关链接" : "About links"}>
                <Link href="/products" className={styles.linkLabel}>
                  {currentLanguage === "zh-CN" ? "面料系列" : "Products"}
                </Link>
                <span className={styles.linkDivider} aria-hidden="true">
                  ㅣ
                </span>
                <Link href="/contact" className={styles.linkLabel}>
                  {currentLanguage === "zh-CN" ? "联系我们" : "Contact"}
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
