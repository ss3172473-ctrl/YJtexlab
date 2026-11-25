"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import Image from "next/image";
import { Maximize2, Minimize2, Pause, Play } from "lucide-react";
import type { Variant } from "./catalog";
import type { Language } from "./language";
import styles from "./fabric-film.module.css";

function playInline(element: HTMLVideoElement) {
  element.defaultMuted = true;
  element.muted = true;
  return element.play();
}

const words = {
  ko: { title: "원단 움직임", play: "영상 재생", pause: "영상 일시 정지", expand: "영상 확대", collapse: "영상 축소" },
  en: { title: "Fabric in motion", play: "Play film", pause: "Pause film", expand: "Enlarge film", collapse: "Shrink film" },
  "zh-CN": { title: "面料动态", play: "播放视频", pause: "暂停视频", expand: "放大视频", collapse: "缩小视频" },
  ja: { title: "生地の動画", play: "動画を再生", pause: "動画を一時停止", expand: "動画を拡大", collapse: "動画を縮小" },
};

export default function FabricFilm({ variant, language, onExpanded }: { variant: Variant; language: Language; onExpanded: (expanded: boolean) => void }) {
  const { sku, video, image } = variant;
  const t = words[language];
  const panel = useRef<HTMLDivElement>(null);
  const clip = useRef<HTMLVideoElement | null>(null);
  const registerClip = useCallback((element: HTMLVideoElement | null) => {
    clip.current = element;
    if (element) {
      element.defaultMuted = true;
      element.muted = true;
    }
  }, []);
  const hoverIntent = useRef<number | undefined>(undefined);
  const [visible, setVisible] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [reduced, setReduced] = useState(true);
  const [requested, setRequested] = useState<boolean | null>(null);
  const [playing, setPlaying] = useState(false);
  const [hasPlayed, setHasPlayed] = useState(false);
  const [failed, setFailed] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focus, setFocus] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const expanded = pinned || (!dismissed && (hovered || focus));
  useEffect(() => { onExpanded(expanded); }, [expanded, onExpanded]);
  useEffect(() => () => { onExpanded(false); window.clearTimeout(hoverIntent.current); }, [onExpanded]);


  useEffect(() => {
    const preference = matchMedia("(prefers-reduced-motion: reduce)");
    function update() { setReduced(preference.matches); }
    update();
    preference.addEventListener("change", update);
    return () => preference.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const node = panel.current;
    if (!node) return;
    // A tall expanded portrait on a short mobile viewport need not be 45% visible.
    const visibility = matchMedia("(max-width: 1039px)");
    const observer = new IntersectionObserver(([entry]) => {
      const threshold = visibility.matches ? .2 : .45;
      setVisible(entry.isIntersecting && entry.intersectionRatio >= threshold);
    }, { threshold: [.2, .45] });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!expanded) return;
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") { setPinned(false); setDismissed(true); }
    };
    window.addEventListener("keydown", escape);
    return () => window.removeEventListener("keydown", escape);
  }, [expanded]);

  const intendsPlay = requested ?? !reduced;

  useEffect(() => {
    if (visible && intendsPlay && !failed) setEnabled(true);
  }, [visible, intendsPlay, failed]);

  useEffect(() => {
    const element = clip.current;
    if (!enabled || !element) return;
    function sync() {
      if (element && visible && intendsPlay && !document.hidden) {
        element.defaultPlaybackRate = .75;
        element.playbackRate = .75;
        void playInline(element).catch(() => setPlaying(false));
      } else element?.pause();
    }
    sync();
    document.addEventListener("visibilitychange", sync);
    return () => document.removeEventListener("visibilitychange", sync);
  }, [enabled, visible, intendsPlay]);

  if (!video) return null;
  return <section className={styles.section} aria-label={`${t.title} · ${sku}`} data-film-section={sku}
    data-expanded={expanded}
    onPointerEnter={(event) => {
      if (event.pointerType === "mouse" && matchMedia("(hover: hover) and (pointer: fine)").matches) {
        window.clearTimeout(hoverIntent.current);
        hoverIntent.current = window.setTimeout(() => { setHovered(true); setDismissed(false); }, 285);
      }
    }}
    onPointerLeave={() => { window.clearTimeout(hoverIntent.current); setHovered(false); }}
    onPointerCancel={() => { window.clearTimeout(hoverIntent.current); setHovered(false); }}
    onFocusCapture={(event) => { if (event.target.matches(":focus-visible")) { setFocus(true); setDismissed(false); } }}
    onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setFocus(false); }}>
    <div className={styles.anchor} ref={panel}>
    <div className={styles.frame}>
      {visible && (!enabled || failed) && image && <Image src={image} alt="" unoptimized fill loading="eager" fetchPriority="low" decoding="async" sizes="(max-width: 480px) 80vw, 334px" />}
      {enabled && !failed && <video
        ref={registerClip} src={video} poster={image || undefined} data-video-sku={sku} muted loop playsInline preload="metadata"
        onLoadedMetadata={({ currentTarget }) => {
          currentTarget.defaultPlaybackRate = .75;
          currentTarget.playbackRate = .75;
          currentTarget.defaultMuted = true;
          currentTarget.muted = true;
        }}
        onPlaying={() => { setPlaying(true); setHasPlayed(true); }}
        onPause={() => setPlaying(false)} onError={() => { setFailed(true); setHasPlayed(false); setPlaying(false); }}
        aria-label={`${t.title} · ${sku}`} />}
      {hasPlayed && !failed && <Image src="/brand/yjtexlab-logo.png" alt="" width={405} height={200} unoptimized
        className={styles.watermark} data-film-watermark aria-hidden="true" draggable={false} />}
      {!failed && <div className={styles.controls}>
        <button type="button" aria-label={playing ? t.pause : t.play} onClick={() => {
          if (playing) {
            setRequested(false);
            clip.current?.pause();
            return;
          }
          // Safari needs play() to run in the tap handler when autoplay is blocked.
          if (!enabled) flushSync(() => setEnabled(true));
          if (clip.current) void playInline(clip.current).catch(() => setPlaying(false));
          setRequested(true);
        }}>
          {playing ? <Pause aria-hidden="true" size={14} /> : <Play aria-hidden="true" size={14} />}
        </button>
        <button type="button" aria-label={pinned ? t.collapse : t.expand} aria-expanded={expanded} onClick={() => {
          if (pinned) { setPinned(false); setDismissed(true); }
          else { setPinned(true); setDismissed(false); }
        }}>
          {pinned ? <Minimize2 aria-hidden="true" size={14} /> : <Maximize2 aria-hidden="true" size={14} />}
        </button>
      </div>}
    </div>
    </div>
  </section>;
}
