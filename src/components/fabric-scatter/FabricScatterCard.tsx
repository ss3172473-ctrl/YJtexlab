"use client";

import Image from "next/image";

import FabricScatterCanvas from "@/components/fabric-scatter/FabricScatterCanvas";
import type { FabricMotionPreset } from "@/components/fabric-scatter/config";

type FabricScatterCardProps = {
  preset: FabricMotionPreset;
  showDebugIds: boolean;
};

export default function FabricScatterCard({
  preset,
  showDebugIds,
}: FabricScatterCardProps) {
  return (
    <article
      className="group relative overflow-hidden rounded-[2rem] border shadow-[0_34px_90px_-48px_rgba(15,23,42,0.32)] transition-transform duration-500 ease-out hover:-translate-y-1"
      style={{
        backgroundColor: preset.palette.surface,
        borderColor: preset.palette.border,
        boxShadow: `0 34px 90px -48px rgba(15, 23, 42, 0.32), inset 0 1px 0 rgba(255,255,255,0.34), 0 0 0 1px ${preset.palette.glow}`,
      }}
    >
      <div className="relative aspect-video overflow-hidden">
        <Image
          src={preset.image}
          alt={`${preset.title} fabric master`}
          fill
          priority={preset.id !== "others"}
          sizes="(max-width: 767px) 100vw, (max-width: 1279px) 50vw, 33vw"
          className="object-cover transition-[filter,transform] duration-500 ease-out group-hover:scale-[1.015] group-hover:brightness-[0.84] group-hover:saturate-[0.92]"
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.18),rgba(255,255,255,0.02)_32%,rgba(15,23,42,0.08)_100%)]" />
        <FabricScatterCanvas src={preset.image} preset={preset} showDebugIds={showDebugIds} />

        <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between p-5 md:p-6">
          <div className="rounded-full border border-white/38 bg-black/18 px-3 py-1 backdrop-blur-md">
            <p className="font-sans text-[10px] uppercase tracking-[0.34em] text-white/82">
              {preset.label}
            </p>
          </div>
          <div className="rounded-full border border-white/34 bg-white/16 px-3 py-1 backdrop-blur-md">
            <p className="font-sans text-[10px] uppercase tracking-[0.28em] text-white/82">
              Hover To Disperse
            </p>
          </div>
        </div>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 p-5 md:p-6">
          <div className="max-w-[18rem] rounded-[1.4rem] border border-white/22 bg-black/20 px-4 py-3 backdrop-blur-md">
            <p className="font-sans text-[10px] uppercase tracking-[0.32em] text-white/62">
              {preset.subtitle}
            </p>
            <h3 className="mt-2 font-serif text-2xl tracking-[-0.03em] text-white md:text-[2rem]">
              {preset.title}
            </h3>
          </div>
        </div>
      </div>
    </article>
  );
}
