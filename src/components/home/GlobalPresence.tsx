"use client";

import type { CSSProperties } from "react";

const routeVars = {
  "--scroll-progress": 0.96,
  "--route-progress": 1,
  "--handoff-progress": 0.92,
} as CSSProperties;

function FlightMarker({
  duration,
  motionPath,
  begin = "0s",
}: {
  duration: string;
  motionPath: string;
  begin?: string;
}) {
  return (
    <g className="text-black [filter:drop-shadow(0_5px_9px_rgba(15,23,42,0.16))]">
      <g>
        <path d="M-70,0 L-16,0" stroke="rgba(15,23,42,0.18)" strokeWidth="2.4" strokeLinecap="round" />
        <path d="M-54,0 L-14,0" stroke="rgba(71,85,105,0.16)" strokeWidth="1.7" strokeLinecap="round" />
        <ellipse cx="-30" cy="0" rx="12" ry="2.9" fill="rgba(15,23,42,0.12)" />
        <ellipse cx="-46" cy="0" rx="8" ry="2.1" fill="rgba(71,85,105,0.1)" />
        <ellipse cx="-60" cy="0" rx="4.5" ry="1.4" fill="rgba(148,163,184,0.08)" />
        <animateMotion repeatCount="indefinite" dur={duration} begin={begin} rotate="auto" path={motionPath} />
      </g>
      <path d="M-24,-12 L32,0 L-24,12 L-9,0 Z" fill="currentColor">
        <animateMotion repeatCount="indefinite" dur={duration} begin={begin} rotate="auto" path={motionPath} />
      </path>
    </g>
  );
}

export default function GlobalPresence({
  variant = "section",
  verifyMode = false,
}: {
  variant?: "section" | "panel";
  verifyMode?: boolean;
}) {
  const isPanel = variant === "panel";

  return (
    <section
      className={
        isPanel
          ? "overflow-hidden bg-transparent px-4 py-8 md:px-6 md:py-10"
          : "overflow-hidden border-t border-gray-100 bg-white px-6 py-24 md:px-10 md:py-32"
      }
      data-home-panel-variant={variant}
      data-home-section="global-presence"
    >
      <div className={isPanel ? "relative mx-auto max-w-6xl" : "relative mx-auto max-w-7xl"}>
        <h2 className={isPanel ? "mb-10 text-center text-[11px] font-sans uppercase tracking-[0.22em] text-gray-400" : "mb-16 text-center text-xs font-sans uppercase tracking-[0.2em] text-gray-400"}>
          Global Presence
        </h2>
        <div className={isPanel ? "mb-10 text-center" : "mb-16 text-center"}>
          <h3 className={isPanel ? "font-serif text-[2rem] text-gray-900 md:text-[3rem] lg:text-[4rem]" : "text-3xl font-serif text-gray-900 md:text-5xl lg:text-6xl"}>
            Exporting to the World
          </h3>
        </div>

        <div
          className={
            isPanel
              ? "relative mx-auto aspect-[4378.13/2434.94] w-full max-w-5xl overflow-hidden rounded-[1.65rem] bg-white shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_24px_70px_-48px_rgba(15,23,42,0.16)]"
              : "relative mx-auto aspect-[4378.13/2434.94] w-full max-w-5xl overflow-hidden rounded-[2rem] bg-white shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_28px_90px_-54px_rgba(15,23,42,0.18)]"
          }
          style={{
            ...routeVars,
            transform:
              "translate3d(0, calc((0.5 - var(--scroll-progress)) * 16px), 0) rotateX(calc((0.5 - var(--scroll-progress)) * 9deg)) rotateY(calc((0.5 - var(--scroll-progress)) * -7deg)) scale(calc(0.97 + var(--scroll-progress) * 0.04))",
            transformOrigin: "center center",
          }}
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(226,232,240,0.75),_rgba(255,255,255,0.94)_56%,_rgba(255,255,255,1)_100%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,_rgba(15,23,42,0.04),_transparent_26%,_transparent_74%,_rgba(15,23,42,0.06))]" />
          <div
            className="absolute inset-0 opacity-40 [background-image:linear-gradient(rgba(15,23,42,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.035)_1px,transparent_1px)] [background-size:100%_4rem,4rem_100%] [mask-image:linear-gradient(180deg,transparent,black_14%,black_86%,transparent)]"
            style={{ opacity: "calc(0.12 + var(--scroll-progress) * 0.24)" }}
          />
          <div
            className="pointer-events-none absolute left-[64%] top-[13%] z-10 h-44 w-44 rounded-full bg-[radial-gradient(circle,rgba(164,187,209,0.34),rgba(164,187,209,0))] blur-3xl"
            style={{
              opacity: "calc(0.16 + var(--handoff-progress) * 0.34)",
              transform: "translate3d(0, calc((0.5 - var(--scroll-progress)) * 24px), 0)",
            }}
          />

          <svg
            viewBox="0 0 4378.13 2434.94"
            className="absolute inset-0 z-10 h-full w-full pointer-events-none"
            shapeRendering="geometricPrecision"
            textRendering="geometricPrecision"
          >
            <defs>
              <linearGradient id="pathGradient" x1="1" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0f172a" stopOpacity="0.52" />
                <stop offset="38%" stopColor="#334155" stopOpacity="0.34" />
                <stop offset="100%" stopColor="#000" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="pathCoreGradient" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#0f172a" stopOpacity="0.98" />
                <stop offset="50%" stopColor="#111111" stopOpacity="1" />
                <stop offset="100%" stopColor="#475569" stopOpacity="0.82" />
              </linearGradient>
              <filter id="routeShadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="7" stdDeviation="7" floodColor="#64748b" floodOpacity="0.12" />
                <feDropShadow dx="0" dy="1.5" stdDeviation="1.8" floodColor="#0f172a" floodOpacity="0.18" />
              </filter>
              <filter id="labelLift" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="10" stdDeviation="14" floodColor="#0f172a" floodOpacity="0.1" />
                <feDropShadow dx="0" dy="1" stdDeviation="1.4" floodColor="#ffffff" floodOpacity="0.72" />
              </filter>
            </defs>

            <image
              href="/world-map.svg"
              x="0"
              y="0"
              width="4378.13"
              height="2434.94"
              preserveAspectRatio="none"
              opacity="0.8"
            />

            <path d="M 3594.4447299999997 679.34826 Q 2248.169755 177.6446890000002 901.8947800000001 662.3036800000001" fill="none" stroke="url(#pathGradient)" strokeWidth="5" strokeDasharray="14 14" opacity="0.18" filter="url(#routeShadow)" />
            <path d="M 3594.4447299999997 679.34826 Q 3657.9276149999996 604.4783799999999 3721.4105 674.4783799999999" fill="none" stroke="#111111" strokeWidth="5" strokeDasharray="8 8" opacity="0.12" filter="url(#routeShadow)" />
            <path d="M 3594.4447299999997 679.34826 Q 3434.642985 609.34826 3274.84124 706.1325999999999" fill="none" stroke="#111111" strokeWidth="5" strokeDasharray="8 8" opacity="0.12" filter="url(#routeShadow)" />
            <path d="M 3594.4447299999997 679.34826 Q 3476.23522 609.34826 3358.0257100000003 1010.5001" fill="none" stroke="#111111" strokeWidth="5" strokeDasharray="8 8" opacity="0.12" filter="url(#routeShadow)" />
            <path d="M 3594.4447299999997 679.34826 Q 3445.58831 609.34826 3296.73189 976.4109400000001" fill="none" stroke="#111111" strokeWidth="5" strokeDasharray="8 8" opacity="0.12" filter="url(#routeShadow)" />

            <path d="M 3594.4447299999997 679.34826 Q 2248.169755 177.6446890000002 901.8947800000001 662.3036800000001" fill="none" stroke="#ffffff" strokeWidth="7" strokeLinecap="round" opacity="0.16" />
            <path d="M 3594.4447299999997 679.34826 Q 3657.9276149999996 604.4783799999999 3721.4105 674.4783799999999" fill="none" stroke="#ffffff" strokeWidth="6" strokeLinecap="round" opacity="0.11" />
            <path d="M 3594.4447299999997 679.34826 Q 3434.642985 609.34826 3274.84124 706.1325999999999" fill="none" stroke="#ffffff" strokeWidth="6" strokeLinecap="round" opacity="0.11" />
            <path d="M 3594.4447299999997 679.34826 Q 3476.23522 609.34826 3358.0257100000003 1010.5001" fill="none" stroke="#ffffff" strokeWidth="6" strokeLinecap="round" opacity="0.11" />
            <path d="M 3594.4447299999997 679.34826 Q 3445.58831 609.34826 3296.73189 976.4109400000001" fill="none" stroke="#ffffff" strokeWidth="6" strokeLinecap="round" opacity="0.11" />

            <path
              d="M 3594.4447299999997 679.34826 Q 2248.169755 177.6446890000002 901.8947800000001 662.3036800000001"
              pathLength="1"
              fill="none"
              stroke="url(#pathCoreGradient)"
              strokeWidth="5.6"
              strokeLinecap="round"
              strokeDasharray="1"
              filter="url(#routeShadow)"
              style={{
                strokeDashoffset: "calc(1 - min(1, (var(--route-progress) * 0.9)))",
                opacity: "calc(0.24 + var(--route-progress) * 0.5)",
              }}
            />
            <path
              d="M 3594.4447299999997 679.34826 Q 3657.9276149999996 604.4783799999999 3721.4105 674.4783799999999"
              pathLength="1"
              fill="none"
              stroke="url(#pathCoreGradient)"
              strokeWidth="5.4"
              strokeLinecap="round"
              strokeDasharray="1"
              filter="url(#routeShadow)"
              style={{
                strokeDashoffset: "calc(1 - min(1, (var(--route-progress) * 1)))",
                opacity: "calc(0.22 + var(--route-progress) * 0.5)",
              }}
            />
            <path
              d="M 3594.4447299999997 679.34826 Q 3434.642985 609.34826 3274.84124 706.1325999999999"
              pathLength="1"
              fill="none"
              stroke="url(#pathCoreGradient)"
              strokeWidth="5.4"
              strokeLinecap="round"
              strokeDasharray="1"
              filter="url(#routeShadow)"
              style={{
                strokeDashoffset: "calc(1 - min(1, (var(--route-progress) * 1.1)))",
                opacity: "calc(0.22 + var(--route-progress) * 0.5)",
              }}
            />
            <path
              d="M 3594.4447299999997 679.34826 Q 3476.23522 609.34826 3358.0257100000003 1010.5001"
              pathLength="1"
              fill="none"
              stroke="url(#pathCoreGradient)"
              strokeWidth="5.4"
              strokeLinecap="round"
              strokeDasharray="1"
              filter="url(#routeShadow)"
              style={{
                strokeDashoffset: "calc(1 - min(1, (var(--route-progress) * 1.2)))",
                opacity: "calc(0.22 + var(--route-progress) * 0.5)",
              }}
            />
            <path
              d="M 3594.4447299999997 679.34826 Q 3445.58831 609.34826 3296.73189 976.4109400000001"
              pathLength="1"
              fill="none"
              stroke="url(#pathCoreGradient)"
              strokeWidth="5.4"
              strokeLinecap="round"
              strokeDasharray="1"
              filter="url(#routeShadow)"
              style={{
                strokeDashoffset: "calc(1 - min(1, (var(--route-progress) * 1.3)))",
                opacity: "calc(0.22 + var(--route-progress) * 0.5)",
              }}
            />

            {!verifyMode ? (
              <>
                <FlightMarker duration="7.2s" begin="-2.1s" motionPath="M 3594.4447299999997 679.34826 Q 2248.169755 177.6446890000002 901.8947800000001 662.3036800000001" />
                <FlightMarker duration="7.2s" begin="-5s" motionPath="M 3594.4447299999997 679.34826 Q 2248.169755 177.6446890000002 901.8947800000001 662.3036800000001" />
                <FlightMarker duration="2.8s" begin="-0.9s" motionPath="M 3594.4447299999997 679.34826 Q 3657.9276149999996 604.4783799999999 3721.4105 674.4783799999999" />
                <FlightMarker duration="2.3s" begin="-0.7s" motionPath="M 3594.4447299999997 679.34826 Q 3434.642985 609.34826 3274.84124 706.1325999999999" />
                <FlightMarker duration="4.4s" begin="-1.4s" motionPath="M 3594.4447299999997 679.34826 Q 3476.23522 609.34826 3358.0257100000003 1010.5001" />
                <FlightMarker duration="4s" begin="-1.1s" motionPath="M 3594.4447299999997 679.34826 Q 3445.58831 609.34826 3296.73189 976.4109400000001" />
              </>
            ) : null}

            <g transform="translate(3594.4447299999997 679.34826)">
              {!verifyMode ? (
                <circle r="26" fill="rgba(0,0,0,0.12)">
                  <animate attributeName="r" values="12;26;12" dur="2s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.25;0;0.25" dur="2s" repeatCount="indefinite" />
                </circle>
              ) : null}
              <circle r="12" fill="#111111" stroke="#ffffff" strokeWidth="4" style={{ opacity: "calc(0.24 + var(--route-progress) * 0.76)" }} />
              <g className="hidden lg:block" filter="url(#labelLift)">
                <text x="0" y="35" textAnchor="middle" fontSize="30" fontWeight="700" letterSpacing="0.32em" fill="#000000" style={{ opacity: "1" }}>
                  KOREA (HQ)
                </text>
              </g>
            </g>
            <g transform="translate(3721.4105 674.4783799999999)">
              <circle r="8" fill="#111111" style={{ opacity: "calc(0.24 + var(--route-progress) * 0.76)" }} />
              <g className="hidden lg:block" filter="url(#labelLift)">
                <rect x="28" y="-27" width="164" height="54" rx="18" fill="rgba(255,255,255,0.98)" stroke="rgba(15,23,42,0.08)" strokeWidth="2" />
                <text x="110" y="11" textAnchor="middle" fontSize="30" fontWeight="700" letterSpacing="0.32em" fill="#000000" style={{ opacity: "1" }}>
                  JAPAN
                </text>
              </g>
            </g>
            <g transform="translate(3274.84124 706.1325999999999)">
              <circle r="8" fill="#111111" style={{ opacity: "calc(0.24 + var(--route-progress) * 0.76)" }} />
              <g className="hidden lg:block" filter="url(#labelLift)">
                <rect x="-192" y="-27" width="164" height="54" rx="18" fill="rgba(255,255,255,0.98)" stroke="rgba(15,23,42,0.08)" strokeWidth="2" />
                <text x="-110" y="11" textAnchor="middle" fontSize="30" fontWeight="700" letterSpacing="0.32em" fill="#000000" style={{ opacity: "1" }}>
                  CHINA
                </text>
              </g>
            </g>
            <g transform="translate(901.8947800000001 662.3036800000001)">
              <circle r="8" fill="#111111" style={{ opacity: "calc(0.24 + var(--route-progress) * 0.76)" }} />
              <g className="hidden lg:block" filter="url(#labelLift)">
                <rect x="28" y="-27" width="116" height="54" rx="18" fill="rgba(255,255,255,0.98)" stroke="rgba(15,23,42,0.08)" strokeWidth="2" />
                <text x="86" y="11" textAnchor="middle" fontSize="30" fontWeight="700" letterSpacing="0.32em" fill="#000000" style={{ opacity: "1" }}>
                  USA
                </text>
              </g>
            </g>
            <g transform="translate(3358.0257100000003 1010.5001)">
              <circle r="8" fill="#111111" style={{ opacity: "calc(0.24 + var(--route-progress) * 0.76)" }} />
              <g className="hidden lg:block" filter="url(#labelLift)">
                <rect x="28" y="-27" width="212" height="54" rx="18" fill="rgba(255,255,255,0.98)" stroke="rgba(15,23,42,0.08)" strokeWidth="2" />
                <text x="134" y="11" textAnchor="middle" fontSize="30" fontWeight="700" letterSpacing="0.32em" fill="#000000" style={{ opacity: "1" }}>
                  VIETNAM
                </text>
              </g>
            </g>
            <g transform="translate(3296.73189 976.4109400000001)">
              <circle r="8" fill="#111111" style={{ opacity: "calc(0.24 + var(--route-progress) * 0.76)" }} />
              <g className="hidden lg:block" filter="url(#labelLift)">
                <rect x="-264" y="-27" width="236" height="54" rx="18" fill="rgba(255,255,255,0.98)" stroke="rgba(15,23,42,0.08)" strokeWidth="2" />
                <text x="-146" y="11" textAnchor="middle" fontSize="30" fontWeight="700" letterSpacing="0.32em" fill="#000000" style={{ opacity: "1" }}>
                  THAILAND
                </text>
              </g>
            </g>
          </svg>
        </div>
      </div>
    </section>
  );
}
