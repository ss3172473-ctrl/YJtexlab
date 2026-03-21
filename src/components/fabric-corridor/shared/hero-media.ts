export const HERO_MEDIA_VERSION = "20260319-2106";

export const HERO_MEDIA = {
  version: HERO_MEDIA_VERSION,
  videoSrc: `/hero/homepage-loop-original.mp4?v=${HERO_MEDIA_VERSION}`,
  posterSrc: `/hero/homepage-loop-original-poster.jpg?v=${HERO_MEDIA_VERSION}`,
  frameAspectClassName: "aspect-video",
  frameBackgroundClassName: "bg-[linear-gradient(180deg,#fcfcfc_0%,#ffffff_100%)]",
} as const;
