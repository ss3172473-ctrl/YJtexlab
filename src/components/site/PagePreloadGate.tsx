"use client";

import { useEffect, useMemo, useState } from "react";

type PagePreloadGateProps = {
  assets: string[];
  title: string;
  note: string;
  children: React.ReactNode;
  cacheStrategy?: "session" | "none";
};

function preloadImage(src: string) {
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

    window.setTimeout(finish, 12000);
  });
}

export default function PagePreloadGate({
  assets,
  title,
  note,
  children,
  cacheStrategy = "session",
}: PagePreloadGateProps) {
  const normalizedAssets = useMemo(() => Array.from(new Set(assets.filter(Boolean))), [assets]);
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
      return;
    }

    const cached = cacheStrategy === "session" ? window.sessionStorage.getItem(cacheKey) : null;
    if (cached === "done") {
      setProgress(1);
      setIsReady(true);
      return;
    }

    let cancelled = false;
    let loadedCount = 0;
    const minimumRevealAt = window.performance.now() + 420;

    setProgress(0);
    setIsReady(false);
    document.body.style.overflow = "hidden";

    const updateProgress = () => {
      loadedCount += 1;
      if (cancelled) {
        return;
      }

      setProgress(loadedCount / normalizedAssets.length);
    };

    void Promise.all(normalizedAssets.map(async (asset) => {
      await preloadImage(asset);
      updateProgress();
    })).then(() => {
      const wait = Math.max(0, minimumRevealAt - window.performance.now());
      window.setTimeout(() => {
        if (cancelled) {
          return;
        }

        if (cacheStrategy === "session") {
          window.sessionStorage.setItem(cacheKey, "done");
        }
        setProgress(1);
        setIsReady(true);
        document.body.style.overflow = "";
      }, wait);
    });

    return () => {
      cancelled = true;
      document.body.style.overflow = "";
    };
  }, [cacheKey, cacheStrategy, normalizedAssets]);

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
