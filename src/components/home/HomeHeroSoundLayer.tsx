"use client";

import OriginalLoopVideoHero from "@/components/home/OriginalLoopVideoHero";

export default function HomeHeroSoundLayer({
  verifyMode = false,
}: {
  verifyMode?: boolean;
}) {
  return <OriginalLoopVideoHero verifyMode={verifyMode} />;
}
