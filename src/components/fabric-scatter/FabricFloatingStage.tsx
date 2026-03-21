"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";

import { fabricMotionPresets, type FabricMotionPreset } from "@/components/fabric-scatter/config";

type FabricFloatingStageProps = {
  presets?: FabricMotionPreset[];
  className?: string;
};

type ViewportState = {
  width: number;
  height: number;
};

type PlaneModel = {
  key: string;
  image: string;
  preset: FabricMotionPreset;
  index: number;
  size: number;
  offsetX: number;
  offsetY: number;
  opacity: number;
};

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(Math.max(value, minimum), maximum);
}

function easeInOutCubic(value: number) {
  return value < 0.5 ? 4 * value * value * value : 1 - Math.pow(-2 * value + 2, 3) / 2;
}

function usePrefersReducedMotion() {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => {
      setReducedMotion(media.matches);
    };

    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  return reducedMotion;
}

function useViewportState() {
  const [viewport, setViewport] = useState<ViewportState>({ width: 1440, height: 900 });

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const update = () => {
      setViewport({ width: window.innerWidth, height: window.innerHeight });
    };

    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return viewport;
}

function useStageProgress(sectionRef: React.RefObject<HTMLElement | null>) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    let rafId = 0;

    const update = () => {
      const section = sectionRef.current;
      if (!section) {
        return;
      }

      const rect = section.getBoundingClientRect();
      const viewportHeight = window.innerHeight || 1;
      const total = Math.max(section.offsetHeight - viewportHeight, 1);
      const scrolled = clamp(-rect.top, 0, total);
      setProgress(scrolled / total);
    };

    const requestUpdate = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("scroll", requestUpdate);
      window.removeEventListener("resize", requestUpdate);
    };
  }, [sectionRef]);

  return progress;
}

function buildPlanes(presets: FabricMotionPreset[]): PlaneModel[] {
  return presets.flatMap((preset, presetIndex) =>
    preset.planeImages.map((image, index) => ({
      key: `${preset.id}-${index}`,
      image,
      preset,
      index,
      size: 340 - presetIndex * 18 - index * 12,
      offsetX: (index - 1) * 64 + (presetIndex - 1) * 18,
      offsetY: (index - 1) * 44,
      opacity: 1 - index * 0.12,
    })),
  );
}

function StaticStage({ presets }: { presets: FabricMotionPreset[] }) {
  return (
    <section className="relative overflow-hidden rounded-[2.5rem] border border-black/10 bg-[#f4f0e8] px-5 py-8 shadow-[0_40px_120px_-64px_rgba(15,23,42,0.24)] md:px-8 md:py-10">
      <div className="grid gap-5 lg:grid-cols-3">
        {presets.map((preset) => (
          <article
            key={preset.id}
            className="overflow-hidden rounded-[1.8rem] border bg-white/55 backdrop-blur-sm"
            style={{
              borderColor: preset.palette.border,
              boxShadow: `0 28px 80px -52px ${preset.palette.shadow}, inset 0 1px 0 rgba(255,255,255,0.42)`,
            }}
          >
            <div className="relative aspect-video">
              <Image
                src={preset.image}
                alt={`${preset.title} textile plane`}
                fill
                sizes="(max-width: 1023px) 100vw, 33vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.22),rgba(255,255,255,0.02)_38%,rgba(15,23,42,0.16)_100%)]" />
              <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                <p className="font-sans text-[10px] uppercase tracking-[0.32em] text-white/70">
                  {preset.label}
                </p>
                <h3 className="mt-2 font-serif text-[2rem] leading-none tracking-[-0.04em]">
                  {preset.title}
                </h3>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export default function FabricFloatingStage({
  presets = fabricMotionPresets,
  className = "",
}: FabricFloatingStageProps) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const reducedMotion = usePrefersReducedMotion();
  const viewport = useViewportState();
  const rawProgress = useStageProgress(sectionRef);
  const progress = easeInOutCubic(rawProgress);
  const planes = useMemo(() => buildPlanes(presets), [presets]);

  if (reducedMotion) {
    return <StaticStage presets={presets} />;
  }

  return (
    <section
      ref={sectionRef}
      className={`relative min-h-[260svh] overflow-clip rounded-[2.8rem] border border-black/10 bg-[#f4f0e8] ${className}`.trim()}
    >
      <div className="sticky top-0 h-[100svh] overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.74),rgba(244,240,232,0.94)_38%,#efe8da_100%)]" />
        <div className="absolute inset-x-[8%] top-[9%] h-[20rem] rounded-full bg-white/28 blur-3xl" />
        <div className="absolute inset-x-[16%] bottom-[10%] h-[18rem] rounded-full bg-[#d9d1c0]/44 blur-3xl" />

        <div className="pointer-events-none absolute inset-0">
          {planes.map((plane) => {
            const { preset, index } = plane;
            const depthBoost = 1 + (preset.stage.depth - 1) * 0.9;
            const driftPhase = progress * Math.PI * (1.2 + index * 0.18) + index * 0.65;
            const travelX = viewport.width * (preset.stage.travel.x / 100) * progress;
            const travelY = viewport.height * (preset.stage.travel.y / 100) * progress;
            const driftX = Math.sin(driftPhase) * preset.stage.drift.x;
            const driftY = Math.cos(driftPhase * 0.92) * preset.stage.drift.y;
            const scale =
              preset.stage.scale[0] + (preset.stage.scale[1] - preset.stage.scale[0]) * progress + index * 0.015;
            const rotate = preset.stage.rotate[0] + (preset.stage.rotate[1] - preset.stage.rotate[0]) * progress;
            const parallaxY = (index - 1) * 28 * (1 - progress) + viewport.height * 0.02 * depthBoost;
            const parallaxX = (index - 1) * 18 * (0.25 + progress * 0.55);
            const left = `${preset.stage.anchor.x}%`;
            const top = `${preset.stage.anchor.y}%`;
            const blur = Math.max(0, (1.16 - preset.stage.depth) * 4 + index * 0.45 - progress * 0.9);
            const opacity = clamp(plane.opacity - index * 0.02 + progress * 0.08, 0.36, 1);

            return (
              <article
                key={plane.key}
                className="absolute will-change-transform"
                style={{
                  left,
                  top,
                  width: `${plane.size + viewport.width * 0.06 * depthBoost}px`,
                  transform: `translate(-50%, -50%) translate3d(${plane.offsetX + travelX + driftX + parallaxX}px, ${plane.offsetY + travelY + driftY + parallaxY}px, 0) rotate(${rotate + index * 1.35}deg) scale(${scale})`,
                  opacity,
                  filter: `blur(${blur}px)`,
                  zIndex: Math.round(100 + preset.stage.depth * 20 - index),
                }}
              >
                <div
                  className="relative aspect-[16/10] overflow-hidden rounded-[2rem] border bg-white/48 backdrop-blur-sm"
                  style={{
                    borderColor: preset.palette.border,
                    boxShadow: `0 34px 110px -60px ${preset.palette.shadow}, inset 0 1px 0 rgba(255,255,255,0.42), 0 0 0 1px ${preset.palette.glow}`,
                  }}
                >
                  <Image
                    src={plane.image}
                    alt={`${preset.title} floating fabric plane ${index + 1}`}
                    fill
                    priority={preset.id === "checks" && index === 0}
                    sizes="(max-width: 1023px) 60vw, 28vw"
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.18),rgba(255,255,255,0.02)_36%,rgba(15,23,42,0.14)_100%)]" />
                  {index === 0 ? (
                    <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-5 text-white md:p-6">
                      <div>
                        <p className="font-sans text-[10px] uppercase tracking-[0.32em] text-white/72">
                          {preset.label}
                        </p>
                        <h3 className="mt-2 font-serif text-[2rem] leading-none tracking-[-0.05em] md:text-[2.4rem]">
                          {preset.title}
                        </h3>
                      </div>
                      <p className="max-w-[10rem] text-right font-sans text-[10px] uppercase tracking-[0.28em] text-white/62">
                        Scroll to drift deeper
                      </p>
                    </div>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
