"use client";

import PosterLift from "./poster-lift";
import { readAccessCover } from "./access-cover";
import { prepareCovers, resetPreparedCovers, preparedOriginal, splitViewport, prepareSplitRow } from "./prepared-cover";
import dynamic from "next/dynamic";
import { motion, useReducedMotion, useSpring, type MotionStyle } from "motion/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Plus, ShoppingBag, X } from "lucide-react";
import { businessContact } from "@/lib/business-contact";
import { campaignParams, trackConfirmedLead } from "./analytics";
import { lineTotal, money, selectRolls, yardage, type CartLine, type Catalog, type Pattern, type Variant } from "./catalog";
import { AccessGate, Welcome } from "./entry";
import { customerCode, customerCodeMaxLength } from "./customer-code";
import { colorName, countLabel, fabricName, languages, swatchesText, type Language } from "./language";
import styles from "./swatches.module.css";
import { localizedFabricSpecs } from "./specifications";

const SpecimenGrid = dynamic(() => import("./specimen-grid"));
const FabricFilm = dynamic(() => import("./fabric-film"));
const ColorGallery = dynamic(() => import("./color-gallery"));
const api = "/api/swatches";
const email = businessContact.email;
type TextKey = Parameters<ReturnType<typeof swatchesText>>[0];

function LanguageToggle({ active, onSelect }: { active: Language; onSelect: (language: Language) => void }) {
  return <div className={styles.languageToggle} role="group" aria-label="Language">
    {languages.map(({ id, name, short }) => <button key={id} type="button" lang={id}
      aria-label={name} aria-pressed={active === id} onClick={() => onSelect(id)}>{short}</button>)}
  </div>;
}

type CartEntry = CartLine & { available: boolean };
type Receipt = "sent" | "saved" | "uncertain";

export default function Swatches({ enablePosters = false }: { enablePosters?: boolean }) {
  const [language, pickLanguage] = useState<Language | null>(null);
  const [preparedGrid, setPreparedGrid] = useState<typeof SpecimenGrid>();
  const Grid = preparedGrid ?? SpecimenGrid;
  const currentLanguage = language ?? "ko";
  const t = swatchesText(currentLanguage);
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [status, setStatus] = useState<"locked" | "ready">("locked");
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
  const visit = useRef("");
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
  const [cart, setCart] = useState<Omit<CartLine, "price">[]>([]);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const cartDialog = useRef<HTMLDialogElement>(null);
  const [inquiryError, setInquiryError] = useState<TextKey | "">("");
  const [sending, setSending] = useState(false);
  const submitting = useRef(false);
  const [refreshing, setRefreshing] = useState(false);
  const loadingStock = useRef(false);

  useEffect(() => {
    // A history-cache restore is a new entry, not permission to reveal the old catalog.
    const requireCodeOnReturn = (event: PageTransitionEvent) => {
      if (event.persisted) window.location.reload();
    };
    window.addEventListener("pageshow", requireCodeOnReturn);
    return () => {
      window.removeEventListener("pageshow", requireCodeOnReturn);
      resetPreparedCovers();
    };
  }, []);

  const loadCatalog = useCallback(async () => {
    if (loadingStock.current) return;
    loadingStock.current = true;
    setRefreshing(true);
    prepareCovers();
    try {
      const response = await fetch(`${api}/catalog`, { cache: "no-store", headers: { "X-Swatches-Visit": visit.current } });
      if (response.status === 401) {
        resetPreparedCovers();
        visit.current = "";
        setStatus("locked");
        setWelcomeName(null);
        setCatalog(null);
        setCart([]);
        cartDialog.current?.close();
        return;
      }
      if (!response.ok) throw new Error("Catalog source unavailable");
      const live: Catalog = await response.json();
      setCatalog(live);
      setStatus("ready");
      setStockError("");
      setAccessError("");
    } catch {
      setCatalog(null);
      setStockError("stockUnavailable");
    } finally {
      loadingStock.current = false;
      setRefreshing(false);
    }
  }, []);

  async function enter(value: string) {
    const validated = customerCode(value);
    if (!validated || verifyingCode.current || status !== "locked") return;
    verifyingCode.current = true;
    setAccessPending(true);
    setAccessError("");
    setReceipt(null);
    try {
      const viewport = splitViewport();
      const response = await fetch(`${api}/access${viewport ? "?" + viewport : ""}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(viewport && { Accept: "application/x-swatch-cover" }) },
        body: JSON.stringify({ code: validated, campaign: campaignParams().campaign_name }),
      });
      if (!response.ok) {
        setAccessError(response.status === 429 ? "codeSlow" : response.status === 401 ? "codeInvalid" : "codeUnavailable");
        return;
      }
      const framed = response.headers.get("content-type") === "application/x-swatch-cover";
      const cover = framed ? await readAccessCover(response).catch(() => undefined) : undefined;
      const result = framed ? cover?.result : await response.json();
      if (!result || typeof result.visitKey !== "string" || !result.visitKey) {
        cover?.cancel();
        throw new Error("Missing swatch visit key");
      }
      visit.current = result.visitKey;
      performance.mark("swatches-access-accepted");
      if (cover && viewport && viewport === splitViewport()) prepareSplitRow(viewport, result.images, cover, result.visitKey);
      else cover?.cancel();
      void import("./specimen-grid").catch(() => {});
      setFirstCoverReady(false);
      setWelcomeName(typeof result.welcomeName === "string" ? result.welcomeName : "");
      setCode("");
      setStatus("ready");
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
  // Both the gallery and the film placeholder use the same approved original.
  // Keep canonical catalog URLs for authorization, poster eligibility and edits.
  const detailVariants = useMemo(() => pattern?.variants.map(entry => {
    if (!entry.image) return entry;
    const image = preparedOriginal(entry.image);
    return image === entry.image ? entry : { ...entry, image };
  }), [pattern]);
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
    return live ? { ...live, available: !catalog?.canViewPrices || live.price != null } : { ...line, available: false };
  });
  const showPrices = catalog?.canViewPrices === true && !refreshing;
  const total = cartEntries.reduce((sum, line) => line.available && line.price != null ? sum + lineTotal(line.yards, line.price) : sum, 0);

  const openPattern = useCallback((group: Pattern, selectedVariant?: Variant) => {
    const initial = selectedVariant ?? group.variants.find((entry) => entry.rolls.length > 0) ?? group.variants[0];
    setPatternName(group.name);
    setSku(initial.sku);
    window.scrollTo({ top: 0 });
  }, []);

  function selectColor(index: number) {
    if (!pattern || index === active) return;
    const selected = pattern.variants[index];
    setSku(selected.sku);
  }

  function add(id: string) {
    const line = available.get(id);
    if (!line || cart.some((entry) => entry.id === id)) return;
    if (cart.length >= 100) return;
    const { sku, color, pattern, yards } = line;
    setCart((entries) => entries.some((entry) => entry.id === id) ? entries : [...entries, { id, sku, color, pattern, yards }]);
    if (receipt !== "uncertain") setReceipt(null);
    setInquiryError("");
  }

  function showCart() {
    cartDialog.current?.showModal();
  }

  async function submit() {
    if (submitting.current || loadingStock.current || !catalog || !cartEntries.length || cartEntries.some((entry) => !entry.available)) return;
    submitting.current = true;
    setSending(true);
    setInquiryError("");
    try {
      const response = await fetch(`${api}/inquiry`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Swatches-Visit": visit.current },
        body: JSON.stringify({ items: cartEntries.map(({ id, price }) => showPrices ? { id, price } : { id }) }),
      });
      const result = await response.json();
      if (response.status === 401) {
        cartDialog.current?.close();
        setCatalog(null);
        setCart([]);
        resetPreparedCovers();
        visit.current = "";
        setStatus("locked");
        setAccessError("codeExpired");
        return;
      }
      if (response.status === 409) await loadCatalog();
      if (result.uncertain) {
        setReceipt("uncertain");
        return;
      }
      if (!response.ok) {
        setInquiryError(response.status === 409 ? "stockChanged" : result.preview ? "previewMail" : "inquiryUnavailable");
        return;
      }
      setReceipt(result.sent ? "sent" : "saved");
      if (result.ok === true && result.newlySent === true) trackConfirmedLead(cartEntries.length);
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
      <section role="dialog" aria-labelledby="swatches-language-title">
        <h1 id="swatches-language-title">Language</h1>
        <div className={styles.entryActions}>
          {languages.map(({ id, name }) => <button key={id} type="button" lang={id} onClick={() => {
            pickLanguage(id);
            // This chunk contains UI code only. Private media starts after login.
            if (splitViewport()) void import("./specimen-grid").then(m => setPreparedGrid(() => m.default)).catch(() => {});
          }}>{name}</button>)}
        </div>
      </section>
    </main>;
  }

  if (status !== "ready") {
    const gateError = accessError || stockError;
    return <AccessGate language={language} code={code} onCode={(value) => {
      setCode(value);
      if (value.length === customerCodeMaxLength && !customerCode(value)) {
        setAccessError("codeInvalid");
        return;
      }
      if (accessError) setAccessError("");
      void enter(value);
    }}
      pending={accessPending} disabled={false} error={gateError ? t(gateError) : ""}
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

    {pattern && variant ? <><motion.article className={styles.detail} data-original-film={variant.video ? "" : undefined} style={{ "--film-progress": filmProgress } as MotionStyle}>
      <div className={styles.detailMedia} data-with-film={variant.video ? "" : undefined}>
        <ColorGallery key={pattern.name} variants={detailVariants ?? pattern.variants} active={active} onSelect={selectColor} language={language} sampleImages={catalog?.sampleImages} />
        {variant.video && <FabricFilm key={variant.sku} variant={detailVariants?.[active] ?? variant} language={language} onExpanded={updateFilmLayout} />}
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
          {showPrices && <div><dt>{t("unitPrice")}</dt><dd>{variant.price == null ? t("pricePending") : money(variant.price)}</dd></div>}
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
              <button type="button" disabled={added || (showPrices && variant.price == null) || cart.length >= 100}
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
    </motion.article>
      {enablePosters && /^[ST][1-9][0-9]{0,2}$/.test(variant.sku)
        && Number(variant.sku.slice(1)) <= (variant.sku.startsWith("S") ? 108 : 128)
        && variant.image === `/api/swatches/photo?sku=${variant.sku}&v=1`
        && <PosterLift key={variant.sku} sku={variant.sku} />}
    </> : catalog && <Grid patterns={visiblePatterns} language={language}
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
              <div><span>{!line.available ? t("soldOut") : showPrices && line.price != null ? money(lineTotal(line.yards, line.price)) : null}</span>
                <button type="button" className={styles.iconButton} aria-label={`${t("remove")} · ${line.sku} ${yardage(line.yards)}`} disabled={sending}
                  onClick={() => setCart((entries) => entries.filter((entry) => entry.id !== line.id))}><X size={15} /></button>
              </div>
            </li>)}
          </ul>
          <footer>
            {showPrices && <div className={styles.total}><span>{t("subtotal")} <small>{t("shipping")}</small></span><strong>{money(total)}</strong></div>}
            {cartEntries.some((entry) => !entry.available) && <p className={styles.error}>{t("removeSoldOut")}</p>}
            {inquiryError && <p className={styles.error} role="alert">{t(inquiryError)}</p>}
            <button className={styles.primary} type="button" disabled={sending || refreshing || !catalog || cartEntries.some((entry) => !entry.available)}
              onClick={() => void submit()}>{sending ? t("sending") : t(catalog?.canViewPrices ? "inquire" : "requestQuote")}<ArrowRight size={17} /></button>
          </footer>
        </>}
      </div>
    </dialog>
    </main>
  </>;
}
