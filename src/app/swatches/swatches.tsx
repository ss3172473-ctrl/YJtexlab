"use client";

import { prepareCovers, resetPreparedCovers } from "./prepared-cover";
import dynamic from "next/dynamic";
import { motion, useReducedMotion, useSpring, type MotionStyle } from "motion/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Plus, ShoppingBag, X } from "lucide-react";
import { businessContact } from "@/lib/business-contact";
import { campaignParams, track } from "./analytics";
import { lineTotal, money, selectRolls, yardage, type CartLine, type Catalog, type Pattern, type Variant } from "./catalog";
import { AccessGate, Welcome } from "./entry";
import { customerCode } from "./customer-code";
import { colorName, countLabel, fabricName, languages, swatchesText, type Language } from "./language";
import styles from "./swatches.module.css";
import { localizedFabricSpecs } from "./specifications";

const SpecimenGrid = dynamic(() => import("./specimen-grid"));
const FabricFilm = dynamic(() => import("./fabric-film"));
const ColorGallery = dynamic(() => import("./color-gallery"));
const api = "/api/swatches";
const email = businessContact.email;
const languagePreference = "swatches-language";
type TextKey = Parameters<ReturnType<typeof swatchesText>>[0];

function LanguageToggle({ active, onSelect }: { active: Language; onSelect: (language: Language) => void }) {
  return <div className={styles.languageToggle} role="group" aria-label="Language">
    {languages.map(({ id, name, short }) => <button key={id} type="button" lang={id}
      aria-label={name} aria-pressed={active === id} onClick={() => onSelect(id)}>{short}</button>)}
  </div>;
}

function item(pattern: string, variant: Variant) {
  return {
    item_id: variant.sku,
    item_name: pattern,
    item_variant: variant.color,
    item_category: "Fabric",
    ...(variant.price === null ? {} : { price: variant.price }),
  };
}

type CartEntry = CartLine & { available: boolean };
type Receipt = "sent" | "saved" | "uncertain";

export default function Swatches() {
  const [language, setLanguage] = useState<Language | null>(null);
  const [languageReady, setLanguageReady] = useState(false);
  const currentLanguage = language ?? "ko";
  const t = swatchesText(currentLanguage);
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [status, setStatus] = useState<"initial" | "locked" | "ready">("initial");
  const [code, setCode] = useState("");
  const [welcomeName, setWelcomeName] = useState<string | null>(null);
  const [firstCoverReady, setFirstCoverReady] = useState(false);
  const markFirstCoverReady = useCallback(() => setFirstCoverReady(true), []);
  const finishWelcome = useCallback(() => setWelcomeName(null), []);
  const welcomePreparing = welcomeName !== null;
  const collectionElement = useCallback((node: HTMLElement | null) => {
    if (node) node.inert = welcomePreparing;
  }, [welcomePreparing]);
  const [accessError, setAccessError] = useState<TextKey | "">("");
  const [accessPending, setAccessPending] = useState(false);
  const verifyingCode = useRef(false);
  const [stockError, setStockError] = useState<TextKey | "">("");
  const [patternName, setPatternName] = useState("");
  const reduceLayoutMotion = useReducedMotion();
  const filmProgress = useSpring(0, { stiffness: 245, damping: 35, mass: 0.85 });
  const updateFilmLayout = useCallback((expanded: boolean) => {
    if (reduceLayoutMotion) filmProgress.jump(expanded ? 1 : 0);
    else filmProgress.set(expanded ? 1 : 0);
  }, [filmProgress, reduceLayoutMotion]);
  const [sku, setSku] = useState("");
  const [query, setQuery] = useState("");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const cartDialog = useRef<HTMLDialogElement>(null);
  const [inquiryError, setInquiryError] = useState<TextKey | "">("");
  const [sending, setSending] = useState(false);
  const submitting = useRef(false);
  const loadingStock = useRef(false);
  const listTracked = useRef(false);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(languagePreference);
      const preference = languages.find(({ id }) => id === saved);
      if (preference) setLanguage(preference.id);
    } catch {
      // The selected language remains available for this visit.
    }
    setLanguageReady(true);
  }, []);

  function pickLanguage(value: Language) {
    setLanguage(value);
    try { window.localStorage.setItem(languagePreference, value); } catch {}
  }

  useEffect(() => () => resetPreparedCovers(), []);

  const loadCatalog = useCallback(async () => {
    if (loadingStock.current) return;
    loadingStock.current = true;
    prepareCovers();
    try {
      const response = await fetch(`${api}/catalog`, { cache: "no-store" });
      if (response.status === 401) {
        resetPreparedCovers();
        setStatus("locked");
        setWelcomeName(null);
        setCatalog(null);
        setCart([]);
        cartDialog.current?.close();
        return;
      }
      if (!response.ok) throw new Error("Catalog source unavailable");
      const live: Catalog = await response.json();
      setCatalog((previous) => previous && previous.updatedAt > live.updatedAt ? previous : live);
      setStatus("ready");
      setStockError("");
      setAccessError("");
      if (!listTracked.current) {
        track("view_item_list", { item_list_id: "swatches", items: live.patterns.slice(0, 40).map((group) => item(group.name, group.variants[0])) });
        listTracked.current = true;
      }
    } catch {
      setStockError("stockUnavailable");
      setStatus((previous) => previous === "initial" ? "locked" : previous);
    } finally {
      loadingStock.current = false;
    }
  }, []);

  const hasLanguage = language !== null;
  useEffect(() => {
    if (hasLanguage) void loadCatalog();
  }, [hasLanguage, loadCatalog]);

  useEffect(() => {
    if (status !== "ready") return;
    const refresh = () => { if (document.visibilityState === "visible") void loadCatalog(); };
    const timer = window.setInterval(refresh, 30_000);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [loadCatalog, status]);

  async function enter(value: string) {
    const validated = customerCode(value);
    if (!validated || verifyingCode.current || status === "initial") return;
    verifyingCode.current = true;
    setAccessPending(true);
    setAccessError("");
    setReceipt(null);
    try {
      const response = await fetch(`${api}/access`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: validated, campaign: campaignParams().campaign_name }),
      });
      if (!response.ok) {
        setAccessError(response.status === 429 ? "codeSlow" : response.status === 401 ? "codeInvalid" : "codeUnavailable");
        return;
      }
      const result = await response.json();
      void import("./specimen-grid").catch(() => {});
      setFirstCoverReady(false);
      setWelcomeName(typeof result.welcomeName === "string" ? result.welcomeName : "");
      setCode("");
      setStatus("ready");
      track("swatches_access_granted", campaignParams());
      await loadCatalog();
    } catch {
      setAccessError("codeUnavailable");
    } finally {
      verifyingCode.current = false;
      setCode("");
      setAccessPending(false);
    }
  }

  const patterns = catalog?.patterns;
  const pattern = patterns?.find((group) => group.name === patternName);
  const active = pattern ? Math.max(0, pattern.variants.findIndex((variant) => variant.sku === sku)) : 0;
  const variant = pattern?.variants[active];
  const specs = variant ? localizedFabricSpecs(variant.composition, variant.width, currentLanguage) : null;
  const visiblePatterns = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return (patterns ?? []).filter((group) => group.name.toLowerCase().includes(normalized) ||
      group.variants.some((entry) => [entry.sku, entry.color, entry.productName, fabricName(entry.productName, currentLanguage), colorName(entry.color, currentLanguage)]
        .some((value) => value.toLowerCase().includes(normalized))));
  }, [patterns, query, currentLanguage]);
  const available = useMemo(() => selectRolls(patterns ?? []), [patterns]);
  const cartEntries: CartEntry[] = cart.map((line) => {
    const live = available.get(line.id);
    return live ? { ...live, available: true } : { ...line, available: false };
  });
  const total = cartEntries.reduce((sum, line) => line.available ? sum + lineTotal(line.yards, line.price) : sum, 0);

  const openPattern = useCallback((group: Pattern, selectedVariant?: Variant) => {
    const initial = selectedVariant ?? group.variants.find((entry) => entry.rolls.length > 0) ?? group.variants[0];
    setPatternName(group.name);
    setSku(initial.sku);
    const selected = item(group.name, initial);
    track("select_item", { item_list_id: "swatches", items: [selected] });
    track("view_item", { currency: "KRW", items: [selected] });
    window.scrollTo({ top: 0 });
    void loadCatalog();
  }, [loadCatalog]);

  function selectColor(index: number) {
    if (!pattern || index === active) return;
    const selected = pattern.variants[index];
    setSku(selected.sku);
    track("swatches_select_color", { items: [item(pattern.name, selected)] });
    track("view_item", { currency: "KRW", items: [item(pattern.name, selected)] });
    void loadCatalog();
  }

  function add(id: string) {
    const line = available.get(id);
    if (!line || cart.some((entry) => entry.id === id)) return;
    if (cart.length >= 100) return;
    setCart((entries) => entries.some((entry) => entry.id === id) ? entries : [...entries, line]);
    if (receipt !== "uncertain") setReceipt(null);
    setInquiryError("");
    track("add_to_cart", {
      currency: "KRW", value: lineTotal(line.yards, line.price),
      items: [{ item_id: line.sku, item_name: line.pattern, item_variant: line.color, roll_yards: line.yards, price: lineTotal(line.yards, line.price), quantity: 1 }],
    });
  }

  function showCart() {
    cartDialog.current?.showModal();
    track("view_cart", {
      currency: "KRW", value: total,
      items: cartEntries.filter((entry) => entry.available).map((line) => ({
        item_id: line.sku, item_name: line.pattern, item_variant: line.color,
        price: lineTotal(line.yards, line.price), roll_yards: line.yards, quantity: 1,
      })),
    });
    void loadCatalog();
  }

  async function submit() {
    if (submitting.current || !cartEntries.length || cartEntries.some((entry) => !entry.available)) return;
    submitting.current = true;
    setSending(true);
    setInquiryError("");
    try {
      const response = await fetch(`${api}/inquiry`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: cartEntries.map(({ id, price }) => ({ id, price })) }),
      });
      const result = await response.json();
      if (response.status === 401) {
        cartDialog.current?.close();
        setCatalog(null);
        setCart([]);
        resetPreparedCovers();
        setStatus("locked");
        setAccessError("codeExpired");
        return;
      }
      if (response.status === 409 && result.catalog) {
        const live: Catalog = result.catalog;
        setCatalog((previous) => previous && previous.updatedAt > live.updatedAt ? previous : live);
      }
      if (result.uncertain) {
        setReceipt("uncertain");
        return;
      }
      if (!response.ok) {
        setInquiryError(response.status === 409 ? "stockChanged" : result.preview ? "previewMail" : "inquiryUnavailable");
        return;
      }
      setReceipt(result.sent ? "sent" : "saved");
      track("generate_lead", { currency: "KRW", value: total, roll_count: cartEntries.length,
        items: cartEntries.map((line) => ({ item_id: line.sku, item_name: line.pattern, item_variant: line.color, roll_yards: line.yards, quantity: 1 })),
      });
      setCart([]);
    } catch {
      setReceipt("uncertain");
    } finally {
      submitting.current = false;
      setSending(false);
    }
  }

  if (!language) {
    return <main className={`${styles.shell} ${styles.languageEntry}`}>
      {languageReady && <section role="dialog" aria-labelledby="swatches-language-title">
        <h1 id="swatches-language-title">Language</h1>
        <div className={styles.entryActions}>
          {languages.map(({ id, name }) => <button key={id} type="button" lang={id} onClick={() => pickLanguage(id)}>{name}</button>)}
        </div>
      </section>}
    </main>;
  }

  if (status !== "ready") {
    const gateError = accessError || stockError;
    return <AccessGate language={language} code={code} onCode={(value) => {
      setCode(value);
      if (accessError) setAccessError("");
      void enter(value);
    }}
      pending={accessPending} disabled={status === "initial"} error={gateError ? t(gateError) : ""}
      languageToggle={<LanguageToggle active={language} onSelect={pickLanguage} />} />;
  }

  return <>
    {welcomePreparing && <Welcome name={welcomeName} language={language} onDone={finishWelcome}
      firstCoverReady={firstCoverReady} />}
    <main className={styles.shell} lang={language} ref={collectionElement}
      data-welcome-preparing={welcomePreparing || undefined} aria-hidden={welcomePreparing || undefined}>
    <div className={styles.collectionBar}>
      {pattern ? <button type="button" className={styles.textButton} onClick={() => {
        setPatternName("");
        window.scrollTo({ top: 0 });
      }}><ArrowLeft size={17} /> {t("all")}</button> : <span />}
      <div className={styles.collectionTools}>
        <LanguageToggle active={language} onSelect={pickLanguage} />
        <button type="button" className={styles.textButton} onClick={showCart}><ShoppingBag size={17} /> {t("cart")} <strong>{cart.length}</strong></button>
      </div>
    </div>
    {!pattern && <p className={styles.rollStockNote}>{t("rollStockNote")}</p>}
    {stockError && <p className={styles.error} role="status">{t(stockError)} <button type="button" onClick={() => void loadCatalog()}>{t("retry")}</button></p>}
    {!catalog && !stockError && <p role="status">{t("stockLoading")}</p>}

    {pattern && variant ? <motion.article className={styles.detail} data-original-film={variant.video ? "" : undefined} style={{ "--film-progress": filmProgress } as MotionStyle}>
      <div className={styles.detailMedia} data-with-film={variant.video ? "" : undefined}>
        <ColorGallery key={pattern.name} variants={pattern.variants} active={active} onSelect={selectColor} language={language} sampleImages={catalog?.sampleImages} />
        {variant.video && <FabricFilm key={variant.sku} variant={variant} language={language} onExpanded={updateFilmLayout} />}
      </div>
      <section className={styles.info} aria-label={t("details")}>
        <header>
          <div className={styles.mono}>{pattern.name}</div>
          <h1>{variant.sku}</h1>
          <div className={styles.productSubtitle}>
            {variant.productName && <span>{fabricName(variant.productName, language)}</span>}
            <span>{colorName(variant.color, language)}</span>
          </div>
        </header>
        <dl className={styles.specs}>
          {specs?.composition && <div><dt>{t("composition")}</dt><dd>{specs.composition}</dd></div>}
          {specs?.finishing && <div><dt>{t("finishing")}</dt><dd>{specs.finishing}</dd></div>}
          {specs?.width && <div><dt>{t("width")}</dt><dd>{specs.width}</dd></div>}
          <div><dt>{t("unitPrice")}</dt><dd>{variant.price === null ? t("pricePending") : money(variant.price)}</dd></div>
        </dl>
        {variant.rolls.length ? <>
          <div className={styles.stockTitle}>
            <h2>{t("rolls")}</h2>
            <span>{countLabel(variant.rolls.length, "roll", language)}</span>
          </div>
          <ul className={styles.rolls}>
          {variant.rolls.map((roll) => {
            const added = cart.some((entry) => entry.id === roll.id);
            return <li key={roll.id}>
              <button type="button" disabled={added || variant.price === null || cart.length >= 100}
                aria-label={`${yardage(roll.yards)} · ${added ? t("added") : t("add")}`}
                onClick={() => add(roll.id)}>
                <span className={styles.rollIcon} aria-hidden="true" />
                <span className={styles.rollYards}>{yardage(roll.yards)}</span>
                <span className={styles.rollAction}>{added ? <><Check size={15} /> {t("added")}</> : <><Plus size={15} /> {t("add")}</>}</span>
              </button>
            </li>;
          })}
        </ul>
          <p className={styles.note}>{t("fullRoll")}</p>
        </> : <div className={styles.soldOut} role="status">{t("soldOutLabel")}</div>}
      </section>
    </motion.article> : catalog && <SpecimenGrid patterns={visiblePatterns} language={language}
      query={query} onQuery={setQuery} onOpen={openPattern} layout={catalog.layout}
      warmBehindWelcome={welcomePreparing}
      onFirstCoverReady={welcomePreparing ? markFirstCoverReady : undefined} />}

    <dialog className={styles.cart} ref={cartDialog} aria-labelledby="cart-title">
      <div className={styles.cartBody}>
        <header>
          <h2 id="cart-title">{t("cart")}</h2>
          <button type="button" className={styles.iconButton} aria-label={t("closeCart")} disabled={sending}
            onClick={() => cartDialog.current?.close()}><X size={21} /></button>
        </header>
        {receipt ? <div className={styles.receipt} role="status">
          <strong>{receipt === "uncertain" ? t("receiptUncertain") : t("receiptReceived")}</strong>
          {receipt === "sent" ? <p>{t("receiptReply")}</p>
            : <p>{receipt === "saved" ? t("receiptSaved") : t("receiptCheck")} <a href={`mailto:${email}`}>{email}</a></p>}
        </div> : !cartEntries.length ? <p className={styles.empty}>{t("emptyCart")}</p> : <>
          <ul className={styles.cartItems}>
            {cartEntries.map((line) => <li key={line.id}>
              <div><strong>{line.pattern} · {colorName(line.color, language)}</strong><span>{line.sku} · {yardage(line.yards)}</span></div>
              <div><span>{line.available ? money(lineTotal(line.yards, line.price)) : t("soldOut")}</span>
                <button type="button" className={styles.iconButton} aria-label={`${t("remove")} · ${line.sku} ${yardage(line.yards)}`} disabled={sending}
                  onClick={() => setCart((entries) => entries.filter((entry) => entry.id !== line.id))}><X size={15} /></button>
              </div>
            </li>)}
          </ul>
          <footer>
            <div className={styles.total}><span>{t("subtotal")} <small>{t("shipping")}</small></span><strong>{money(total)}</strong></div>
            {cartEntries.some((entry) => !entry.available) && <p className={styles.error}>{t("removeSoldOut")}</p>}
            {inquiryError && <p className={styles.error} role="alert">{t(inquiryError)}</p>}
            <button className={styles.primary} type="button" disabled={sending || cartEntries.some((entry) => !entry.available)}
              onClick={() => void submit()}>{sending ? t("sending") : t("inquire")}<ArrowRight size={17} /></button>
          </footer>
        </>}
      </div>
    </dialog>
    </main>
  </>;
}
