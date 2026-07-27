import type { Metadata } from "next";

export const siteConfig = {
  name: "YJ TexLab",
  legalName: "YJ TexLab",
  url: "https://yjtexlab.com",
  language: "ko",
  locale: "ko_KR",
  email: "yjtexlab@yjtexlab.com",
  phone: "+82-53-556-4561",
  foundingDate: "1962",
  defaultTitle: "YJ TexLab",
  defaultDescription:
    "YJ TexLab은 1962년부터 프리미엄 선염 면원단을 공급해 온 텍스타일 기업으로, 서울과 대구 거점을 통해 국내외 바이어와 협업합니다.",
  defaultKeywords: [
    "YJ TexLab",
    "선염 면원단",
    "cotton fabric",
    "yarn-dyed fabric",
    "Korea textile supplier",
    "Daegu fabric",
    "premium cotton fabrics",
  ],
} as const;

type PageMetadataOptions = {
  title: string;
  description: string;
  path: string;
  keywords?: string[];
  absoluteTitle?: boolean;
  noIndex?: boolean;
};

export function absoluteUrl(path = "/") {
  return new URL(path, siteConfig.url).toString();
}

export function createPageMetadata({
  title,
  description,
  path,
  keywords = [],
  absoluteTitle = false,
  noIndex = false,
}: PageMetadataOptions): Metadata {
  const mergedKeywords = Array.from(
    new Set([...siteConfig.defaultKeywords, ...keywords]),
  );

  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    keywords: mergedKeywords,
    alternates: {
      canonical: path,
    },
    openGraph: {
      title,
      description,
      url: absoluteUrl(path),
      siteName: siteConfig.name,
      locale: siteConfig.locale,
      type: "website",
      images: [
        {
          url: absoluteUrl("/seo/og-home.png"),
          width: 1440,
          height: 900,
          alt: `${siteConfig.name} social preview`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [absoluteUrl("/seo/og-home.png")],
    },
    robots: noIndex
      ? {
          index: false,
          follow: false,
          googleBot: {
            index: false,
            follow: false,
          },
        }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            "max-image-preview": "large",
            "max-snippet": -1,
            "max-video-preview": -1,
          },
        },
  };
}

export const rootMetadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: siteConfig.defaultTitle,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.defaultDescription,
  applicationName: siteConfig.name,
  referrer: "origin-when-cross-origin",
  keywords: [...siteConfig.defaultKeywords],
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
    shortcut: ["/favicon.svg"],
    apple: ["/favicon.svg"],
  },
  openGraph: {
    title: siteConfig.defaultTitle,
    description: siteConfig.defaultDescription,
    url: siteConfig.url,
    siteName: siteConfig.name,
    locale: siteConfig.locale,
    type: "website",
    images: [
      {
        url: absoluteUrl("/seo/og-home.png"),
        width: 1440,
        height: 900,
        alt: `${siteConfig.name} social preview`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.defaultTitle,
    description: siteConfig.defaultDescription,
    images: [absoluteUrl("/seo/og-home.png")],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  verification: {
    other: {
      "facebook-domain-verification": "vv9sjfr15a555y7dovp17ncd0o68j9",
    },
  },
  category: "textiles",
  creator: siteConfig.name,
  publisher: siteConfig.name,
  manifest: "/manifest.webmanifest",
};

export function createBreadcrumbJsonLd(
  items: Array<{ name: string; path: string }>,
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: siteConfig.name,
  legalName: siteConfig.legalName,
  url: siteConfig.url,
  email: siteConfig.email,
  telephone: siteConfig.phone,
  foundingDate: siteConfig.foundingDate,
  areaServed: ["KR", "JP", "US", "VN", "TH"],
  contactPoint: [
    {
      "@type": "ContactPoint",
      contactType: "sales",
      email: siteConfig.email,
      telephone: siteConfig.phone,
      areaServed: ["KR", "JP", "US", "VN", "TH"],
      availableLanguage: ["ko", "en"],
    },
  ],
};

export const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: siteConfig.name,
  url: siteConfig.url,
  inLanguage: ["ko-KR", "en"],
};

export function createHomePageJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "YJ TexLab Home",
    url: siteConfig.url,
    description: siteConfig.defaultDescription,
    inLanguage: "ko-KR",
    isPartOf: {
      "@type": "WebSite",
      name: siteConfig.name,
      url: siteConfig.url,
    },
  };
}

export function createAboutPageJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    name: "About YJ TexLab",
    url: absoluteUrl("/about"),
    description:
      "YJ TexLab의 60년 역사, 선염 공정 철학, 그리고 브랜드 신뢰의 근거를 소개합니다.",
    inLanguage: "ko-KR",
  };
}

export function createProductsPageJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "YJ TexLab Products",
    url: absoluteUrl("/products"),
    description:
      "YJ TexLab의 체크, 스트라이프, 기타 패브릭 아카이브와 제품 탐색 경험을 제공합니다.",
    inLanguage: "ko-KR",
  };
}

export function createContactPageJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    name: "Contact YJ TexLab",
    url: absoluteUrl("/contact"),
    description:
      "YJ TexLab에 제품 문의와 협업 요청을 전달할 수 있는 공식 연락 페이지입니다.",
    inLanguage: "ko-KR",
  };
}

export function createMilestonesPageJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "YJ TexLab Milestones",
    url: absoluteUrl("/milestones"),
    description:
      "YJ TexLab의 주요 연혁과 브랜드 성장 과정을 정리한 페이지입니다.",
    inLanguage: "ko-KR",
  };
}
