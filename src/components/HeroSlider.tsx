"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

const frames = [
  {
    id: "panel-01",
    image: "/hero/generated/fabric-01.webp",
    title: "Sea Glass Patch",
  },
  {
    id: "panel-02",
    image: "/hero/generated/fabric-02.webp",
    title: "Mineral Fold",
  },
  {
    id: "panel-03",
    image: "/hero/generated/fabric-03.webp",
    title: "Natural Grid Weave",
  },
  {
    id: "panel-04",
    image: "/hero/generated/fabric-04.webp",
    title: "Soft Tension",
  },
  {
    id: "panel-05",
    image: "/hero/generated/fabric-05.webp",
    title: "Quiet Surface",
  },
  {
    id: "panel-06",
    image: "/hero/generated/fabric-06.webp",
    title: "Calm Studio Cloth",
  },
  {
    id: "panel-07",
    image: "/hero/generated/fabric-07.webp",
    title: "Thread Relief",
  },
  {
    id: "panel-08",
    image: "/hero/generated/fabric-08.webp",
    title: "Woven Horizon",
  },
];

export default function HeroSlider() {
  const [circleFrame, setCircleFrame] = useState(0);
  const wallFrames = [...frames, ...frames];

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCircleFrame((previous) => (previous + 1) % frames.length);
    }, 320);

    return () => window.clearInterval(timer);
  }, []);

  return (
    <section className="relative overflow-hidden bg-[#f4f0e8]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,transparent_18%,rgba(244,240,232,0.2)_38%,rgba(244,240,232,0.66)_100%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(244,240,232,0.92),rgba(244,240,232,0.06)_16%,rgba(244,240,232,0.06)_84%,rgba(244,240,232,0.9))]" />

      <div className="relative mx-auto flex min-h-[calc(100dvh-5rem)] max-w-[1680px] items-center justify-center px-4 py-8 md:px-6 lg:px-10">
        <div className="grid w-full grid-cols-2 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {wallFrames.map((frame, index) => (
            <div
              key={`${frame.id}-${index}`}
              className="group relative aspect-video overflow-hidden rounded-[1.8rem] border border-black/8 bg-[#ebe6dd] shadow-[0_24px_70px_-36px_rgba(15,23,42,0.26)]"
            >
              <Image
                src={frame.image}
                alt={frame.title}
                fill
                priority={index < 4}
                sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 25vw"
                className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
              />
            </div>
          ))}
        </div>

        <div className="pointer-events-none absolute inset-0 hidden items-center justify-center px-6 md:flex">
          <div className="absolute left-6 top-8 max-w-xs md:left-10 md:top-10">
            <p className="font-sans text-[10px] uppercase tracking-[0.34em] text-black/42 md:text-[11px]">
              Generated Textile Loop
            </p>
            <p className="mt-3 max-w-[18rem] font-sans text-sm leading-6 text-black/58 md:text-[15px]">
              A natural textile image is expanded into a sharp 16:9 wall, while the central
              circle moves faster to keep the loop unified.
            </p>
          </div>

          <div className="relative h-[46vw] w-[46vw] max-h-[31rem] max-w-[31rem] min-h-[16rem] min-w-[16rem] overflow-hidden rounded-full border border-white/85 bg-white/20 shadow-[0_28px_100px_-34px_rgba(15,23,42,0.6)] ring-1 ring-black/8">
            {frames.map((frame, index) => (
              <div
                key={frame.id}
                className={`absolute inset-0 transition-opacity ease-out ${
                  index === circleFrame ? "opacity-100" : "opacity-0"
                }`}
                style={{ transitionDuration: "180ms" }}
              >
                <Image
                  src={frame.image}
                  alt={frame.title}
                  fill
                  priority={index === 0}
                  sizes="(max-width: 1024px) 46vw, 31rem"
                  className="object-cover"
                />
              </div>
            ))}
            <div className="absolute inset-0 rounded-full border-[10px] border-white/55" />
            <div className="absolute inset-x-[16%] bottom-7 rounded-full bg-black/28 px-4 py-3 text-center backdrop-blur-[8px]">
              <p className="font-sans text-[10px] uppercase tracking-[0.3em] text-white/58">
                Fast Inner Loop
              </p>
              <p className="mt-1 font-sans text-sm tracking-[-0.03em] text-white md:text-[15px]">
                {frames[circleFrame].title}
              </p>
            </div>
          </div>

          <div className="absolute bottom-8 right-6 flex gap-2 md:bottom-10 md:right-10">
            {frames.map((frame, index) => (
              <div
                key={`${frame.id}-dot`}
                className={`h-1.5 rounded-full transition-all duration-200 ${
                  index === circleFrame ? "w-12 bg-black" : "w-5 bg-black/20"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
