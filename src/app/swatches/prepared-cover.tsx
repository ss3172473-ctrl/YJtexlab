"use client";
import Image, { type ImageProps } from "next/image";
import { firstRowEnabled, splitRowEnabled } from "./first-row-policy";
import { useLayoutEffect, useRef, useState } from "react";

const pending = new Map<string, HTMLImageElement>();
const mounted = new Set<string>();
// Reuse only the exact original bytes already displayed in this document.
const originals = new Map<string, { url: string; loaded: number }>();
export function preparedOriginal(src: string) {
  const entry = originals.get(src);
  return entry && performance.now() - entry.loaded < 15_000 ? entry.url : src;
}
let epoch = 0;
let started = false;
let inflight: AbortController | undefined;
let cancelLead: (() => void) | undefined;
const eligible = /^\/api\/swatches\/(?:thumbnail\?sku=[ST][1-9]\d{0,2}|photo\?sku=[ST][1-9]\d{0,2}&v=1)$/;

export function firstRowCanary() {
  return typeof window !== "undefined" && firstRowEnabled(location.search);
}
export function resetPreparedCovers() {
  epoch++;
  started = false;
  cancelLead?.();
  cancelLead = undefined;
  inflight?.abort();
  inflight = undefined;
  originals.forEach(entry => URL.revokeObjectURL(entry.url));
  originals.clear();
  pending.clear();
  mounted.clear();
}
function reserve(src: string, priority: "high" | "low") {
  const image = new window.Image();
  image.decoding = "async";
  image.fetchPriority = priority;
  image.referrerPolicy = "no-referrer";
  pending.set(src, image);
  window.setTimeout(() => { if (pending.get(src) === image) pending.delete(src); }, 3500);
  return image;
}

export function splitViewport() {
  if (!splitRowEnabled(location.search, document.hidden, Boolean(
      (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData))) return;
  return new URLSearchParams({ width: String(window.innerWidth), dpr: String(devicePixelRatio || 1) }).toString();
}

const bundledSources = new WeakMap<HTMLImageElement, { url: string; src: string }>();
export function matchesCover(image: HTMLImageElement, src: string) {
  const part = bundledSources.get(image);
  return image.src === new URL(src, image.baseURI).href || (part?.src === src && image.src === part.url);
}
export function retryBundledCover(image: HTMLImageElement) {
  const part = bundledSources.get(image);
  if (!part || image.src !== part.url) return false;
  bundledSources.delete(image);
  image.src = part.src;
  return true;
}

function assignBlob(image: HTMLImageElement, src: string, part: Blob) {
  const url = URL.createObjectURL(part);
  bundledSources.set(image, { src, url });
  const ticket = epoch;
  const release = (event: Event) => {
    image.removeEventListener("load", release);
    image.removeEventListener("error", release);
    if (ticket === epoch && event.type === "load" && src.startsWith("/api/swatches/photo?")) {
      originals.set(src, { url, loaded: performance.now() });
    } else URL.revokeObjectURL(url);
  };
  image.addEventListener("load", release);
  image.addEventListener("error", release);
  image.src = url;
}

export function prepareSplitRow(viewport: string, images: unknown, delivery: { image: Promise<Blob | undefined>; cancel: () => void }, visitKey: string) {
  if (started || !Array.isArray(images) || !images.length || images.length > 5 ||
      !images.every(src => typeof src === "string" && eligible.test(src)) ||
      new Set(images).size !== images.length) { delivery.cancel(); return; }
  started = true;
  const [lead, ...rest] = images as string[];
  const ticket = epoch;
  const first = reserve(lead, "high");
  cancelLead = delivery.cancel;
  let settled = false;
  const useOrdinaryLead = () => {
    if (settled || ticket !== epoch) return;
    settled = true;
    delivery.cancel();
    first.src = lead;
  };
  const deadline = window.setTimeout(useOrdinaryLead, 2500);
  void delivery.image.then(blob => {
    if (cancelLead === delivery.cancel) cancelLead = undefined;
    window.clearTimeout(deadline);
    if (ticket !== epoch || settled || (!first.isConnected && pending.get(lead) !== first)) return;
    if (!blob) { useOrdinaryLead(); return; }
    settled = true;
    assignBlob(first, lead, blob);
  }, useOrdinaryLead);
  if (rest.length < 2) {
    for (const src of rest) reserve(src, "low").src = src;
    return;
  }
  const waiting = rest.map(src => ({ src, image: reserve(src, "low") }));
  const abort = inflight = new AbortController();
  const timer = window.setTimeout(() => abort.abort(), 2500);
  void (async () => {
    let parts: FormData | undefined;
    try {
      const res = await fetch("/api/swatches/first-row/rest?" + viewport, {
        cache: "no-store", credentials: "same-origin", signal: abort.signal, headers: { "X-Swatches-Visit": visitKey },
      });
      if (res.ok) parts = await res.formData();
    } catch { /* Missing parts use their ordinary authenticated URL. */ }
    finally {
      window.clearTimeout(timer);
      if (inflight === abort) inflight = undefined;
    }
    if (ticket !== epoch) return;
    for (const { src, image } of waiting) {
      if (!image.isConnected && pending.get(src) !== image) continue;
      const part = parts?.get(src);
      if (!(part instanceof Blob) || !["image/webp", "image/png"].includes(part.type) || !part.size) {
        image.src = src;
        continue;
      }
      assignBlob(image, src, part);
    }
  })();
}

export function prepareCovers() {
  if (started || !firstRowCanary() || document.hidden ||
    (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData) return;
  started = true;
  const ticket = epoch, viewport = window.innerWidth, density = devicePixelRatio || 1;
  const abort = inflight = new AbortController();
  const timer = window.setTimeout(() => abort.abort(), 2500);
  const query = new URLSearchParams({ width:String(viewport), dpr:String(density) });
  void fetch("/api/swatches/first-row?" + query, { cache:"no-store", credentials:"same-origin", signal:abort.signal }).then(async res => {
    if (!res.ok) return;
    const data = await res.json();
    if (!Array.isArray(data.images) || ticket !== epoch || document.hidden || viewport !== window.innerWidth || density !== (devicePixelRatio || 1)) return;
    for (const src of data.images.slice(0, 5)) {
      if (typeof src !== "string" || !eligible.test(src) || mounted.has(src) || pending.has(src)) continue;
      reserve(src, "high").src = src;
    }
  }).catch(() => {}).finally(() => { window.clearTimeout(timer); if (inflight === abort) inflight = undefined; });
}

type CoverEvent = { currentTarget:HTMLImageElement };
type Props = Omit<ImageProps,"onLoad"|"onError"> & { onLoad?:(event:CoverEvent)=>void; onError?:(event:CoverEvent)=>void; src:string; "data-cover-sku":string; "data-visible":boolean };
export function PreparedCover(props: Props) {
  // This component is keyed by final src, so later rerenders cannot switch from
  // a standard Image to an adopted node (or back) and pay twice.
  const [adopted] = useState(() => pending.get(props.src));
  const host = useRef<HTMLSpanElement>(null);
  const live = useRef(props);
  live.current = props;
  useLayoutEffect(() => {
    mounted.add(props.src);
    if (!adopted || !host.current) return () => { mounted.delete(props.src); };
    pending.delete(props.src);
    const el = adopted, p = live.current;
    el.alt = ""; el.className = p.className ?? ""; el.dataset.coverSku = p["data-cover-sku"];
    el.dataset.visible = String(p["data-visible"]); el.setAttribute("aria-hidden", "true");
    Object.assign(el.style, { position:"absolute", inset:"0", width:"100%", height:"100%", color:"transparent" });
    let fired = false;
    // Keep ordinary card code for decode, source identity, fallback, and accent.
    const notify = (ok:boolean) => {
      if (fired || !el.isConnected) return;
      fired = true;
      const handler = ok ? live.current.onLoad : live.current.onError;
      handler?.({ currentTarget:el });
    };
    const load = () => notify(true);
    const error = () => { if (!retryBundledCover(el)) notify(false); };
    el.addEventListener("load", load); el.addEventListener("error", error);
    host.current.appendChild(el);
    if (el.complete && el.getAttribute("src")) { if (el.naturalWidth) load(); else error(); }
    return () => { el.removeEventListener("load", load); el.removeEventListener("error", error); el.remove(); mounted.delete(props.src); };
  }, [props.src, adopted]);
  useLayoutEffect(() => { if (adopted) adopted.dataset.visible = String(props["data-visible"]); }, [adopted, props["data-visible"]]);
  return adopted ? <span aria-hidden="true" style={{display:"contents"}} ref={host}/> : <Image {...props}/>;
}
