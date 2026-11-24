import type { Metadata } from "next";
import Image from "next/image";
import experience from "./experience.module.css";
import SwatchesAnalytics from "./analytics";
import Swatches from "./swatches";

export const metadata: Metadata = {
  title: "Swatches",
  description: "YJ TexLab 거래처용 원단 컬렉션",
  robots: { index: false, follow: false },
  alternates: { canonical: "/swatches" },
};

export default function SwatchesPage() {
  return (
    <>
      <header className={experience.masthead} aria-label="YJ TexLab Swatches">
        <Image src="/brand/yjtexlab-logo.png" alt="YJ TexLab" width={405} height={200} priority />
      </header>
      <Swatches />
      <SwatchesAnalytics id={process.env.GA4_MEASUREMENT_ID || process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID || ""} />
    </>
  );
}
