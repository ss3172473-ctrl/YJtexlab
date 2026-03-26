import type { Metadata } from "next";
import { Montserrat, Lora } from "next/font/google";
import localFont from "next/font/local";
import StructuredData from "@/components/site/StructuredData";
import { organizationJsonLd, rootMetadata, websiteJsonLd } from "@/lib/seo";
import "./globals.css";

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  display: "swap",
});

const lora = Lora({
  subsets: ["latin"],
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
      <body className={`${montserrat.variable} ${lora.variable} ${suit.variable} font-sans antialiased`}>
        <StructuredData data={[organizationJsonLd, websiteJsonLd]} />
        {children}
      </body>
    </html>
  );
}
