"use client";

import { useEffect, useMemo, useState } from "react";
import type { PreloadAssetSource } from "@/lib/preload-assets";

type PreloadResult = "success" | "error" | "timeout";
type CompletionStrategy = "all-settled" | "all-successful";
type DomImageProbe = {
  selector: string;
  expectedCount: number;
};

type PagePreloadGateProps = {
  assets: PreloadAssetSource[];
  backgroundAssets?: PreloadAssetSource[];
  domImageProbe?: DomImageProbe;
  title: string;
  note: string;
  children: React.ReactNode;
  cacheStrategy?: "session" | "none";
  completionStrategy?: CompletionStrategy;
};

const HARD_TIMEOUT_MS = 12_000;
const MIN_REVEAL_MS = 420;
const DOM_PROGRESS_SHARE = 0.04;
const DOM_POLL_INTERVAL_MS = 80;

type WindowWithIdleCallback = Window & {
  requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number;
};

function resolvePreloadAsset(asset: PreloadAssetSource) {
  if (typeof asset === "string") {
    return asset;
  }

  if (typeof window === "undefined") {
    return asset.desktopSrc;
  }

  const breakpointPx = asset.breakpointPx ?? 720;
  return window.matchMedia(`(max-width: ${breakpointPx}px)`).matches
    ? asset.mobileSrc
    : asset.desktopSrc;
}

function preloadImage(src: string, timeoutMs = HARD_TIMEOUT_MS) {
  return new Promise<PreloadResult>((resolve) => {
    const image = new Image();
    let settled = false;

    const finish = (result: PreloadResult) => {
      if (settled) {
        return;
      }

      settled = true;
      resolve(result);
    };

    const decodeAndFinish = () => {
      const decodePromise = image.decode?.();
      if (decodePromise) {
        void decodePromise
          .then(() => finish(image.naturalWidth > 0 ? "success" : "error"))
          .catch(() => finish(image.naturalWidth > 0 ? "success" : "error"));
        return;
      }

      finish(image.naturalWidth > 0 ? "success" : "error");
    };

    image.onload = decodeAndFinish;
    image.onerror = () => finish("error");
    image.src = src;

    if (image.complete) {
      if (image.naturalWidth > 0) {
        decodeAndFinish();
      } else {
        finish("error");
      }
      return;
    }

    window.setTimeout(() => finish("timeout"), timeoutMs);
  });
}

async function getImageElementStatus(image: HTMLImageElement): Promise<"success" | "error" | "pending"> {
  if (!image.complete) {
    return "pending";
  }

  if (image.naturalWidth === 0) {
    return "error";
  }

  try {
    await image.decode?.();
  } catch {
    return image.naturalWidth > 0 ? "success" : "error";
  }

  return image.naturalWidth > 0 ? "success" : "error";
}

async function waitForDomImages(
  probe: DomImageProbe,
  timeoutMs = HARD_TIMEOUT_MS,
): Promise<PreloadResult> {
  const deadline = window.performance.now() + timeoutMs;

  while (window.performance.now() < deadline) {
    const images = Array.from(document.querySelectorAll<HTMLImageElement>(probe.selector));

    if (images.length >= probe.expectedCount) {
      const statuses = await Promise.all(images.map((image) => getImageElementStatus(image)));

      if (statuses.every((status) => status === "success")) {
        return "success";
      }

      if (statuses.some((status) => status === "error")) {
        return "error";
      }
    }

    await new Promise((resolve) => window.setTimeout(resolve, DOM_POLL_INTERVAL_MS));
  }

  return "timeout";
}

function warmAssets(assets: string[]) {
  if (assets.length === 0) {
    return;
  }

  const start = () => {
    assets.forEach((asset) => {
      void preloadImage(asset);
    });
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
  domImageProbe,
  title,
  note,
  children,
  cacheStrategy = "session",
  completionStrategy = "all-settled",
}: PagePreloadGateProps) {
  const normalizedAssets = useMemo(
    () => Array.from(new Set(assets.map(resolvePreloadAsset).filter(Boolean))),
    [assets],
  );
  const normalizedBackgroundAssets = useMemo(
    () =>
      Array.from(new Set(backgroundAssets.map(resolvePreloadAsset).filter(Boolean))).filter(
        (asset) => !normalizedAssets.includes(asset),
      ),
    [backgroundAssets, normalizedAssets],
  );
  const domProbeProgressShare = domImageProbe ? DOM_PROGRESS_SHARE : 0;
  const assetProgressShare = 1 - domProbeProgressShare;
  const cacheKey = useMemo(
    () => `yjtex-preload:${title}:${normalizedAssets.length}:${normalizedAssets.join("|")}`,
    [normalizedAssets, title],
  );
  const [progress, setProgress] = useState(normalizedAssets.length === 0 ? 1 : 0);
  const [isReady, setIsReady] = useState(normalizedAssets.length === 0);

  useEffect(() => {
    if (normalizedAssets.length === 0) {
      setProgress(1);
      setIsReady(true);
      warmAssets(normalizedBackgroundAssets);
      return;
    }

    const cached = cacheStrategy === "session" ? window.sessionStorage.getItem(cacheKey) : null;
    if (cached === "done") {
      setProgress(1);
      setIsReady(true);
      warmAssets(normalizedBackgroundAssets);
      return;
    }

    let cancelled = false;
    let finished = false;
    let loadedCount = 0;
    let settledCount = 0;
    let errorCount = 0;
    let timeoutCount = 0;
    let domReady = domImageProbe == null;
    let revealTimeoutId: number | null = null;
    const minimumRevealAt = window.performance.now() + MIN_REVEAL_MS;

    setProgress(0);
    setIsReady(false);
    document.body.style.overflow = "hidden";

    const updateProgress = () => {
      if (cancelled) {
        return;
      }

      const completedCount = completionStrategy === "all-successful" ? loadedCount : settledCount;
      const assetProgress = completedCount / normalizedAssets.length;
      setProgress(assetProgress * assetProgressShare + (domReady ? domProbeProgressShare : 0));
    };

    const finalize = (reason: "success" | "timeout") => {
      if (cancelled || finished) {
        return;
      }

      finished = true;
      window.clearTimeout(hardTimeoutId);
      const wait = Math.max(0, minimumRevealAt - window.performance.now());
      revealTimeoutId = window.setTimeout(() => {
        if (cancelled) {
          return;
        }

        if (reason === "success" && cacheStrategy === "session") {
          window.sessionStorage.setItem(cacheKey, "done");
        }

        if (reason === "success") {
          setProgress(1);
        } else {
          const assetProgress = completionStrategy === "all-successful"
            ? loadedCount / normalizedAssets.length
            : settledCount / normalizedAssets.length;
          setProgress(assetProgress * assetProgressShare + (domReady ? domProbeProgressShare : 0));
        }
        setIsReady(true);
        document.body.style.overflow = "";
        warmAssets(normalizedBackgroundAssets);
      }, wait);
    };

    const hardTimeoutId = window.setTimeout(() => finalize("timeout"), HARD_TIMEOUT_MS);
    const tryFinalizeSuccess = () => {
      const hasBlockingFailures = completionStrategy === "all-successful" && (errorCount > 0 || timeoutCount > 0);
      const assetsReady = completionStrategy === "all-successful"
        ? loadedCount === normalizedAssets.length && !hasBlockingFailures
        : settledCount === normalizedAssets.length;

      if (assetsReady && domReady) {
        finalize("success");
      }
    };

    if (domImageProbe) {
      void waitForDomImages(domImageProbe).then((result) => {
        if (cancelled || finished) {
          return;
        }

        if (result === "success") {
          domReady = true;
          updateProgress();
          tryFinalizeSuccess();
        }
      });
    }

    void Promise.all(normalizedAssets.map(async (asset) => {
      const result = await preloadImage(asset);
      if (cancelled || finished) {
        return;
      }

      settledCount += 1;
      if (result === "success") {
        loadedCount += 1;
      } else if (result === "error") {
        errorCount += 1;
      } else {
        timeoutCount += 1;
      }

      updateProgress();
      tryFinalizeSuccess();
    })).then(() => {
      if (cancelled || finished || completionStrategy !== "all-settled") {
        return;
      }

      tryFinalizeSuccess();
    });

    return () => {
      cancelled = true;
      finished = true;
      window.clearTimeout(hardTimeoutId);
      if (revealTimeoutId !== null) {
        window.clearTimeout(revealTimeoutId);
      }
      document.body.style.overflow = "";
    };
  }, [
    assetProgressShare,
    cacheKey,
    cacheStrategy,
    completionStrategy,
    domImageProbe,
    domProbeProgressShare,
    normalizedAssets,
    normalizedBackgroundAssets,
  ]);

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
        style={{
          opacity: isReady ? 1 : 0,
          visibility: isReady ? "visible" : "hidden",
          transition: "opacity 360ms ease",
        }}
      >
        {children}
      </div>
    </>
  );
}
