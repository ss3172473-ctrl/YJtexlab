"use client";

import { useEffect, useMemo, useState } from "react";
import {
  PRELOAD_HARD_TIMEOUT_MS,
  PRELOAD_INITIAL_PROGRESS_FLOOR,
  PRELOAD_MAX_BLOCKING_REVEAL_MS,
  PRELOAD_MIN_COLD_REVEAL_MS,
  PRELOAD_READY_EVENT_NAME,
} from "@/lib/page-preload-timing";

type PagePreloadGateProps = {
  assets: string[];
  backgroundAssets?: string[];
  title: string;
  note: string;
  children: React.ReactNode;
  cacheStrategy?: "session" | "none";
};

type WindowWithIdleCallback = Window & {
  requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number;
};

const DESKTOP_BACKGROUND_BATCH_SIZE = 6;
const MOBILE_BACKGROUND_BATCH_SIZE = 4;
const BACKGROUND_BATCH_DELAY_MS = 180;
const MOBILE_BREAKPOINT_PX = 767;

function markPreloadReady(title: string, blockingAssetCount: number, backgroundAssetCount: number) {
  document.documentElement.dataset.pagePreloadReady = "true";
  window.performance.mark(`page-preload-ready:${title}`);
  window.dispatchEvent(
    new CustomEvent(PRELOAD_READY_EVENT_NAME, {
      detail: {
        title,
        blockingAssetCount,
        backgroundAssetCount,
      },
    }),
  );
}

function preloadImage(src: string, timeoutMs = PRELOAD_HARD_TIMEOUT_MS) {
  return new Promise<void>((resolve) => {
    const image = new Image();
    let settled = false;

    const finish = () => {
      if (settled) {
        return;
      }

      settled = true;
      resolve();
    };

    image.onload = finish;
    image.onerror = finish;
    image.src = src;

    if (image.complete) {
      finish();
      return;
    }

    const decodePromise = image.decode?.();
    if (decodePromise) {
      void decodePromise.then(finish).catch(finish);
    }

    window.setTimeout(finish, timeoutMs);
  });
}

function warmAssets(assets: string[]) {
  if (assets.length === 0) {
    return;
  }

  const isMobileViewport = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT_PX}px)`).matches;
  const batchSize = isMobileViewport ? MOBILE_BACKGROUND_BATCH_SIZE : DESKTOP_BACKGROUND_BATCH_SIZE;

  const start = () => {
    const runBatch = (offset: number) => {
      assets.slice(offset, offset + batchSize).forEach((asset) => {
        void preloadImage(asset);
      });

      if (offset + batchSize >= assets.length) {
        return;
      }

      window.setTimeout(() => runBatch(offset + batchSize), BACKGROUND_BATCH_DELAY_MS);
    };

    runBatch(0);
  };

  const windowWithIdleCallback = window as WindowWithIdleCallback;
  if (typeof windowWithIdleCallback.requestIdleCallback === "function") {
    windowWithIdleCallback.requestIdleCallback(start, { timeout: 1_500 });
    return;
  }

  window.setTimeout(start, 0);
}

export default function PagePreloadGate({
  assets,
  backgroundAssets = [],
  title,
  note,
  children,
  cacheStrategy = "session",
}: PagePreloadGateProps) {
  const normalizedAssets = useMemo(() => Array.from(new Set(assets.filter(Boolean))), [assets]);
  const normalizedBackgroundAssets = useMemo(
    () =>
      Array.from(new Set(backgroundAssets.filter(Boolean))).filter(
        (asset) => !normalizedAssets.includes(asset),
      ),
    [backgroundAssets, normalizedAssets],
  );
  const cacheKey = useMemo(
    () => `yjtex-preload:${title}:${normalizedAssets.length}:${normalizedAssets.join("|")}`,
    [normalizedAssets, title],
  );
  const [progress, setProgress] = useState(normalizedAssets.length === 0 ? 1 : 0);
  const [isReady, setIsReady] = useState(normalizedAssets.length === 0);

  useEffect(() => {
    document.documentElement.dataset.pagePreloadReady = "false";
    document.documentElement.dataset.pagePreloadAssetCount = String(normalizedAssets.length);
    document.documentElement.dataset.pagePreloadBackgroundCount = String(
      normalizedBackgroundAssets.length,
    );

    const cached = cacheStrategy === "session" ? window.sessionStorage.getItem(cacheKey) : null;

    if (normalizedAssets.length === 0) {
      if (cached === "done") {
        setProgress(1);
        setIsReady(true);
        markPreloadReady(title, normalizedAssets.length, normalizedBackgroundAssets.length);
        warmAssets(normalizedBackgroundAssets);
        return;
      }

      let cancelled = false;
      const revealTimer = window.setTimeout(() => {
        if (cancelled) {
          return;
        }

        if (cacheStrategy === "session") {
          window.sessionStorage.setItem(cacheKey, "done");
        }

        setProgress(1);
        setIsReady(true);
        document.body.style.overflow = "";
        markPreloadReady(title, normalizedAssets.length, normalizedBackgroundAssets.length);
        warmAssets(normalizedBackgroundAssets);
      }, PRELOAD_MIN_COLD_REVEAL_MS);

      setProgress(PRELOAD_INITIAL_PROGRESS_FLOOR);
      setIsReady(false);
      document.body.style.overflow = "hidden";

      return () => {
        cancelled = true;
        window.clearTimeout(revealTimer);
        document.body.style.overflow = "";
        document.documentElement.dataset.pagePreloadReady = "false";
      };
    }

    if (cached === "done") {
      setProgress(1);
      setIsReady(true);
      markPreloadReady(title, normalizedAssets.length, normalizedBackgroundAssets.length);
      warmAssets(normalizedBackgroundAssets);
      return;
    }

    let cancelled = false;
    let loadedCount = 0;
    let hasRevealed = false;
    const minimumRevealAt = window.performance.now() + PRELOAD_MIN_COLD_REVEAL_MS;

    setProgress(Math.min(PRELOAD_INITIAL_PROGRESS_FLOOR, 1 / normalizedAssets.length));
    setIsReady(false);
    document.body.style.overflow = "hidden";

    const updateProgress = () => {
      loadedCount += 1;
      if (cancelled) {
        return;
      }

      setProgress(loadedCount / normalizedAssets.length);
    };

    const reveal = () => {
      if (cancelled || hasRevealed) {
        return;
      }

      hasRevealed = true;
      if (cacheStrategy === "session") {
        window.sessionStorage.setItem(cacheKey, "done");
      }
      setProgress(1);
      setIsReady(true);
      document.body.style.overflow = "";
      markPreloadReady(title, normalizedAssets.length, normalizedBackgroundAssets.length);
      warmAssets(normalizedBackgroundAssets);
    };

    const forcedRevealTimer = window.setTimeout(reveal, PRELOAD_MAX_BLOCKING_REVEAL_MS);

    void Promise.all(
      normalizedAssets.map(async (asset) => {
        await preloadImage(asset);
        updateProgress();
      }),
    ).then(() => {
      const wait = Math.max(0, minimumRevealAt - window.performance.now());
      window.setTimeout(() => {
        if (cancelled || hasRevealed) {
          return;
        }

        window.clearTimeout(forcedRevealTimer);
        reveal();
      }, wait);
    });

    return () => {
      cancelled = true;
      window.clearTimeout(forcedRevealTimer);
      document.body.style.overflow = "";
      document.documentElement.dataset.pagePreloadReady = "false";
    };
  }, [cacheKey, cacheStrategy, normalizedAssets, normalizedBackgroundAssets, title]);

  const percentage = Math.round(progress * 100);

  return (
    <>
      <div
        aria-hidden={isReady}
        className={[
          "fixed inset-0 z-[100] bg-white transition-opacity duration-500",
          isReady ? "pointer-events-none opacity-0" : "opacity-100",
        ].join(" ")}
      >
        <div className="mx-auto flex min-h-dvh max-w-[1680px] items-center justify-center px-6 py-10">
          <div className="w-full max-w-[30rem]">
            <div className="flex items-center justify-between gap-4 text-[10px] uppercase tracking-[0.34em] text-black/36">
              <span className="font-sans">YJ TEXLAB</span>
              <span className="font-sans">{String(percentage).padStart(2, "0")}%</span>
            </div>
            <div className="mt-5 space-y-3">
              <p className="font-sans text-[0.82rem] uppercase tracking-[0.24em] text-black/72">
                {title}
              </p>
              <div
                className="h-px w-full bg-black/10"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={percentage}
              >
                <div
                  className="h-px bg-black transition-[width] duration-300 ease-out"
                  style={{ width: `${Math.max(percentage, 3)}%` }}
                />
              </div>
              <p className="max-w-[28rem] font-sans text-[11px] leading-5 tracking-[0.08em] text-black/44">
                {note}
              </p>
            </div>
            <div className="mt-6 flex items-center justify-between gap-4 font-sans text-[10px] uppercase tracking-[0.28em] text-black/28">
              <span>{normalizedAssets.length} assets</span>
              <span>Preparing first view</span>
            </div>
          </div>
        </div>
      </div>

      <div
        className={isReady ? "opacity-100 transition-opacity duration-500" : "opacity-0"}
        aria-hidden={!isReady}
      >
        {children}
      </div>
    </>
  );
}
