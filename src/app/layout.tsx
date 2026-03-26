import type { Metadata } from "next";
import { Montserrat, Lora } from "next/font/google";
import localFont from "next/font/local";
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

export const metadata: Metadata = {
  metadataBase: new URL("https://yjtexlab.com"),
  title: "YJ TexLab",
  description: "60년 전통의 최고급 선염 면원단 전문 기업 YJ TexLab",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "YJ TexLab",
    description: "60년 전통의 최고급 선염 면원단 전문 기업 YJ TexLab",
    url: "https://yjtexlab.com",
    siteName: "YJ TexLab",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${montserrat.variable} ${lora.variable} ${suit.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
