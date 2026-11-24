"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { LockKeyhole, LockKeyholeOpen } from "lucide-react";
import { customerCodeMaxLength, customerCodePattern } from "./customer-code";
import { swatchesText, type Language } from "./language";
import styles from "./swatches.module.css";
import experience from "./experience.module.css";

export function AccessGate({
  language, languageToggle, code, onCode, pending, disabled, error,
}: {
  language: Language;
  languageToggle: ReactNode;
  code: string;
  onCode: (code: string) => void;
  pending: boolean;
  disabled: boolean;
  error: string;
}) {
  const t = swatchesText(language);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (pending || disabled) return;
    const field = input.current;
    if (!field) return;
    const restoreFocus = () => {
      if (!document.hidden && (!document.activeElement || document.activeElement === document.body)) {
        field.focus({ preventScroll: true });
      }
    };
    field.focus({ preventScroll: true });
    window.addEventListener("focus", restoreFocus);
    window.addEventListener("pageshow", restoreFocus);
    document.addEventListener("visibilitychange", restoreFocus);
    return () => {
      window.removeEventListener("focus", restoreFocus);
      window.removeEventListener("pageshow", restoreFocus);
      document.removeEventListener("visibilitychange", restoreFocus);
    };
  }, [disabled, pending, language]);

  useEffect(() => {
    if (pending || disabled) return;
    function handleDigit(event: KeyboardEvent) {
      if (!/^[0-9]$/.test(event.key) || event.defaultPrevented || event.repeat ||
          event.isComposing || event.ctrlKey || event.metaKey || event.altKey) return;
      const target = event.target;
      if (target instanceof HTMLElement && (target.isContentEditable || target.matches("input, textarea, select"))) return;
      const field = input.current;
      if (!field) return;
      event.preventDefault();
      field.focus({ preventScroll: true });
      onCode((code + event.key).slice(0, customerCodeMaxLength));
    }
    window.addEventListener("keydown", handleDigit, true);
    return () => window.removeEventListener("keydown", handleDigit, true);
  }, [code, disabled, onCode, pending]);

  return <main className={`${styles.shell} ${experience.gate}`} lang={language}>
    <div className={experience.gateLanguages}>{languageToggle}</div>
    <div className={experience.lockPanel} aria-busy={pending}>
      <div className={experience.lockIcon} aria-hidden="true"><LockKeyhole size={26} strokeWidth={1.35} /></div>
      <label htmlFor="customer-code">{t("code")}</label>
      <p id="code-instruction">{t("codeHint")}</p>
      <div className={experience.digits}>
        <input ref={input} id="customer-code" type="password" value={code}
          onChange={(event) => onCode(event.target.value.replace(/[^0-9]/g, "").slice(0, customerCodeMaxLength))}
          aria-describedby={error ? "code-instruction code-error" : "code-instruction"}
          aria-invalid={Boolean(error)} autoComplete="off" inputMode="numeric" pattern={customerCodePattern}
          maxLength={customerCodeMaxLength} readOnly={pending || disabled} />
        {Array.from({ length: customerCodeMaxLength }, (_, index) => <span
          key={index} aria-hidden="true" data-filled={index < code.length} data-active={index === code.length}
        ><i /></span>)}
      </div>
      <p className={experience.codeFeedback} aria-live="polite">
        {pending && t("checking")}
      </p>
      {error && <p id="code-error" className={styles.error} role="alert">{error}</p>}
    </div>
  </main>;
}

export function Welcome({ name, language, onDone, firstCoverReady }: {
  name: string; language: Language; onDone: () => void; firstCoverReady: boolean;
}) {
  const t = swatchesText(language);
  const startedAt = useRef<number>();
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    startedAt.current ??= performance.now();
    // Finish as soon as the first approved cover is ready after the animation,
    // with a short cap even when catalog/photo loading is slower or unavailable.
    const duration = reduced ? (firstCoverReady ? 100 : 300) : (firstCoverReady ? 440 : 700);
    const timer = window.setTimeout(onDone, Math.max(0, duration - (performance.now() - startedAt.current)));
    return () => window.clearTimeout(timer);
  }, [onDone, firstCoverReady]);
  return <main className={`${styles.shell} ${experience.welcome}`} lang={language}>
    <div role="status">
      <div className={experience.unlockIcon} aria-hidden="true">
        <LockKeyhole size={31} strokeWidth={1.3} className={experience.lockBefore} />
        <LockKeyholeOpen size={33} strokeWidth={1.3} className={experience.lockAfter} />
      </div>
      <p>{t("welcome")}</p>
      {name && <h1>{name}</h1>}
    </div>
  </main>;
}
