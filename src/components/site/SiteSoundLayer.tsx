"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Fragment_Mono } from "next/font/google";
import { useSearchParams } from "next/navigation";

const fragmentMono = Fragment_Mono({
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

const PROMPT_LABEL = "[CLICK FOR SOUND]";
const SOUNDTRACK_SRC = "/audio/home-soundtrack.mp3";
const RESTING_LEVELS = [0.2, 0.24, 0.3, 0.54];
const VISUALIZER_BAR_COLOR = "rgba(103,108,118,0.92)";

type WindowWithWebkitAudio = Window &
  typeof globalThis & {
    webkitAudioContext?: typeof AudioContext;
  };

type CursorPosition = {
  x: number;
  y: number;
};

type PromptSize = {
  width: number;
  height: number;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function isInteractiveTarget(target: EventTarget | null) {
  return target instanceof Element
    ? Boolean(
        target.closest(
          [
            "a",
            "button",
            "input",
            "select",
            "textarea",
            "summary",
            "[role='button']",
            "[role='link']",
            "[data-home-sound-ignore='true']",
          ].join(","),
        ),
      )
    : false;
}

export default function SiteSoundLayer() {
  const searchParams = useSearchParams();
  const promptRef = useRef<HTMLSpanElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const frequencyDataRef = useRef<Uint8Array<ArrayBuffer> | null>(null);

  const [supportsFinePointer, setSupportsFinePointer] = useState(false);
  const [pointerOverInteractive, setPointerOverInteractive] = useState(false);
  const [cursorPosition, setCursorPosition] = useState<CursorPosition | null>(null);
  const [promptSize, setPromptSize] = useState<PromptSize>({
    width: 220,
    height: 32,
  });
  const [isPlaying, setIsPlaying] = useState(false);
  const [levels, setLevels] = useState<number[]>(RESTING_LEVELS);

  const visualizerDescriptionId = useId();
  const verifyMode =
    searchParams.get("verify") === "1" || searchParams.get("freeze") === "1";

  const stopVisualizerLoop = useCallback(() => {
    if (animationFrameRef.current !== null) {
      window.cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    setLevels(RESTING_LEVELS);
  }, []);

  const stopAudio = useCallback(() => {
    const audio = audioRef.current;

    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }

    stopVisualizerLoop();
    setIsPlaying(false);
  }, [stopVisualizerLoop]);

  const ensureAudioGraph = useCallback(() => {
    const audio = audioRef.current;

    if (!audio) {
      return null;
    }

    const AudioContextConstructor =
      window.AudioContext ?? (window as WindowWithWebkitAudio).webkitAudioContext;

    if (!AudioContextConstructor) {
      return null;
    }

    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContextConstructor();
    }

    if (!analyserRef.current) {
      const analyser = audioContextRef.current.createAnalyser();
      analyser.fftSize = 128;
      analyser.smoothingTimeConstant = 0.84;
      analyser.connect(audioContextRef.current.destination);
      analyserRef.current = analyser;
      frequencyDataRef.current = new Uint8Array(
        analyser.frequencyBinCount,
      ) as Uint8Array<ArrayBuffer>;
    }

    if (!sourceRef.current && analyserRef.current) {
      const sourceNode = audioContextRef.current.createMediaElementSource(audio);
      sourceNode.connect(analyserRef.current);
      sourceRef.current = sourceNode;
    }

    return audioContextRef.current;
  }, []);

  const startVisualizerLoop = useCallback(() => {
    const analyser = analyserRef.current;
    const frequencyData = frequencyDataRef.current;

    if (!analyser || !frequencyData) {
      return;
    }

    stopVisualizerLoop();

    const tick = () => {
      analyser.getByteFrequencyData(frequencyData);

      const bandSize = Math.max(
        1,
        Math.floor(frequencyData.length / RESTING_LEVELS.length),
      );

      const nextLevels = RESTING_LEVELS.map((baseLevel, index) => {
        const start = index * bandSize;
        const end =
          index === RESTING_LEVELS.length - 1
            ? frequencyData.length
            : start + bandSize;

        let total = 0;

        for (let cursor = start; cursor < end; cursor += 1) {
          total += frequencyData[cursor];
        }

        const average = total / Math.max(1, end - start);

        return clamp(baseLevel + (average / 255) * 0.62, 0.18, 1);
      });

      setLevels(nextLevels);
      animationFrameRef.current = window.requestAnimationFrame(tick);
    };

    tick();
  }, [stopVisualizerLoop]);

  const startAudio = useCallback(async () => {
    if (verifyMode) {
      return;
    }

    const audio = audioRef.current;

    if (!audio) {
      return;
    }

    try {
      const audioContext = ensureAudioGraph();

      if (audioContext && audioContext.state === "suspended") {
        await audioContext.resume();
      }

      if (audio.paused) {
        await audio.play();
      }

      setIsPlaying(true);
      startVisualizerLoop();
    } catch {
      stopAudio();
    }
  }, [ensureAudioGraph, startVisualizerLoop, stopAudio, verifyMode]);

  const updateCursorPosition = useCallback((clientX: number, clientY: number) => {
    const promptRect = promptRef.current?.getBoundingClientRect();
    const width = promptRect?.width ?? promptSize.width;
    const height = promptRect?.height ?? promptSize.height;

    const nextLeft = clamp(clientX - width - 22, 18, window.innerWidth - width - 18);
    const nextTop = clamp(clientY + 16, 18, window.innerHeight - height - 18);

    setCursorPosition({ x: nextLeft, y: nextTop });
  }, [promptSize.height, promptSize.width]);

  useEffect(() => {
    const query = window.matchMedia("(hover: hover) and (pointer: fine)");
    const sync = () => setSupportsFinePointer(query.matches);

    sync();

    const handleChange = (event: MediaQueryListEvent) => {
      setSupportsFinePointer(event.matches);
    };

    query.addEventListener("change", handleChange);
    return () => query.removeEventListener("change", handleChange);
  }, []);

  useEffect(() => {
    if (!supportsFinePointer || verifyMode) {
      return;
    }

    const updatePromptSize = () => {
      const rect = promptRef.current?.getBoundingClientRect();

      if (!rect) {
        return;
      }

      setPromptSize({
        width: rect.width,
        height: rect.height,
      });
    };

    updatePromptSize();

    const observer =
      typeof ResizeObserver === "undefined" || !promptRef.current
        ? null
        : new ResizeObserver(updatePromptSize);

    if (observer && promptRef.current) {
      observer.observe(promptRef.current);
    }

    window.addEventListener("resize", updatePromptSize);

    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", updatePromptSize);
    };
  }, [supportsFinePointer, verifyMode]);

  useEffect(() => {
    if (!supportsFinePointer || verifyMode || isPlaying) {
      setCursorPosition(null);
      setPointerOverInteractive(false);
      return;
    }

    const handlePointerMove = (event: PointerEvent) => {
      if (event.pointerType && event.pointerType !== "mouse" && event.pointerType !== "pen") {
        return;
      }

      setPointerOverInteractive(isInteractiveTarget(event.target));
      updateCursorPosition(event.clientX, event.clientY);
    };

    const clearPrompt = () => {
      setCursorPosition(null);
      setPointerOverInteractive(false);
    };

    const handleMouseOut = (event: MouseEvent) => {
      if (event.relatedTarget === null) {
        clearPrompt();
      }
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("blur", clearPrompt);
    window.addEventListener("mouseout", handleMouseOut);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("blur", clearPrompt);
      window.removeEventListener("mouseout", handleMouseOut);
    };
  }, [isPlaying, supportsFinePointer, updateCursorPosition, verifyMode]);

  useEffect(() => {
    if (verifyMode || isPlaying) {
      return;
    }

    const handleWindowClick = (event: MouseEvent) => {
      if (event.button !== 0 || isInteractiveTarget(event.target)) {
        return;
      }

      void startAudio();
    };

    window.addEventListener("click", handleWindowClick);
    return () => window.removeEventListener("click", handleWindowClick);
  }, [isPlaying, startAudio, verifyMode]);

  useEffect(() => {
    const audio = audioRef.current;

    if (!audio) {
      return;
    }

    const handleEnded = () => stopAudio();
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => {
      if (audio.currentTime === 0 || audio.ended) {
        setIsPlaying(false);
      }
    };

    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);

    return () => {
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
    };
  }, [stopAudio]);

  useEffect(() => {
    const audio = audioRef.current;

    return () => {
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }

      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current);
      }

      sourceRef.current?.disconnect();
      analyserRef.current?.disconnect();

      if (audioContextRef.current && audioContextRef.current.state !== "closed") {
        void audioContextRef.current.close().catch(() => {});
      }
    };
  }, []);

  const showDesktopPrompt =
    !verifyMode && supportsFinePointer && !pointerOverInteractive && !isPlaying && cursorPosition;
  const showTouchPrompt = !verifyMode && !supportsFinePointer && !isPlaying;

  return (
    <>
      <audio ref={audioRef} preload="none" src={SOUNDTRACK_SRC} />

      {showDesktopPrompt ? (
        <span
          ref={promptRef}
          className={`${fragmentMono.className} pointer-events-none fixed z-30 whitespace-nowrap text-[10px] uppercase tracking-[0.16em] text-neutral-500/95 drop-shadow-[0_4px_12px_rgba(255,255,255,0.16)] transition-opacity duration-150`}
          style={{
            left: `${cursorPosition.x}px`,
            top: `${cursorPosition.y}px`,
          }}
        >
          {PROMPT_LABEL}
        </span>
      ) : null}

      {showTouchPrompt ? (
        <span
          className={`${fragmentMono.className} pointer-events-none fixed bottom-7 left-6 z-30 whitespace-nowrap text-[9px] uppercase tracking-[0.14em] text-neutral-500/95 drop-shadow-[0_4px_12px_rgba(255,255,255,0.16)] md:left-8`}
        >
          {PROMPT_LABEL}
        </span>
      ) : null}

      {isPlaying ? (
        <button
          type="button"
          className="fixed right-6 top-[calc(env(safe-area-inset-top)+5.75rem)] z-40 flex items-end justify-center p-2 transition-transform duration-200 hover:scale-[1.02] md:right-10 md:top-[calc(env(safe-area-inset-top)+7rem)] lg:right-16"
          style={{
            backgroundColor: "transparent",
            border: "0",
            boxShadow: "none",
            backdropFilter: "none",
          }}
          onClick={stopAudio}
          aria-label="Stop soundtrack"
          aria-describedby={visualizerDescriptionId}
          data-home-sound-ignore="true"
          data-home-music-visualizer="active"
        >
          <span id={visualizerDescriptionId} className="sr-only">
            Stop the soundtrack.
          </span>
          <span className="flex items-end gap-[4px]" aria-hidden="true">
            {levels.map((level, index) => (
              <span
                key={`${index}-${level.toFixed(2)}`}
                className="block rounded-full transition-[height,opacity,background-color] duration-75"
                style={{
                  width: "4px",
                  height: `${6 + level * 18}px`,
                  backgroundColor: VISUALIZER_BAR_COLOR,
                  opacity: clamp(0.52 + level * 0.42, 0.52, 0.96),
                }}
              />
            ))}
          </span>
        </button>
      ) : null}
    </>
  );
}
