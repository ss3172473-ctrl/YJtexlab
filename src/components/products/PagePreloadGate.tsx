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
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(17,18,22,0.04),transparent_20%),radial-gradient(circle_at_82%_72%,rgba(17,18,22,0.035),transparent_22%)]" />
        <div className="mx-auto flex min-h-dvh max-w-[1680px] flex-col justify-between px-4 py-8 md:px-8 md:py-10 lg:px-10">
          <div className="flex items-center justify-between gap-6 text-[10px] uppercase tracking-[0.42em] text-black/35">
            <span>YJ TEXLAB</span>
            <span>{String(percentage).padStart(2, "0")}%</span>
          </div>

          <div className="grid gap-8 md:grid-cols-[1.05fr_0.95fr] md:items-end">
            <div className="space-y-4">
              <p className="text-[11px] uppercase tracking-[0.42em] text-black/32">Hard Gate Preload</p>
              <h1 className="max-w-[8ch] font-serif text-[clamp(3.2rem,9vw,8rem)] leading-[0.84] tracking-[-0.08em] text-black">
                {title}
              </h1>
            </div>

            <div className="space-y-6">
              <p className="max-w-[34rem] text-sm leading-7 text-black/56 md:text-base">
                {note}
              </p>
              <div className="space-y-3">
                <div className="h-px w-full bg-black/10" />
                <div
                  className="h-[6px] overflow-hidden rounded-full bg-black/6"
                  role="progressbar"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={percentage}
                >
                  <div
                    className="h-full rounded-full bg-black transition-[width] duration-300 ease-out"
                    style={{ width: `${Math.max(percentage, 4)}%` }}
                  />
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  {Array.from({ length: 10 }, (_, index) => (
                    <span
                      className="h-8 flex-1 border border-black/10 bg-[linear-gradient(180deg,#ffffff_0%,#f6f6f6_100%)]"
                      key={`preload-strip-${index}`}
                      style={{
                        opacity: progress > index / 10 ? 1 : 0.18,
                        transform: `translate3d(0, ${Math.abs(4 - index) * 3}px, 0)`,
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-6 text-[10px] uppercase tracking-[0.42em] text-black/28">
            <span>{normalizedAssets.length} critical assets</span>
            <span>Preparing first view</span>
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
