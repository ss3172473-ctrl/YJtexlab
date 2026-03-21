#!/usr/bin/env node

import fs from "node:fs";
import { readFile, mkdtemp, rm } from "node:fs/promises";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";

const ROOT = process.cwd();
const PAGE_URL = process.env.CORRIDOR_URL ?? null;
const DEV_PORT = Number.parseInt(process.env.CORRIDOR_PORT ?? "", 10);
const DEV_PORT_START = Number.isFinite(DEV_PORT) ? DEV_PORT : 4010;
const CHROME_CANDIDATES = [
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing",
  "/Applications/Chromium.app/Contents/MacOS/Chromium",
];

const MANIFEST_PATH = path.join(ROOT, "public/stage-fabrics/manifest.json");
const CATEGORIES_PATH = path.join(ROOT, "src/components/Categories.tsx");
const PAGE_PATH = path.join(ROOT, "src/app/page.tsx");

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function pickChromeExecutable() {
  for (const candidate of CHROME_CANDIDATES) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  throw new Error(
    `Unable to find a Chrome executable. Looked in: ${CHROME_CANDIDATES.join(", ")}`,
  );
}

function parseJson(text, label) {
  try {
    return JSON.parse(text);
  } catch (error) {
    throw new Error(`Failed to parse ${label}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function readText(filePath) {
  return readFile(filePath, "utf8");
}

async function findOpenPort(startPort) {
  let port = startPort;

  while (true) {
    // Probe with an ephemeral server to avoid starting on a busy port.
    const isFree = await new Promise((resolve) => {
      const server = net.createServer();

      server.once("error", () => resolve(false));
      server.once("listening", () => {
        server.close(() => resolve(true));
      });
      server.listen(port, "127.0.0.1");
    });

    if (isFree) {
      return port;
    }

    port += 1;
  }
}

async function waitForHttp(url, timeoutMs = 120000) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(url, { cache: "no-store" });

      if (response.ok) {
        return response;
      }
    } catch {
      // Retry until the dev server is ready.
    }

    await delay(500);
  }

  throw new Error(`Timed out waiting for ${url}`);
}

async function launchDevServer(port) {
  const child = spawn("npm", ["run", "start", "--", "--port", String(port)], {
    cwd: ROOT,
    stdio: "inherit",
    env: {
      ...process.env,
      ENABLE_CORRIDOR_REVIEW: "true",
      PORT: String(port),
    },
  });

  return child;
}

class CdpClient {
  constructor(webSocket) {
    this.webSocket = webSocket;
    this.nextId = 1;
    this.pending = new Map();

    this.webSocket.addEventListener("message", (event) => {
      const payload = parseJson(String(event.data), "CDP payload");

      if (payload.id) {
        const pending = this.pending.get(payload.id);

        if (!pending) {
          return;
        }

        this.pending.delete(payload.id);

        if (payload.error) {
          pending.reject(new Error(payload.error.message ?? "Unknown CDP error"));
          return;
        }

        pending.resolve(payload.result ?? {});
      }
    });

    this.webSocket.addEventListener("close", () => {
      const error = new Error("CDP websocket closed unexpectedly");

      for (const pending of this.pending.values()) {
        pending.reject(error);
      }

      this.pending.clear();
    });
  }

  static async connect(webSocketUrl) {
    const webSocket = new WebSocket(webSocketUrl);

    await new Promise((resolve, reject) => {
      webSocket.addEventListener("open", resolve, { once: true });
      webSocket.addEventListener(
        "error",
        () => reject(new Error(`Failed to open Chrome websocket: ${webSocketUrl}`)),
        { once: true },
      );
    });

    return new CdpClient(webSocket);
  }

  send(method, params = {}, sessionId) {
    const id = this.nextId;
    this.nextId += 1;

    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.webSocket.send(
        JSON.stringify({
          id,
          method,
          params,
          ...(sessionId ? { sessionId } : {}),
        }),
      );
    });
  }

  async close() {
    if (this.webSocket.readyState === WebSocket.CLOSED) {
      return;
    }

    await new Promise((resolve) => {
      this.webSocket.addEventListener("close", resolve, { once: true });
      this.webSocket.close();
    });
  }
}

async function launchChrome(debugPort) {
  const userDataDir = await mkdtemp(path.join(os.tmpdir(), "corridor-chrome-"));
  const chrome = spawn(
    pickChromeExecutable(),
    [
      "--headless=new",
      "--disable-gpu",
      "--disable-background-timer-throttling",
      "--disable-renderer-backgrounding",
      "--disable-background-networking",
      "--mute-audio",
      "--autoplay-policy=no-user-gesture-required",
      "--no-first-run",
      "--no-default-browser-check",
      `--remote-debugging-port=${debugPort}`,
      `--user-data-dir=${userDataDir}`,
      "about:blank",
    ],
    {
      stdio: "ignore",
    },
  );

  chrome.unref();

  return {
    chrome,
    userDataDir,
  };
}

async function waitForChromeDebugger(debugPort, timeoutMs = 30000) {
  const debuggerUrl = `http://127.0.0.1:${debugPort}/json/version`;
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(debuggerUrl, { cache: "no-store" });

      if (response.ok) {
        const payload = await response.json();

        if (payload.webSocketDebuggerUrl) {
          return payload.webSocketDebuggerUrl;
        }
      }
    } catch {
      // Retry until Chrome exposes the CDP endpoint.
    }

    await delay(250);
  }

  throw new Error("Timed out waiting for Chrome remote debugging endpoint");
}

async function setupPageSession(client, viewport) {
  const { targetId } = await client.send("Target.createTarget", { url: "about:blank" });
  const { sessionId } = await client.send("Target.attachToTarget", {
    targetId,
    flatten: true,
  });

  await client.send("Page.enable", {}, sessionId);
  await client.send("Runtime.enable", {}, sessionId);
  await client.send("DOM.enable", {}, sessionId);
  await client.send("Emulation.setDeviceMetricsOverride", {
    width: viewport.width,
    height: viewport.height,
    deviceScaleFactor: viewport.deviceScaleFactor ?? 1,
    mobile: viewport.mobile ?? false,
    screenWidth: viewport.width,
    screenHeight: viewport.height,
    screenOrientation: {
      type: viewport.mobile ? "portraitPrimary" : "landscapePrimary",
      angle: 0,
    },
  }, sessionId);

  return { sessionId, targetId };
}

async function navigateAndWait(client, sessionId, url) {
  await client.send("Page.navigate", { url }, sessionId);

  const startedAt = Date.now();
  while (Date.now() - startedAt < 120000) {
    const { result } = await client.send(
      "Runtime.evaluate",
      {
        expression: "document.readyState",
        returnByValue: true,
      },
      sessionId,
    );

    if (result?.value === "complete" || result?.value === "interactive") {
      return;
    }

    await delay(250);
  }

  throw new Error(`Timed out waiting for page readiness at ${url}`);
}

async function evalValue(client, sessionId, expression) {
  const response = await client.send(
    "Runtime.evaluate",
    {
      expression,
      returnByValue: true,
      awaitPromise: true,
    },
    sessionId,
  );

  if (response.exceptionDetails) {
    throw new Error(`Page evaluation failed: ${response.exceptionDetails.text ?? "unknown error"}`);
  }

  return response.result?.value;
}

function manifestCounts(manifest) {
  return Object.fromEntries(
    Object.entries(manifest).map(([category, items]) => [category, items.length]),
  );
}

function normalizePageSource(text) {
  return text.replace(/\s+/g, " ");
}

async function auditOwnership() {
  const [categoriesSource, pageSource] = await Promise.all([
    readText(CATEGORIES_PATH),
    readText(PAGE_PATH),
  ]);
  const normalizedCategories = normalizePageSource(categoriesSource);
  const normalizedPage = normalizePageSource(pageSource);

  assert(
    /import FabricVariantCorridor from "@\/components\/fabric-corridor\/FabricVariantCorridor";/.test(
      normalizedCategories,
    ),
    "Categories.tsx must own the fabric corridor mount",
  );
  assert(
    normalizedCategories.includes("resolveCorridorRuntimeConfig"),
    "Categories.tsx should resolve the corridor runtime config",
  );
  assert(
    normalizedCategories.includes("return <FabricVariantCorridor runtimeConfig={runtimeConfig} />;"),
    "Categories.tsx should pass runtimeConfig into FabricVariantCorridor",
  );
  assert(
    !/fabric-corridor\/FabricVariantCorridor/.test(normalizedPage),
    "page.tsx must not import FabricVariantCorridor directly",
  );
  assert(
    /<OriginalLoopVideoHero \/>.*<Categories searchParams=\{resolvedSearchParams\} \/>.*<Partners \/>.*<GlobalPresence \/>.*<Locations \/>/s.test(
      normalizedPage,
    ),
    "page.tsx should preserve hero -> categories -> partners -> presence -> locations order",
  );
  assert(
    !/window\.innerWidth|matchMedia|use client/.test(normalizedPage),
    "page.tsx should stay server-owned and avoid viewport heuristics",
  );
}

async function auditCorridor(client, sessionId, manifest, label, expected) {
  const snapshot = await evalValue(
    client,
    sessionId,
    `(() => {
      const root = document.querySelector('#categories');
      const sections = Array.from(document.querySelectorAll('section[data-variant-shell="true"]')).map((section) => {
        const variant = section.getAttribute('data-variant-id');
        const headings = Array.from(section.querySelectorAll('h3')).map((node) => node.textContent?.trim()).filter(Boolean);
        const images = Array.from(section.querySelectorAll('img[alt]')).map((img) => img.getAttribute('alt')).filter(Boolean);

        return { variant, headings, images };
      });

      return {
        corridorMode: root?.getAttribute('data-corridor-mode') ?? null,
        promotedVariant: root?.getAttribute('data-promoted-variant') ?? null,
        reviewVariant: root?.getAttribute('data-review-variant') ?? null,
        reviewTools: root?.getAttribute('data-review-tools') ?? null,
        sectionCount: sections.length,
        sections,
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight,
        scrollWidth: document.documentElement.scrollWidth,
        scrollHeight: document.documentElement.scrollHeight,
      };
    })()`,
  );

  assert(
    snapshot.corridorMode === expected.mode,
    `[${label}] expected corridor mode ${expected.mode}, got ${snapshot.corridorMode}`,
  );
  assert(
    snapshot.promotedVariant === expected.promotedVariant,
    `[${label}] expected promoted variant ${expected.promotedVariant}, got ${snapshot.promotedVariant}`,
  );
  assert(
    snapshot.reviewVariant === expected.reviewVariant,
    `[${label}] expected review variant ${expected.reviewVariant}, got ${snapshot.reviewVariant}`,
  );
  assert(
    snapshot.reviewTools === String(expected.reviewTools),
    `[${label}] expected review tools ${String(expected.reviewTools)}, got ${snapshot.reviewTools}`,
  );
  assert(
    snapshot.sectionCount === expected.variantIds.length,
    `[${label}] expected ${expected.variantIds.length} corridor variants, got ${snapshot.sectionCount}`,
  );

  const expectedCounts = manifestCounts(manifest);
  const expectedHeadings = ["Checks", "Stripes", "Others"];

  for (const section of snapshot.sections) {
    assert(
      expected.variantIds.includes(section.variant),
      `[${label}] unexpected variant section: ${section.variant}`,
    );

    assert(
      JSON.stringify(section.headings) === JSON.stringify(expectedHeadings),
      `[${label}] variant ${section.variant} headings should be ${expectedHeadings.join(" -> ")}, got ${section.headings.join(" -> ")}`,
    );

    assert(
      section.images.length === expectedCounts.checks + expectedCounts.stripes + expectedCounts.others,
      `[${label}] variant ${section.variant} should render ${expectedCounts.checks + expectedCounts.stripes + expectedCounts.others} fabric images, got ${section.images.length}`,
    );

    const uniqueSources = new Set(section.images);
    assert(
      uniqueSources.size === section.images.length,
      `[${label}] variant ${section.variant} contains duplicate fabric images`,
    );

    for (const [category, items] of Object.entries(manifest)) {
      const count = items.filter((item) => section.images.includes(item.name)).length;

      assert(
        count === items.length,
        `[${label}] variant ${section.variant} is missing ${items.length - count} ${category} fabrics`,
      );

      for (const item of items) {
        const occurrences = section.images.filter((name) => name === item.name).length;

        assert(
          occurrences === 1,
          `[${label}] variant ${section.variant} should include ${item.name} exactly once`,
        );
      }
    }
  }

  return snapshot;
}

async function auditMobileFallback(client, sessionId, manifest) {
  const snapshot = await auditCorridor(client, sessionId, manifest, "mobile", {
    mode: "production",
    promotedVariant: "C",
    reviewVariant: "",
    reviewTools: false,
    variantIds: ["C"],
  });

  assert(
    snapshot.scrollWidth <= snapshot.viewportWidth + 1,
    `mobile corridor should not overflow horizontally: scrollWidth=${snapshot.scrollWidth}, viewportWidth=${snapshot.viewportWidth}`,
  );
}

async function auditHeroAutoplay(client, sessionId) {
  const videoState = await evalValue(
    client,
    sessionId,
    `(() => {
      const video = document.querySelector('video');

      if (!video) {
        return null;
      }

      return {
        paused: video.paused,
        currentTime: video.currentTime,
        readyState: video.readyState,
        networkState: video.networkState,
        muted: video.muted,
        playsInline: video.playsInline,
        src: video.currentSrc || video.getAttribute('src'),
      };
    })()`,
  );

  assert(videoState, "hero video element was not found");

  // Give the autoplay retry loop time to settle before asserting.
  await delay(3000);

  const settledState = await evalValue(
    client,
    sessionId,
    `(() => {
      const video = document.querySelector('video');

      return {
        paused: video?.paused,
        currentTime: video?.currentTime ?? 0,
        readyState: video?.readyState ?? 0,
        networkState: video?.networkState ?? 0,
        muted: video?.muted ?? false,
        playsInline: video?.playsInline ?? false,
        src: video?.currentSrc || video?.getAttribute('src'),
      };
    })()`,
  );

  assert(settledState.muted, "hero video should remain muted");
  assert(settledState.playsInline, "hero video should be inline-friendly");
  assert(settledState.paused === false, "hero video should be playing");
  assert(settledState.currentTime > 0.1, `hero video should have advanced, currentTime=${settledState.currentTime}`);
  assert(settledState.readyState >= 2, `hero video should have at least HAVE_CURRENT_DATA, readyState=${settledState.readyState}`);
}

async function main() {
  const manifest = parseJson(await readText(MANIFEST_PATH), "manifest.json");
  const expectedCounts = manifestCounts(manifest);
  const devPort = await findOpenPort(DEV_PORT_START);
  const baseUrl = PAGE_URL ?? `http://127.0.0.1:${devPort}`;
  const devServer = PAGE_URL ? null : await launchDevServer(devPort);
  const chromeDebugPort = await findOpenPort(9333);
  const chromeUserDataDir = await mkdtemp(path.join(os.tmpdir(), "corridor-verify-"));
  const chrome = spawn(
    pickChromeExecutable(),
    [
      "--headless=new",
      "--disable-gpu",
      "--disable-background-timer-throttling",
      "--disable-renderer-backgrounding",
      "--disable-background-networking",
      "--mute-audio",
      "--autoplay-policy=no-user-gesture-required",
      "--no-first-run",
      "--no-default-browser-check",
      `--remote-debugging-port=${chromeDebugPort}`,
      `--user-data-dir=${chromeUserDataDir}`,
      "about:blank",
    ],
    { stdio: "ignore" },
  );

  chrome.unref();

  const cleanup = async () => {
    if (chrome.exitCode == null) {
      chrome.kill("SIGTERM");
    }

    if (devServer && devServer.exitCode == null) {
      devServer.kill("SIGTERM");
    }

    await rm(chromeUserDataDir, { recursive: true, force: true }).catch(() => {});
  };

  process.on("SIGINT", async () => {
    await cleanup();
    process.exit(130);
  });
  process.on("SIGTERM", async () => {
    await cleanup();
    process.exit(143);
  });

  try {
    await waitForHttp(baseUrl);
    const debuggerUrl = await waitForChromeDebugger(chromeDebugPort);
    const client = await CdpClient.connect(debuggerUrl);

    try {
      await auditOwnership();

      const desktop = await setupPageSession(client, {
        width: 1440,
        height: 900,
        deviceScaleFactor: 1,
        mobile: false,
      });
      await navigateAndWait(client, desktop.sessionId, baseUrl);

      await auditCorridor(client, desktop.sessionId, manifest, "desktop-production", {
        mode: "production",
        promotedVariant: "C",
        reviewVariant: "",
        reviewTools: false,
        variantIds: ["C"],
      });
      await auditHeroAutoplay(client, desktop.sessionId);

      const reviewUrl = `${baseUrl}${baseUrl.includes("?") ? "&" : "?"}mode=review&reviewVariant=B&showReviewTools=true`;
      const reviewDesktop = await setupPageSession(client, {
        width: 1440,
        height: 900,
        deviceScaleFactor: 1,
        mobile: false,
      });
      await navigateAndWait(client, reviewDesktop.sessionId, reviewUrl);
      await auditCorridor(client, reviewDesktop.sessionId, manifest, "desktop-review", {
        mode: "review",
        promotedVariant: "C",
        reviewVariant: "B",
        reviewTools: true,
        variantIds: ["A", "B", "C"],
      });

      const mobile = await setupPageSession(client, {
        width: 390,
        height: 844,
        deviceScaleFactor: 3,
        mobile: true,
      });
      await navigateAndWait(client, mobile.sessionId, baseUrl);
      await auditMobileFallback(client, mobile.sessionId, manifest);

      console.log(
        [
          "corridor verification passed",
          `manifest counts: checks=${expectedCounts.checks}, stripes=${expectedCounts.stripes}, others=${expectedCounts.others}`,
          `base URL: ${baseUrl}`,
        ].join("\n"),
      );
    } finally {
      await client.close().catch(() => {});
    }
  } finally {
    await cleanup();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack ?? error.message : String(error));
  process.exit(1);
});
