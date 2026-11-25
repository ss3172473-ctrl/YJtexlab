"use client";
import Image, { type ImageProps } from "next/image";
import { firstRowEnabled } from "./first-row-policy";
import { useLayoutEffect, useRef, useState } from "react";

const pending = new Map<string, HTMLImageElement>();
const mounted = new Set<string>();
let epoch = 0;
let started = false;
let inflight: AbortController | undefined;
const eligible = /^\/api\/swatches\/(?:thumbnail\?sku=[ST][1-9]\d{0,2}|photo\?sku=[ST][1-9]\d{0,2}&v=1)$/;

export function firstRowCanary() {
  return typeof window !== "undefined" && firstRowEnabled(location.search);
}
export function resetPreparedCovers() {
  epoch++;
  started = false;
  inflight?.abort();
  inflight = undefined;
  pending.clear();
  mounted.clear();
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
      const image = new window.Image();
      image.decoding = "async"; image.fetchPriority = "high"; image.referrerPolicy = "no-referrer";
      pending.set(src, image);
      image.src = src;
      window.setTimeout(() => { if (pending.get(src) === image) pending.delete(src); }, 3500);
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
    const load = () => notify(true), error = () => notify(false);
    el.addEventListener("load", load); el.addEventListener("error", error);
    host.current.appendChild(el);
    if (el.complete && el.getAttribute("src")) notify(el.naturalWidth > 0);
    return () => { el.removeEventListener("load", load); el.removeEventListener("error", error); el.remove(); mounted.delete(props.src); };
  }, [props.src, adopted]);
  useLayoutEffect(() => { if (adopted) adopted.dataset.visible = String(props["data-visible"]); }, [adopted, props["data-visible"]]);
  return adopted ? <span aria-hidden="true" style={{display:"contents"}} ref={host}/> : <Image {...props}/>;
}
