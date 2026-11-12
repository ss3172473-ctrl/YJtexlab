import type { Metadata } from "next";
import localFont from "next/font/local";
import { Suspense } from "react";
import SiteSoundLayer from "@/components/site/SiteSoundLayer";
import StructuredData from "@/components/site/StructuredData";
import { organizationJsonLd, rootMetadata, websiteJsonLd } from "@/lib/seo";
import "./globals.css";

const brandLogo = localFont({
  src: "../../public/fonts/Montserrat-Latin-Variable.woff2",
  weight: "700 900",
  style: "normal",
  variable: "--font-logo",
  display: "swap",
});

const suitSans = localFont({
  src: [
    {
      path: "../../public/fonts/SUIT-Regular.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../public/fonts/SUIT-Medium.ttf",
      weight: "500",
      style: "normal",
    },
    {
      path: "../../public/fonts/SUIT-SemiBold.ttf",
      weight: "600",
      style: "normal",
    },
    {
      path: "../../public/fonts/SUIT-Bold.ttf",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-montserrat",
  display: "swap",
});

const suitHeadings = localFont({
  src: [
    {
      path: "../../public/fonts/SUIT-Regular.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../public/fonts/SUIT-Medium.ttf",
      weight: "500",
      style: "normal",
    },
    {
      path: "../../public/fonts/SUIT-SemiBold.ttf",
      weight: "600",
      style: "normal",
    },
    {
      path: "../../public/fonts/SUIT-Bold.ttf",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-lora",
  display: "swap",
});

const suit = localFont({
  src: [
    {
      path: "../../public/fonts/SUIT-Regular.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../public/fonts/SUIT-Medium.ttf",
      weight: "500",
      style: "normal",
    },
    {
      path: "../../public/fonts/SUIT-SemiBold.ttf",
      weight: "600",
      style: "normal",
    },
    {
      path: "../../public/fonts/SUIT-Bold.ttf",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-suit",
  display: "swap",
});

export const metadata: Metadata = rootMetadata;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body
        className={`${brandLogo.variable} ${suitSans.variable} ${suitHeadings.variable} ${suit.variable} font-sans antialiased`}
      >
        <StructuredData data={[organizationJsonLd, websiteJsonLd]} />
        <Suspense fallback={null}>
          <SiteSoundLayer />
        </Suspense>
        {children}
      </body>
    </html>
  );
}
