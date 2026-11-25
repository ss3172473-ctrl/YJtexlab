"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { animate, useReducedMotion } from "motion/react";
import { drawFold, foldEase } from "./fold-surface";
import styles from "./fold-corner.module.css";

type Props = {
  sku: string;
  frontSrc: string;
  reverseSrc: string;
  label: string;
  introAvailable: () => boolean;
  markIntroSeen: () => void;
};

type IntroPhase = "idle" | "opening" | "hold" | "returning" | "complete" | "interrupted";
const OPEN_TIME = 460, HOLD_TIME = 420, RETURN_TIME = 650;

// A key discards late image completions on colour changes without showing a stale reverse.
export function FoldCorner(props: Props) {
  return <Corner key={props.sku + "|" + props.frontSrc + "|" + props.reverseSrc} {...props} />;
}
export default FoldCorner;

function Corner({sku, frontSrc, reverseSrc, label, introAvailable, markIntroSeen}: Props) {
  const canvas = useRef<HTMLCanvasElement>(null), host = useRef<HTMLDivElement>(null);
  const info = useRef({w: 0, h: 0, paper: "#fff"});
  const images = useRef<[HTMLImageElement, HTMLImageElement] | null>(null);
  const amount = useRef(0), introFrame = useRef(0);
  const intro = useRef<IntroPhase>("idle");
  // Read manual intent synchronously if visibility changes in the same event batch.
  const intent = useRef({hover: false, pin: false});
  const [ready,setReady] = useState(false), [visible,setVisible] = useState(false);
  const [hover,setHover] = useState(false), [pin,setPin] = useState(false);
  const reduceMotion = useReducedMotion();
  const open = ready && (hover || pin);

  const paint = useCallback((p: number) => {
    amount.current = p;
    const c = canvas.current, sources = images.current;
    if (!c || !sources) return;
    const {w,h,paper} = info.current;
    drawFold(c, sku, p, ...sources, w, h, paper);
  }, [sku]);

  const phase = useCallback((next: IntroPhase) => {
    intro.current = next;
    if (host.current) host.current.dataset.foldPhase = next;
  }, []);
  const stopIntro = useCallback(() => {
    window.cancelAnimationFrame(introFrame.current);
    introFrame.current = 0;
    if (intro.current === "opening" || intro.current === "hold" || intro.current === "returning") {
      phase("interrupted");
      return true;
    }
    return false;
  }, [phase]);
  const interruptForUser = useCallback((close: boolean) => {
    markIntroSeen(); // Manual interaction owns the reverse from now on.
    if (stopIntro() && close) paint(intent.current.hover || intent.current.pin ? 1 : 0);
  }, [markIntroSeen, stopIntro, paint]);
  const hoverAt = (v: boolean) => { intent.current.hover = v; setHover(v); };
  const pinAt = (v: boolean) => { intent.current.pin = v; setPin(v); };

  useEffect(() => {
    const el = host.current, c = canvas.current;
    if (!el || !c || !c.getContext("2d")) return;
    let cancelled = false;
    const resize = () => {
      const w = el.clientWidth, h = el.clientHeight;
      const bg = getComputedStyle(el.parentElement || el).backgroundColor;
      info.current = {w, h, paper: !bg || bg === "rgba(0, 0, 0, 0)" || bg === "transparent" ? "#fff" : bg};
      const ratio = Math.min(window.devicePixelRatio || 1, 1.65, 720 / Math.max(1,w));
      const width = Math.max(1, Math.round(w * ratio)), height = Math.max(1, Math.round(h * ratio));
      if (c.width !== width || c.height !== height) { c.width = width; c.height = height; }
      paint(amount.current);
    };
    const ro = new ResizeObserver(resize);
    ro.observe(el); resize();
    const decode = async (src: string) => {
      const image = new Image();
      image.decoding = "async"; image.referrerPolicy = "no-referrer";
      image.src = src;
      await image.decode();
      if (!image.naturalWidth || !image.naturalHeight) throw new Error("Undecoded fold source");
      return image;
    };
    Promise.all([decode(frontSrc), decode(reverseSrc)]).then(([a,b]) => {
      if (cancelled) return;
      images.current = [a,b]; setReady(true);
    }).catch(() => { /* Preserve the original image when a real rear cannot be loaded. */ });
    return () => { cancelled = true; ro.disconnect(); images.current = null; };
  }, [frontSrc, reverseSrc, paint]);

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
    let inView = false;
    const update = () => {
      const shown = inView && document.visibilityState === "visible" && !motionPreference.matches;
      if (!shown && stopIntro()) paint(intent.current.hover || intent.current.pin ? 1 : 0);
      setVisible(shown);
    };
    const io = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting && entry.intersectionRatio >= .65;
      update();
    }, {threshold: [.65]});
    io.observe(el);
    document.addEventListener("visibilitychange", update);
    motionPreference.addEventListener("change", update);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", update);
      motionPreference.removeEventListener("change", update);
      stopIntro();
    };
  }, [paint, stopIntro]);

  useEffect(() => {
    if (!ready || !visible || reduceMotion || open || intro.current !== "idle" || !introAvailable()) return;
    const birth = performance.now();
    phase("opening");
    const tick = (now: number) => {
      const t = Math.max(0, now - birth);
      if (t < OPEN_TIME) paint(foldEase(t / OPEN_TIME));
      else if (t < OPEN_TIME + HOLD_TIME) {
        if (intro.current !== "hold") {
          paint(1);
          phase("hold");
        } else {
          // Only spend the single intro after the full rear survived a paint.
          markIntroSeen();
        }
      } else if (t < OPEN_TIME + HOLD_TIME + RETURN_TIME) {
        if (intro.current !== "returning") phase("returning");
        paint(1 - foldEase((t - OPEN_TIME - HOLD_TIME) / RETURN_TIME));
      } else { phase("complete"); paint(0); introFrame.current = 0; return; }
      introFrame.current = window.requestAnimationFrame(tick);
    };
    introFrame.current = window.requestAnimationFrame(tick);
    return () => {
      window.cancelAnimationFrame(introFrame.current);
      introFrame.current = 0;
      if (intro.current === "opening" || intro.current === "hold" || intro.current === "returning") phase("idle");
    };
  }, [ready, visible, reduceMotion, open, introAvailable, markIntroSeen, phase, paint]);

  useEffect(() => {
    if (!ready) return;
    const to = open ? 1 : 0, from = amount.current;
    if (reduceMotion || Math.abs(from - to) < .001) { paint(to); return; }
    const controls = animate(from, to, {
      duration: (open ? 1.13 : .92) * Math.sqrt(Math.abs(to - from)),
      ease: foldEase, onUpdate: paint,
    });
    return () => controls.stop();
  }, [ready, open, paint, reduceMotion]);

  useEffect(() => {
    const escape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      const working = stopIntro();
      if (working) paint(0);
      if (!open && !working) return;
      event.preventDefault(); event.stopImmediatePropagation();
      intent.current.hover = false; intent.current.pin = false;
      setHover(false); setPin(false);
    };
    window.addEventListener("keydown", escape, true);
    return () => window.removeEventListener("keydown", escape, true);
  }, [open, paint, stopIntro]);

  return <div ref={host} className={styles.mount} data-fold-ready={ready} data-fold-open={open}>
    <canvas ref={canvas} className={styles.surface} aria-hidden="true" />
    {ready && <button type="button" className={styles.hit + " swiper-no-swiping"} aria-label={label} aria-pressed={open}
      onFocus={() => interruptForUser(true)}
      onPointerEnter={event => {
        if (event.pointerType === "mouse" && window.matchMedia("(hover: hover)").matches) {
          interruptForUser(false); hoverAt(true);
        }
      }}
      onPointerLeave={() => hoverAt(false)}
      onPointerDown={event => { event.stopPropagation(); interruptForUser(true); }}
      onPointerUp={event => event.stopPropagation()}
      onTouchStart={event => { event.stopPropagation(); interruptForUser(true); }}
      onClick={event => {
        event.stopPropagation(); interruptForUser(false);
        if (intent.current.pin) { pinAt(false); hoverAt(false); } else pinAt(true);
      }}>
      <svg className={styles.hint} aria-hidden="true" width="21" height="21" viewBox="0 0 21 21" fill="none">
        <path d="M2 2h17v17L2 2Z" fill="white" fillOpacity=".72"/>
        <path d="M2 2c3.5 1.2 6 3 8.6 6 3 3.7 5.6 7 8.4 11" stroke="currentColor" strokeOpacity=".55" strokeWidth="1.15"/>
      </svg>
    </button>}
  </div>;
}
