#!/usr/bin/env node

import process from "node:process";
import { findOpenPort, launchBuiltServer, stopChild, waitForHttp } from "./verify-utils.mjs";

const root = process.cwd();
const failures = [];

function assertIncludes(haystack, needle, message) {
  if (!haystack.includes(needle)) {
    failures.push(message);
  }
}

function assertExcludes(haystack, needle, message) {
  if (haystack.includes(needle)) {
    failures.push(message);
  }
}

const pageExpectations = [
  {
    path: "/",
    title: "<title>YJ TexLab | Premium Yarn-Dyed Cotton Fabrics Since 1962</title>",
    canonical: '<link rel="canonical" href="https://yjtexlab.com"/>',
    description:
      'content="YJ TexLab은 1962년부터 이어진 선염 면원단 전문 기업으로, 서울과 대구 거점을 통해 프리미엄 코튼 패브릭을 공급합니다."',
    shouldIndex: true,
  },
  {
    path: "/products",
    title: "<title>Products | YJ TexLab</title>",
    canonical: '<link rel="canonical" href="https://yjtexlab.com/products"/>',
    description:
      'content="YJ TexLab의 체크, 스트라이프, 기타 프리미엄 면원단 아카이브를 탐색하고 문의로 연결할 수 있는 제품 페이지입니다."',
    shouldIndex: true,
  },
  {
    path: "/about",
    title: "<title>About Us | YJ TexLab</title>",
    canonical: '<link rel="canonical" href="https://yjtexlab.com/about"/>',
    description:
      'content="YJ TexLab의 60년 역사, 선염 중심의 제조 철학, 그리고 프리미엄 면원단 공급 역량을 소개합니다."',
    shouldIndex: true,
  },
  {
    path: "/contact",
    title: "<title>Contact | YJ TexLab</title>",
    canonical: '<link rel="canonical" href="https://yjtexlab.com/contact"/>',
    description:
      'content="YJ TexLab에 원단 문의, 샘플 요청, 협업 제안을 전달할 수 있는 공식 문의 페이지입니다."',
    shouldIndex: true,
  },
  {
    path: "/privacy",
    title: "<title>Privacy Policy | YJ TexLab</title>",
    canonical: '<link rel="canonical" href="https://yjtexlab.com/privacy"/>',
    shouldIndex: false,
  },
];

const port = await findOpenPort(4140);
const server = launchBuiltServer(root, port);

try {
  await waitForHttp(`http://127.0.0.1:${port}/`);

  for (const expectation of pageExpectations) {
    const response = await fetch(`http://127.0.0.1:${port}${expectation.path}`, {
      cache: "no-store",
    });
    const html = await response.text();

    assertIncludes(html, expectation.title, `${expectation.path} is missing the expected title tag.`);
    assertIncludes(
      html,
      expectation.canonical,
      `${expectation.path} is missing the expected canonical URL.`,
    );

    if (expectation.description) {
      assertIncludes(
        html,
        expectation.description,
        `${expectation.path} is missing the expected description.`,
      );
    }

    if (expectation.shouldIndex) {
      assertExcludes(html, 'name="robots" content="noindex"', `${expectation.path} should be indexable.`);
    } else {
      assertIncludes(html, 'name="robots" content="noindex, nofollow"', `${expectation.path} should be noindex.`);
    }
  }

  const homeHtml = await (await fetch(`http://127.0.0.1:${port}/`, { cache: "no-store" })).text();
  assertIncludes(homeHtml, '<html lang="ko">', "Home document should declare lang=\"ko\".");
  assertIncludes(homeHtml, 'property="og:image"', "Home document is missing Open Graph image metadata.");
  assertIncludes(homeHtml, 'name="twitter:image"', "Home document is missing Twitter image metadata.");
  assertIncludes(homeHtml, "application/ld+json", "Home document is missing structured data.");

  const robotsText = await (await fetch(`http://127.0.0.1:${port}/robots.txt`, { cache: "no-store" })).text();
  assertIncludes(robotsText, "User-Agent: *", "robots.txt is missing the default user agent rule.");
  assertIncludes(robotsText, "Disallow: /api/", "robots.txt should disallow /api/.");
  assertIncludes(
    robotsText,
    "Sitemap: https://yjtexlab.com/sitemap.xml",
    "robots.txt is missing the sitemap pointer.",
  );

  const sitemapText = await (await fetch(`http://127.0.0.1:${port}/sitemap.xml`, { cache: "no-store" })).text();
  assertIncludes(sitemapText, "https://yjtexlab.com/", "sitemap.xml is missing the home URL.");
  assertIncludes(sitemapText, "https://yjtexlab.com/products", "sitemap.xml is missing /products.");
  assertIncludes(sitemapText, "https://yjtexlab.com/about", "sitemap.xml is missing /about.");
  assertExcludes(
    sitemapText,
    "https://yjtexlab.com/privacy",
    "sitemap.xml should not include the temporary noindex privacy page.",
  );

  if (failures.length > 0) {
    console.error("SEO verification failed.");
    for (const failure of failures) {
      console.error(`- ${failure}`);
    }
    process.exit(1);
  }

  console.log("SEO verification passed.");
} finally {
  await stopChild(server);
}
