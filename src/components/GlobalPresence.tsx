"use client";

import Image from "next/image";

const destinations = [
  { label: "KOREA (HQ)", top: "36%", left: "83%", align: "center" as const, pulse: true },
  { label: "JAPAN", top: "37%", left: "86%", align: "left" as const },
  { label: "CHINA", top: "34%", left: "77%", align: "right" as const },
  { label: "USA", top: "32%", left: "20%", align: "left" as const },
  { label: "VIETNAM", top: "48%", left: "78%", align: "left" as const },
  { label: "THAILAND", top: "49%", left: "75%", align: "right" as const },
];

export default function GlobalPresence() {
  return (
    <section className="py-24 md:py-32 px-6 md:px-10 bg-white overflow-hidden border-t border-gray-100">
      <div className="max-w-7xl mx-auto relative">
        <h2 className="text-xs tracking-[0.2em] font-sans uppercase text-gray-400 mb-16 text-center">
          Global Presence
        </h2>
        <div className="text-center mb-16">
          <h3 className="text-3xl md:text-5xl lg:text-6xl font-serif text-gray-900">
            Exporting to the World
          </h3>
        </div>

        <div className="relative w-full max-w-5xl mx-auto aspect-[2/1] overflow-hidden rounded-[2rem] bg-white shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(226,232,240,0.75),_rgba(255,255,255,0.94)_56%,_rgba(255,255,255,1)_100%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,_rgba(15,23,42,0.04),_transparent_26%,_transparent_74%,_rgba(15,23,42,0.06))]" />

          {/* Base World Map Image */}
          <Image
            src="/world-map.svg"
            alt="World Map"
            fill
            unoptimized
            className="pointer-events-none object-contain opacity-80 mix-blend-multiply"
            style={{ filter: "grayscale(1) brightness(0.58) contrast(1.55)" }}
          />

          {/* SVG for Flight Paths and Animation */}
          <svg viewBox="0 0 1000 500" className="absolute inset-0 z-10 hidden h-full w-full pointer-events-none md:block">
            <defs>
              <linearGradient id="pathGradient" x1="1" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#000" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#000" stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* Flight Paths */}
            {/* Korea to USA */}
            <path id="path-usa" d="M 830 180 Q 515 50 200 160" fill="none" stroke="url(#pathGradient)" strokeWidth="1.5" strokeDasharray="6,6" className="opacity-60" />
            {/* Korea to Japan */}
            <path id="path-jp" d="M 830 180 Q 845 170 860 185" fill="none" stroke="black" strokeWidth="1.5" strokeDasharray="4,4" className="opacity-30" />
            {/* Korea to China */}
            <path id="path-cn" d="M 830 180 Q 800 160 770 170" fill="none" stroke="black" strokeWidth="1.5" strokeDasharray="4,4" className="opacity-30" />
            {/* Korea to Vietnam */}
            <path id="path-vn" d="M 830 180 Q 795 210 780 240" fill="none" stroke="black" strokeWidth="1.5" strokeDasharray="4,4" className="opacity-30" />
            {/* Korea to Thailand */}
            <path id="path-th" d="M 830 180 Q 760 210 750 245" fill="none" stroke="black" strokeWidth="1.5" strokeDasharray="4,4" className="opacity-30" />

            {/* Animated Airplanes (Tiny right-facing airplane: M -6,-4 L 8,0 L -6,4 L -2,0 Z) pointing forward on the path */}
            <g className="text-black drop-shadow-md">
              <path d="M-6,-4 L8,0 L-6,4 L-2,0 Z" fill="currentColor">
                <animateMotion repeatCount="indefinite" dur="8s" rotate="auto" path="M 830 180 Q 515 50 200 160" />
              </path>
            </g>
            <g className="text-black drop-shadow-md">
              <path d="M-6,-4 L8,0 L-6,4 L-2,0 Z" fill="currentColor">
                <animateMotion repeatCount="indefinite" dur="3s" rotate="auto" path="M 830 180 Q 845 170 860 185" />
              </path>
            </g>
            <g className="text-black drop-shadow-md">
              <path d="M-6,-4 L8,0 L-6,4 L-2,0 Z" fill="currentColor">
                <animateMotion repeatCount="indefinite" dur="2.5s" rotate="auto" path="M 830 180 Q 800 160 770 170" />
              </path>
            </g>
            <g className="text-black drop-shadow-md">
              <path d="M-6,-4 L8,0 L-6,4 L-2,0 Z" fill="currentColor">
                <animateMotion repeatCount="indefinite" dur="5s" rotate="auto" path="M 830 180 Q 795 210 780 240" />
              </path>
            </g>
            <g className="text-black drop-shadow-md">
              <path d="M-6,-4 L8,0 L-6,4 L-2,0 Z" fill="currentColor">
                <animateMotion repeatCount="indefinite" dur="4.5s" rotate="auto" path="M 830 180 Q 760 210 750 245" />
              </path>
            </g>
          </svg>

          {destinations.map((destination) => (
            <div
              key={destination.label}
              className="absolute z-20 hidden cursor-pointer group md:block"
              style={{ top: destination.top, left: destination.left }}
            >
              {destination.pulse ? (
                <div className="absolute -inset-2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 animate-ping rounded-full bg-black/20" />
              ) : null}
              <div
                className={`relative z-10 rounded-full bg-black ${
                  destination.pulse
                    ? "h-2.5 w-2.5 border border-white"
                    : "h-1.5 w-1.5"
                } -translate-x-1/2 -translate-y-1/2`}
              />
              <span
                className={`absolute whitespace-nowrap rounded bg-white/80 px-2 py-0.5 text-[9px] font-bold tracking-widest text-black shadow-sm ${
                  destination.align === "center"
                    ? "left-1/2 top-3 -translate-x-1/2"
                    : destination.align === "right"
                      ? "right-3 top-1/2 -translate-y-1/2"
                      : "left-3 top-1/2 -translate-y-1/2"
                }`}
              >
                {destination.label}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-8 grid grid-cols-2 gap-3 text-center md:hidden">
          {destinations.map((destination) => (
            <div key={`${destination.label}-mobile`} className="rounded-full border border-gray-200 bg-white px-3 py-2 text-[11px] font-semibold tracking-[0.18em] text-gray-700">
              {destination.label}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
