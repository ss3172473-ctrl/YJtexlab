commit b3327eb8c41ddb6fa3394f6ecd775a1080d30c49
Author: LEE SUNGJUN <leesungjun@SJs-MacBook-Pro.local>
Date:   Thu Nov 26 20:21:03 2026 +0900

    Measure authorized swatch catalog phases without logging request data

diff --git a/src/app/api/swatches/__tests__/routes.test.mjs b/src/app/api/swatches/__tests__/routes.test.mjs
index 736b1ab..49c3c85 100644
--- a/src/app/api/swatches/__tests__/routes.test.mjs
+++ b/src/app/api/swatches/__tests__/routes.test.mjs
@@ -20,7 +20,7 @@ const env = {
   CONTACT_EMAIL_WEBHOOK_SECRET: "isolated-fake-secret",
 };
 
-function load(file, dependencies = {}, testFetch = fetch) {
+function load(file, dependencies = {}, testFetch = fetch, testClock = performance) {
   const exports = {};
   const source = readFileSync(new URL(file, root), "utf8");
   vm.runInNewContext(ts.transpileModule(source, {
@@ -31,6 +31,7 @@ function load(file, dependencies = {}, testFetch = fetch) {
       ? dependencies[name]
       : /^(?:\.\/|\.\.\/)google-credentials$/.test(name) ? googleCredentials : require(name),
     process: { env, cwd: process.cwd },
+    performance: testClock,
     Buffer, Blob, FormData, ReadableStream, Uint8Array, URL, fetch: testFetch, Response, Headers, setTimeout, clearTimeout, AbortController, TextDecoder, TextEncoder,
     console: { error() {}, warn() {} },
   });
@@ -110,7 +111,9 @@ function setup(companies = crmRows, fixtureNotify) {
   const session = load(sessionPath, { "next/server": { NextResponse: {
     json: (body, options) => {
       const cookies = new Map();
-      return { body, ...options, cookies };
+      const headers = { ...options.headers };
+      Object.defineProperty(headers, "set", { value: (name, value) => { headers[name] = value; } });
+      return { body, ...options, headers, cookies };
     },
   } } });
   const activeSession = load("src/app/api/swatches/active-session.ts", { "./sheets": sheets, "./session": session });
@@ -146,6 +149,47 @@ function request(body, token, requestOrigin = origin) {
   };
 }
 
+test("only an authorized successful catalog gets bounded numeric Server-Timing", async () => {
+  let crm = null;
+  let broken = false;
+  let inventoryReads = 0;
+  let t = 0;
+  const { GET } = load("src/app/api/swatches/catalog/route.ts", {
+    "../active-session": { readActiveCompany: async () => crm },
+    "../sheets": { readCatalog: async () => {
+      inventoryReads++;
+      if (broken) throw Error("private fixture error");
+      return { patterns: [{ name: "Private fixture", variants: [{ sku: "S85", price: 4917, rolls: [] }] }] };
+    } },
+    "../design/store": { readSwatchesLayout: async () => undefined },
+    "../design/photos": { withSwatchPhotos: async entries => entries },
+    "../design/drive-list-thumbnails": { listThumbnailUrl: () => undefined },
+    "../price-visibility": load("src/app/api/swatches/price-visibility.ts"),
+    "../session": { json: (body, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "private, no-store" } }) },
+  }, fetch, { now: () => [0, 123.4, 723.6, 733.4, 736.0][t++] ?? 0 });
+  const denied = await GET({});
+  assert.equal(denied.status, 401);
+  assert.equal(denied.headers.has("Server-Timing"), false);
+  assert.equal(inventoryReads, 0);
+
+  crm = { name: "Private fixture", email: "fixture@example.invalid", canViewPrices: false };
+  broken = true;
+  t = 0;
+  const outage = await GET({});
+  assert.equal(outage.status, 503);
+  assert.equal(outage.headers.has("Server-Timing"), false);
+
+  broken = false;
+  t = 0;
+  const success = await GET({});
+  assert.equal(success.status, 200);
+  assert.equal(success.headers.get("Cache-Control"), "private, no-store");
+  assert.equal(success.headers.get("Server-Timing"), "crm;dur=123, data;dur=600, project;dur=10, serialize;dur=3");
+  const client = await success.json();
+  assert.equal(client.patterns[0].variants[0].sku, "S85");
+  assert.doesNotMatch(JSON.stringify(client), /4917|fixture@example/);
+});
+
 test("catalog stays private until a valid active company code is logged", async () => {
   const { routes, reads, writes } = setup();
   assert.equal((await routes.catalog.GET(request())).status, 401);
diff --git a/src/app/api/swatches/catalog/route.ts b/src/app/api/swatches/catalog/route.ts
index 150c9a2..e97e5b2 100644
--- a/src/app/api/swatches/catalog/route.ts
+++ b/src/app/api/swatches/catalog/route.ts
@@ -7,14 +7,21 @@ import { json } from "../session";
 import { customerPatterns } from "../price-visibility";
 import { readActiveCompany } from "../active-session";
 
+function elapsed(started: number, ended: number) {
+  return Math.round(Math.min(60_000, Math.max(0, ended - started)));
+}
+
 export async function GET(request: NextRequest) {
   try {
+    const started = performance.now();
     const company = await readActiveCompany(request);
     if (!company) return json({ error: "고객 코드를 입력해 주세요." }, 401);
+    const authenticated = performance.now();
     const [catalog, layout] = await Promise.all([
       readCatalog(),
       readSwatchesLayout().catch(() => undefined),
     ]);
+    const dataReady = performance.now();
     const patterns = await withSwatchPhotos(catalog.patterns, false).catch(() => catalog.patterns);
     const withThumbnails = patterns.map(pattern => ({
       ...pattern,
@@ -23,12 +30,24 @@ export async function GET(request: NextRequest) {
         listThumb: listThumbnailUrl(variant.sku, variant.image),
       })),
     }));
-    return json({
+    const body = {
       updatedAt: catalog.updatedAt,
       canViewPrices: company.canViewPrices,
       layout,
       patterns: customerPatterns(withThumbnails, company.canViewPrices),
-    });
+    };
+    const projected = performance.now();
+    const response = json(body);
+    const serialized = performance.now();
+    // Authorized success only. The data stage includes the Sheets client,
+    // credentials as needed, the inventory snapshot, and parallel layout read.
+    response.headers.set("Server-Timing", [
+      `crm;dur=${elapsed(started, authenticated)}`,
+      `data;dur=${elapsed(authenticated, dataReady)}`,
+      `project;dur=${elapsed(dataReady, projected)}`,
+      `serialize;dur=${elapsed(projected, serialized)}`,
+    ].join(", "));
+    return response;
   } catch {
     console.error("swatches_catalog_source_unavailable");
     return json({ error: "재고를 불러올 수 없습니다. 잠시 후 다시 시도해 주세요." }, 503);
