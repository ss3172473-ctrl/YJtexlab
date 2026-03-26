"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { HERO_MEDIA } from "@/lib/hero-media";

function sendVideoDebugEvent(video: HTMLVideoElement, event: string) {
  if (process.env.NODE_ENV !== "development") {
    return;
  }

  const params = new URLSearchParams({
    event,
    paused: String(video.paused),
    readyState: String(video.readyState),
    networkState: String(video.networkState),
    currentTime: video.currentTime.toFixed(3),
    src: video.currentSrc || HERO_MEDIA.videoSrc,
  });

  void fetch(`/api/video-debug?${params.toString()}`, {
    method: "GET",
    cache: "no-store",
    keepalive: true,
  }).catch(() => {});
}

export default function OriginalLoopVideoHero({
  verifyMode = false,
}: {
  verifyMode?: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hasForcedLoadRef = useRef(false);

  useEffect(() => {
    if (verifyMode) {
      return;
    }

    const video = videoRef.current;

    if (!video) {
      return;
    }

    const attemptPlay = (reason: string) => {
      video.defaultMuted = true;
      video.muted = true;
      video.playsInline = true;

      if (
        !hasForcedLoadRef.current &&
        (video.networkState === HTMLMediaElement.NETWORK_NO_SOURCE ||
          video.readyState === HTMLMediaElement.HAVE_NOTHING)
      ) {
        hasForcedLoadRef.current = true;
        video.load();
      }

      sendVideoDebugEvent(video, `attempt:${reason}`);

      if (!video.paused && !video.ended) {
        return;
      }

      void video.play().then(() => {
        sendVideoDebugEvent(video, `play-resolved:${reason}`);
      }).catch(() => {
        sendVideoDebugEvent(video, `play-rejected:${reason}`);
      });
    };

    const handleCanPlay = () => attemptPlay("canplay");
    const handleLoadedData = () => attemptPlay("loadeddata");
    const handlePlaying = () => sendVideoDebugEvent(video, "playing");
    const handlePause = () => {
      sendVideoDebugEvent(video, "pause");

      window.setTimeout(() => {
        if (document.visibilityState === "visible" && video.paused) {
          attemptPlay("pause");
        }
      }, 120);
    };
    const handleError = () => sendVideoDebugEvent(video, "error");
    const handleLoadStart = () => sendVideoDebugEvent(video, "loadstart");
    const handleLoadedMetadata = () => sendVideoDebugEvent(video, "loadedmetadata");
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        attemptPlay("visible");
      }
    };
    const handleFocus = () => attemptPlay("focus");

    video.addEventListener("canplay", handleCanPlay);
    video.addEventListener("loadstart", handleLoadStart);
    video.addEventListener("loadeddata", handleLoadedData);
    video.addEventListener("loadedmetadata", handleLoadedMetadata);
    video.addEventListener("playing", handlePlaying);
    video.addEventListener("pause", handlePause);
    video.addEventListener("error", handleError);
    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("focus", handleFocus);

    const firstTick = window.requestAnimationFrame(() => {
      const secondTick = window.requestAnimationFrame(() => {
        attemptPlay("mount");
      });

      video.dataset.autoplayFrame = String(secondTick);
    });
    const retryInterval = window.setInterval(() => {
      if (document.visibilityState === "visible" && video.paused) {
        attemptPlay("retry");
      }
    }, 1500);
    const retryStopTimeout = window.setTimeout(() => {
      window.clearInterval(retryInterval);
    }, 12000);

    video.dataset.autoplayFrame = String(firstTick);

    return () => {
      const frame = Number(video.dataset.autoplayFrame);

      if (Number.isFinite(frame)) {
        window.cancelAnimationFrame(frame);
      }

      window.clearInterval(retryInterval);
      window.clearTimeout(retryStopTimeout);
      video.removeAttribute("data-autoplay-frame");
      video.removeEventListener("canplay", handleCanPlay);
      video.removeEventListener("loadstart", handleLoadStart);
      video.removeEventListener("loadeddata", handleLoadedData);
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      video.removeEventListener("playing", handlePlaying);
      video.removeEventListener("pause", handlePause);
      video.removeEventListener("error", handleError);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("focus", handleFocus);
    };
  }, [verifyMode]);

  return (
    <section
      className="bg-white pb-4 md:pb-6"
      data-home-section="hero"
      data-hero-media-version={HERO_MEDIA.version}
    >
      <div className="mx-auto max-w-[1680px] px-4 md:px-6 lg:px-10">
        <div
          className={[
            "relative w-full overflow-hidden border border-black/10 bg-black shadow-[0_30px_90px_-42px_rgba(15,23,42,0.32)]",
            HERO_MEDIA.frameBackgroundClassName,
          ].join(" ")}
          style={{ aspectRatio: "16 / 9" }}
        >
          <Image
            src={HERO_MEDIA.posterSrc}
            alt="YJ TexLab homepage hero poster"
            fill
            priority
            sizes="100vw"
            className="absolute inset-0 h-full w-full object-cover"
          />
          {verifyMode ? (
            <Image
              src={HERO_MEDIA.posterSrc}
              alt="YJ TexLab homepage hero frame"
              fill
              priority
              sizes="100vw"
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : (
            <video
              ref={videoRef}
              className="absolute inset-0 h-full w-full object-cover"
              autoPlay
              loop
              muted
              playsInline
              preload="auto"
              poster={HERO_MEDIA.posterSrc}
              src={HERO_MEDIA.videoSrc}
            />
          )}
        </div>
      </div>
    </section>
  );
}
