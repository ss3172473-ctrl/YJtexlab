export const HERO_MEDIA_VERSION = "20260326-1438";

export const HERO_MEDIA = {
  version: HERO_MEDIA_VERSION,
  videoSrc: `/hero/hero-loop-original.mp4?v=${HERO_MEDIA_VERSION}`,
  posterSrc: `/hero/hero-loop-original-poster.png?v=${HERO_MEDIA_VERSION}`,
  frameAspectClassName: "aspect-video",
  frameBackgroundClassName: "bg-[linear-gradient(180deg,#fcfcfc_0%,#ffffff_100%)]",
} as const;
