"use client";

import { useEffect, useRef, useState } from "react";
import s from "./poster-lift.module.css";

export default function PosterLift({ sku }: { sku: string }) {
  const panel = useRef<HTMLElement>(null);
  const [phase, setPhase] = useState({ ready: false, moving: false });
  const [near, setNear] = useState(false);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let ready = false;
    const sync = () => {
      const moving = window.scrollY > 2;
      setPhase(last => last.ready === ready && last.moving === moving ? last : { ready, moving });
      if (!("IntersectionObserver" in window) && moving) setNear(true);
    };
    const delayed = window.setTimeout(() => { ready = true; sync(); }, 1000);
    window.addEventListener("scroll", sync, { passive: true });
    sync();
    const observer = "IntersectionObserver" in window ? new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) { setNear(true); observer?.disconnect(); }
    }, { rootMargin: "0px 0px 160px 0px" }) : undefined;
    if (panel.current) observer?.observe(panel.current);
    return () => { window.clearTimeout(delayed); window.removeEventListener("scroll", sync); observer?.disconnect(); };
  }, []);
  const move = () => {
    const node = panel.current;
    if (!node) return;
    const tallViewport = window.innerHeight * .65;
    const exactGap = node.getBoundingClientRect().top - (window.innerHeight - tallViewport);
    window.scrollBy({ top: Math.max(tallViewport, exactGap), behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
  };
  if (failed) return null;
  return <>
    <section ref={panel} className={s.panel} data-poster-lift-panel data-revealed={phase.moving || undefined}
      aria-label={`${sku} material poster`} aria-hidden={phase.moving ? undefined : true}>
      {near && (
        // Asset intentionally never routed through public image optimization.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={`/api/swatches/poster?sku=${encodeURIComponent(sku)}`} alt={`${sku} fabric, palette and optical detail`}
          decoding="async" onError={() => setFailed(true)} />
      )}
    </section>
    {phase.ready && !phase.moving && <button type="button" className={s.pull} onClick={move}><span>↑ Scroll up</span><i aria-hidden="true" /></button>}
  </>;
}
