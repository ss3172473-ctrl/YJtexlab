import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createRequire } from "node:module";
import vm from "node:vm";
import assert from "node:assert/strict";
import { test } from "node:test";
import { gzipSync } from "node:zlib";
import ts from "typescript";

const require = createRequire(import.meta.url);
const root = new URL("../../../../..", import.meta.url);
const env = {
  SWATCHES_SESSION_SECRET: "local-test-only-secret-longer-than-thirty-two",
  GOOGLE_CONTACT_SPREADSHEET_ID: "test-contact-sheet",
  GOOGLE_SERVICE_ACCOUNT_JSON: "{}",
  SWATCHES_INVENTORY_SHEET_ID: "fixture-inventory-sheet",
  SWATCHES_CRM_SHEET_ID: "fixture-crm-sheet",
  CONTACT_EMAIL_WEBHOOK_URL: "https://script.google.com/macros/s/test/exec",
  CONTACT_EMAIL_WEBHOOK_SECRET: "isolated-fake-secret",
};

function load(file, dependencies = {}, testFetch = fetch) {
  const exports = {};
  const source = readFileSync(new URL(file, root), "utf8");
  vm.runInNewContext(ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText, {
    exports,
    require: (name) => Object.hasOwn(dependencies, name)
      ? dependencies[name]
      : /^(?:\.\/|\.\.\/)google-credentials$/.test(name) ? googleCredentials : require(name),
    process: { env, cwd: process.cwd },
    Buffer, URL, fetch: testFetch, Response, Headers, setTimeout, clearTimeout, AbortController, TextDecoder,
    console: { error() {}, warn() {} },
  });
  return exports;
}

const googleCredentials = load("src/app/api/swatches/google-credentials.ts", { "server-only": {} });
const configCodec = load("src/app/api/swatches/design/secret-config.ts");
const loadDrive = (dependencies, testFetch) => load("src/app/api/swatches/design/drive-video.ts", {
  "./secret-config": configCodec, ...dependencies,
}, testFetch);
const packed = (data) => `gzip1:${gzipSync(data).toString("base64url")}`;

const attemptGuard = load("src/app/api/swatches/access/attempt-guard.ts");
const catalog = load("src/app/swatches/catalog.ts");
const codes = load("src/app/swatches/customer-code.ts");
const contact = load("src/lib/contact.ts");
const notification = load("src/lib/contact-notification.ts");
const sessionPath = "src/app/api/swatches/session.ts";
const offDrive = { driveVideo() { throw new Error("unexpected Drive call"); }, hasDriveVideo: false, hasDriveVideoForSku: () => false, hasDriveFrontForSku: () => false, hasDriveReverseForSku: () => false };

const productRows = [
  ["SKU", "패턴 그룹", "Color", "수출가(원/yd)", "혼용률", "inch", "품 명"],
  ["A1", "Pattern A", "Navy", 4200, "C100%", '56"', "면선염"],
  ["A2", "Pattern A", "White", 3900, "C100%", '56"', "면선염"],
  ["B1", "Pattern B", "Mint", "", "C100%", '58"', "모달"],
];
const rollRows = [
  ["SKU", "yd", "상태"],
  ["A1", 92, "보유중"], ["A1", 92, "보유중"], ["A1", 73, "출고완료"],
  ["A2", 0.5, "보유중"], ["B1", 12, "보유중"],
];
const crmRows = [
  ["업체명", "이메일", "고객 코드", "활성 상태", "가격 공개"],
  ["Fixture Company", "buyer@example.invalid", "0358", "활성", "공개"],
  ["Disabled Company", "former@example.invalid", "1458", "비활성"],
];
const origin = "https://catalog.example.invalid";

function setup(companies = crmRows) {
  const market = { products: productRows.map((x) => [...x]), stock: rollRows.map((x) => [...x]) };
  const writes = [];
  const reads = [];
  const emails = [];
  const google = {
    auth: { GoogleAuth: class {} },
    sheets: () => ({
      spreadsheets: { values: {
        batchGet: async ({ ranges }) => {
          reads.push("inventory");
          assert.equal(ranges.length, 2);
          return { data: { valueRanges: [{ values: market.products }, { values: market.stock }] } };
        },
        get: async ({ range }) => {
          assert.equal(range, "'업체현황'");
          reads.push("crm");
          return { data: { values: companies } };
        },
        append: async (request) => {
          writes.push(request);
          return { data: { updates: { updatedRange: "'Inquiries'!A2:F2" } } };
        },
      } },
    }),
  };

  const sheets = load("src/app/api/swatches/sheets.ts", {
    googleapis: { google },
    "@/app/swatches/catalog": catalog,
    "@/app/swatches/customer-code": codes,
    "@/lib/contact": contact,
    "@/lib/contact-notification": {
      ...notification,
      notifyContactRow: async (row) => { emails.push(row); return "sent"; },
    },
  });
  const session = load(sessionPath, { "next/server": { NextResponse: {
    json: (body, options) => {
      const cookies = new Map();
      return { body, ...options, cookies };
    },
  } } });
  const activeSession = load("src/app/api/swatches/active-session.ts", { "./sheets": sheets, "./session": session });
  const routes = Object.fromEntries(["access", "catalog", "inquiry"].map((name) => [
    name, load(`src/app/api/swatches/${name}/route.ts`, {
      "../sheets": sheets,
      "./attempt-guard": attemptGuard,
      "../active-session": activeSession,
      "../price-visibility": load("src/app/api/swatches/price-visibility.ts"),
      "../design/photos": { withSwatchPhotos: async (patterns) => patterns },
      "../design/drive-list-thumbnails": { listThumbnailUrl: () => undefined },
      "../design/store": { readSwatchesLayout: async () => ({ order: [], covers: {}, sizes: {}, rowHeights: {} }) },
      "../session": session,
      "@/app/swatches/catalog": catalog,
    "@/app/swatches/customer-code": codes,
    }),
  ]));
  return { routes, writes, reads, emails, market };
}

const fixtureSession = load(sessionPath);

function request(body, token, requestOrigin = origin) {
  return {
    nextUrl: new URL(origin),
    headers: new Headers({ origin: requestOrigin, ...(token ? { "X-Swatches-Visit": fixtureSession.visitKey(token) } : {}) }),
    body: body === undefined ? null : new Response(JSON.stringify(body)).body,
    cookies: { get: () => token ? { value: token } : undefined },
    json: async () => body,
  };
}

test("catalog stays private until a valid active company code is logged", async () => {
  const { routes, reads, writes } = setup();
  assert.equal((await routes.catalog.GET(request())).status, 401);
  assert.deepEqual(reads, []);
  assert.equal((await routes.access.POST(request({ code: "1458" }))).status, 401);
  assert.equal((await routes.access.POST(request({ code: "0358" }, undefined, "https://other.invalid"))).status, 403);
  assert.deepEqual(writes, []);

  const entered = await routes.access.POST(request({ code: "0358", campaign: "nov26" }));
  const token = entered.cookies.get("yj_swatches");
  assert.equal(entered.status, 200);
  assert.equal(entered.body.welcomeName, "Fixture Company");
  assert.ok(token && token !== "0358");
  assert.equal(typeof writes[0].requestBody.values[0][0], "number");
  assert.equal(writes[0].requestBody.values[0][1], "Fixture Company");
  assert.equal(writes[0].requestBody.values[0][3], "nov26");
  assert.equal((await routes.catalog.GET(request(undefined, token + "x"))).status, 401);

  const listed = await routes.catalog.GET(request(undefined, token));
  assert.equal(listed.status, 200);
  assert.equal(listed.headers["Cache-Control"], "private, no-store");
  assert.equal(listed.body.patterns.length, 2);
  const { variants } = listed.body.patterns[0];
  assert.equal(variants.length, 2);
  assert.equal(variants[0].productName, "면선염");
  assert.equal(variants[0].rolls.length, 2);
  assert.notEqual(variants[0].rolls[0].id, variants[0].rolls[1].id);
  assert.equal(variants[1].rolls[0].yards, 0.5);
  assert.equal(variants[0].image, null);
  assert.ok(!JSON.stringify(listed.body).includes("example.invalid"));
});

test("inquiry checks live prices, stock and duplicates before recording and notifying", async () => {
  const { routes, writes, emails } = setup();
  const entered = await routes.access.POST(request({ code: "0358" }));
  const token = entered.cookies.get("yj_swatches");
  const [item] = [{ id: "A1:92:1", price: 4200 }];
  assert.equal((await routes.inquiry.POST(request({ items: [item] }))).status, 401);
  assert.equal((await routes.inquiry.POST(request({ items: [item, item] }, token))).status, 400);
  assert.equal((await routes.inquiry.POST(request({ items: [{ ...item, price: 3900 }] }, token))).status, 409);
  assert.equal((await routes.inquiry.POST(request({ items: [{ id: "A1:73:1", price: 4200 }] }, token))).status, 409);
  assert.equal(writes.length, 1);
  assert.equal(emails.length, 0);

  const submitted = await routes.inquiry.POST(request({ items: [item, { id: "A2:0.5:1", price: 3900 }] }, token));
  assert.equal(submitted.status, 200);
  assert.equal(submitted.body.sent, true);
  assert.equal(writes.length, 2);
  assert.equal(writes[1].valueInputOption, "RAW");
  const row = writes[1].requestBody.values[0];
  assert.equal(row[2], "buyer@example.invalid");
  assert.match(row[4], /92y × ₩4,200\/y/);
  assert.match(row[4], /원단 합계 ₩388,350 \(배송비 별도\)/);
  assert.equal(row[5], "website/swatches");
  assert.deepEqual(emails, [2]);
});

test("four-character input normalizes only ASCII letters and outer whitespace", () => {
  assert.equal(codes.customerCodeInput(""), "");
  assert.equal(codes.customerCodeInput(" az "), "AZ");
  assert.equal(codes.customerCodeInput("aBcD"), "ABCD");
  for (const [raw, expected] of [["0005", "0005"], [" ab12 ", "AB12"], ["1ab2", "1AB2"], ["0z00", "0Z00"]])
    assert.equal(codes.customerCode(raw), expected);
  for (const raw of ["", "5", "ABCD", "00450", "aB12c", "A B1", "A-12", "ＡB12", "АB12", "AB١2", "ẞ123", "A\u0000B1", " ".repeat(130)+"AB12", 1234, null])
    assert.equal(codes.customerCode(raw), null);
});

test("accepts active mixed and legacy codes, without exposing either in API results", async () => {
  const companies = [...crmRows, ["Mixed Fixture", "mixed@example.invalid", "q9r4", "활성"]];
  const { routes, writes } = setup(companies);
  for (const [value, expected] of [["  Q9r4 ", "Mixed Fixture"], ["0358", "Fixture Company"]]) {
    const entered = await routes.access.POST(request({ code: value }));
    assert.equal(entered.status, 200);
    assert.equal(entered.body.welcomeName, expected);
    const token = entered.cookies.get("yj_swatches");
    assert.equal((await routes.catalog.GET(request(undefined, token))).status, 200);
    assert.doesNotMatch(JSON.stringify(entered.body), /Q9R4|0358/i);
  }
  assert.equal(writes.length, 2);
  assert.doesNotMatch(JSON.stringify(writes), /Q9R4|0358/i);
});

test("prepared mixed codes do not grant access while the CRM row remains inactive", async () => {
  const companies = [...crmRows, ["New Fixture", "new-fixture@example.invalid", "q9r4", ""]];
  const { routes, writes } = setup(companies);
  assert.equal((await routes.access.POST(request({ code: "Q9R4" }))).status, 401);
  assert.equal(writes.length, 0);
  const session = load(sessionPath, { "next/server": {} });
  assert.equal((await routes.catalog.GET(request(undefined, session.createSession("Q9R4")))).status, 401);
});

test("managed-address guard preserves one local budget and recovers after the window", () => {
  const headers = new Headers({
    "x-vercel-forwarded-for": "2001:0db8:0000:0000::1",
    "x-forwarded-for": "192.0.2.34",
    "x-real-ip": "198.51.100.2",
  });
  assert.equal(attemptGuard.accessAttemptSource(headers, true), "2001:db8::1");
  assert.equal(attemptGuard.accessAttemptSource(headers, false), "198.51.100.2");
  headers.set("x-vercel-forwarded-for", "198.51.100.2, 192.0.2.34");
  assert.equal(attemptGuard.accessAttemptSource(headers, true), "unknown");
  let t = 1000;
  const limit = attemptGuard.createAccessAttemptLimiter({ now: () => t, limit: 2, windowMs: 2000, capacity: 1 });
  assert.equal(limit("local-test-source"), 0);
  assert.equal(limit("local-test-source"), 0);
  assert.equal(limit("local-test-source"), 2);
  assert.equal(limit("one-other-source"), 2);
  t = 3000;
  assert.equal(limit("one-other-source"), 0);
});

test("case-colliding active rows fail closed for access and existing sessions", async () => {
  const companies = [...crmRows, ["Fixture One", "one@example.invalid", "a0b2", "활성"],
    ["Fixture Two", "two@example.invalid", "A0B2", "활성"]];
  const { routes, writes } = setup(companies);
  assert.equal((await routes.access.POST(request({ code: "A0b2" }))).status, 401);
  assert.equal(writes.length, 0);
  const session = load(sessionPath, { "next/server": {} });
  assert.equal((await routes.catalog.GET(request(undefined, session.createSession("A0B2")))).status, 401);
});

test("the access backstop runs before JSON or CRM and keeps the existing budget", async () => {
  const { routes, reads } = setup();
  const invalidOrigin = request({ code: "00450" }, undefined, "https://other.example.invalid");
  assert.equal((await routes.access.POST(invalidOrigin)).status, 403);
  for (const value of ["00450", "ABCD", "AB12c"]) {
    assert.equal((await routes.access.POST(request({ code: value }))).status, 401);
  }
  assert.deepEqual(reads, []);
  const oversized = request({ code: "Z".repeat(2048) });
  assert.equal((await routes.access.POST(oversized)).status, 401);
  assert.deepEqual(reads, []);
  assert.equal((await routes.access.POST(request({ code: "9999" }))).status, 401);
  const throttled = await routes.access.POST(request({ code: "0358" }));
  assert.equal(throttled.status, 429);
  assert.ok(Number(throttled.headers["Retry-After"]) > 0);
  assert.deepEqual(reads, ["crm"]);
});

test("a selected SKU streams only its variant, requires a session, and supports browser byte ranges", async () => {
  const folder = mkdtempSync(join(tmpdir(), "yj-swatch-media-test-"));
  mkdirSync(join(folder, "mp4"));
  writeFileSync(join(folder, "mp4", "S86.mp4"), Buffer.from("first-variant-S86"));
  writeFileSync(join(folder, "mp4", "S83.mp4"), Buffer.from("other-variant-S83"));
  env.SWATCHES_APPROVED_MEDIA_DIRECTORY = folder;
  const media = load("src/app/api/swatches/design/media.ts", { googleapis: { google: {} }, "./drive-video": offDrive });
  delete env.SWATCHES_APPROVED_MEDIA_DIRECTORY;

  let authorised = false;
  const { GET } = load("src/app/api/swatches/video/route.ts", {
    "../design/media": media, "../active-session": { hasActiveSession: async () => authorised }, "../session": {
      json: (body, status) => Response.json(body, { status }),
    },
  });
  const request = (sku, range) => ({
    nextUrl: new URL("/api/swatches/video?sku=" + encodeURIComponent(sku), origin),
    headers: new Headers(range ? { Range: range } : {}),
  });
  assert.equal((await GET(request("S86"))).status, 401);
  authorised = true;
  const video = await GET(request("S86"));
  assert.equal(video.headers.get("Content-Type"), "video/mp4");
  assert.equal(await video.text(), "first-variant-S86");
  const r = await GET(request("S83", "bytes=0-4"));
  assert.equal(r.status, 206);
  assert.equal(r.headers.get("Content-Range"), "bytes 0-4/17");
  assert.equal(await r.text(), "other");
  assert.equal((await GET(request("S83", "bytes=99-100"))).status, 416);
  assert.equal((await GET(request("T129"))).status, 404);
  assert.equal((await GET(request("../S86"))).status, 404);
});

test("live session code checks coalesce burst and revoke or fail closed after 15s", async () => {
  const service = load("src/app/api/swatches/active-session.ts", { "./sheets": { readCompanies: async () => [] }, "./session": {} });
  let now = 1, calls = 0;
  let entries = ["active", "duplicate", "duplicate"];
  let offline = false;
  const check = service.createActiveCodeCheck(async () => {
    calls++;
    if (offline) throw new Error("CRM unavailable");
    return entries;
  }, () => now);
  assert.deepEqual(await Promise.all(Array.from({length: 236}, () => check("active"))), Array(236).fill(true));
  assert.equal(calls, 1);
  assert.equal(await check("duplicate"), false);
  entries = [];
  now += 14999;
  assert.equal(await check("active"), true);
  now += 1;
  assert.equal(await check("active"), false);
  assert.equal(calls, 2);
  offline = true;
  now += 15000;
  await assert.rejects(check("active"), /CRM unavailable/);
  await assert.rejects(check("active"), /validation unavailable/);
  assert.equal(calls, 3);
});

test("video never silently falls back to a compressed build bundle", async () => {
  const folder = mkdtempSync(join(tmpdir(), "yj-swatch-original-test-"));
  mkdirSync(join(folder, "mp4"));
  writeFileSync(join(folder, "mp4", "S86.mp4"), Buffer.from("original-S86-byte-stream"));
  env.SWATCHES_BUNDLE_AVAILABLE = "1";
  const photosOnly = load("src/app/api/swatches/design/media.ts", { googleapis: { google: {} }, "./drive-video": offDrive });
  assert.equal((await photosOnly.approvedMedia("mp4", "S86", null)).status, 404);
  env.SWATCHES_ORIGINAL_VIDEO_DIRECTORY = folder;
  const media = load("src/app/api/swatches/design/media.ts", { googleapis: { google: {} }, "./drive-video": offDrive });
  delete env.SWATCHES_ORIGINAL_VIDEO_DIRECTORY;
  delete env.SWATCHES_BUNDLE_AVAILABLE;
  const result = await media.approvedMedia("mp4", "S86", "bytes=0-10");
  assert.equal(result.status, 206);
  assert.equal(await result.text(), "original-S8");
});

test("next uncached catalog read reflects both updated price and available roll count", async () => {
  const { routes, market } = setup();
  const entered = await routes.access.POST(request({ code: "0358" }));
  const req = request(undefined, entered.cookies.get("yj_swatches"));
  const first = await routes.catalog.GET(req);
  assert.equal(first.headers["Cache-Control"], "private, no-store");
  const choose = (res) => res.body.patterns.flatMap((p) => p.variants).find((v) => v.sku === "A1");
  assert.equal(choose(first).price, 4200);
  assert.equal(choose(first).rolls.length, 2);
  market.products[1][3] = 4750;
  market.stock[2][2] = "출고완료";
  const next = await routes.catalog.GET(req);
  assert.equal(choose(next).price, 4750);
  assert.equal(choose(next).rolls.length, 1);
});

test("known stock finishing is not labelled as a fiber, and widths retain inches", () => {
  const { localizedFabricSpecs } = load("src/app/swatches/specifications.ts");
  const zh = localizedFabricSpecs("우라기리 실크가공 C100%", '58"', "zh-CN");
  assert.equal(zh.composition, "100%棉");
  assert.equal(zh.finishing, "剪花织法（Uragiri） · 仿丝整理");
  assert.equal(zh.width, "58 英寸");
  const en = localizedFabricSpecs("C97 P방적3%", '44"', "en");
  assert.equal(en.composition, "97% cotton / 3% spun polyester");
  assert.equal(en.width, "44 in");
  assert.equal(localizedFabricSpecs("M C P", "", "en").composition, "M C P");
});

test("reverse texture route allows actual configured samples only", async () => {
  const path = mkdtempSync(join(tmpdir(), "yj-swatch-reverse-test-"));
  mkdirSync(join(path, "webp"));
  writeFileSync(join(path, "webp", "S74.webp"), "relative-evidence");
  writeFileSync(join(path, "webp", "S69.webp"), "unexpected-sku");
  env.SWATCHES_REVERSE_TEXTURE_DIRECTORY = path;
  env.SWATCHES_LOCAL_REVERSE_SKUS = "S74";
  const storage = load("src/app/api/swatches/design/reverse-textures.ts", { "./drive-video": offDrive });
  delete env.SWATCHES_REVERSE_TEXTURE_DIRECTORY;
  delete env.SWATCHES_LOCAL_REVERSE_SKUS;
  const response = await storage.readReverseTexture("S74");
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("Content-Type"), "image/webp");
  assert.equal(response.headers.get("Cache-Control"), "private, no-store");
  assert.equal(await response.text(), "relative-evidence");
  for (const sku of ["S69","S75","../S74","T91"]) assert.equal((await storage.readReverseTexture(sku)).status, 404);
});

const fakeDriveFolder = "mock-folder-000";
const fakeDriveFile = "mock-file-S86";
const fakeDriveData = "0123456789ABCDEF";
const fakeMd5 = "be45cb2605bf36bebde684841a28f0fd";
const fakeManifestEntry = { sku: "S86", fileId: fakeDriveFile, bytes: fakeDriveData.length, md5: fakeMd5 };
const fakeManifest = JSON.stringify({ version: 1, assets: [fakeManifestEntry] });
const fakeMetadata = {
  id: fakeDriveFile, name: "S86.mp4", parents: [fakeDriveFolder], mimeType: "video/mp4",
  size: String(fakeDriveData.length), md5Checksum: fakeMd5, trashed: false,
  capabilities: { canDownload: true },
};

function driveSetup({ manifest = fakeManifest, metadata = fakeMetadata, badRange = false, refusal = false, userOauth = false } = {}) {
  const calls = [];
  const tokens = [];
  const GoogleAuth = class {
    constructor(config) {
      assert.deepEqual(Array.from(config.scopes), ["https://www.googleapis.com/auth/drive.readonly"]);
      assert.equal(config.credentials.client_email, "unprivileged@example.invalid");
      assert.equal(config.credentials.private_key, "isolated-test-string");
    }
    async getAccessToken() { tokens.push("minted"); return "fake-drive-token"; }
  };
  const testFetch = async (url, opts) => {
    calls.push({ url, opts });
    assert.equal(url.origin, "https://www.googleapis.com");
    assert.equal(url.pathname, "/drive/v3/files/" + fakeDriveFile);
    assert.equal(url.searchParams.get("supportsAllDrives"), "true");
    assert.equal(opts.headers.Authorization, "Bearer fake-drive-token");
    assert.equal(opts.cache, "no-store");
    assert.equal(opts.redirect, "error");
    if (refusal) return new Response("secret upstream body", { status: 429 });
    if (url.searchParams.get("alt") !== "media") return Response.json(metadata);
    if (!opts.headers.Range) return new Response(fakeDriveData, { headers: { "Content-Length": "16" } });
    const [, from, to] = /^bytes=(\d+)-(\d+)$/.exec(opts.headers.Range);
    const expected = fakeDriveData.slice(Number(from), Number(to) + 1);
    return new Response(expected, {
      status: 206,
      headers: { "Content-Range": badRange ? "bytes 0-1/99" : `bytes ${from}-${to}/16`, "Content-Length": String(expected.length) },
    });
  };
  env.SWATCHES_DRIVE_VIDEO_FOLDER_ID = fakeDriveFolder;
  env.SWATCHES_DRIVE_VIDEO_MANIFEST = manifest;
  // Auth is lazy: the mock loader deliberately keeps the fixture alive for each test call.
  env.GOOGLE_SERVICE_ACCOUNT_JSON = JSON.stringify({
    type: userOauth ? "authorized_user" : "service_account",
    client_email: "unprivileged@example.invalid", private_key: "isolated-test-string",
  });
  const drive = loadDrive({ googleapis: { google: { auth: { GoogleAuth } } } }, testFetch);
  delete env.SWATCHES_DRIVE_VIDEO_FOLDER_ID;
  delete env.SWATCHES_DRIVE_VIDEO_MANIFEST;
  const media = load("src/app/api/swatches/design/media.ts", {
    googleapis: { google: {} }, "./drive-video": drive,
  });
  return { calls, tokens, drive, media };
}

test("private Drive video forwards only a pinned approved SKU/Range, never an OAuth token or file ID", async () => {
  const previous = env.GOOGLE_SERVICE_ACCOUNT_JSON;
  try {
    const { calls, tokens, media } = driveSetup();
    let authorised = false;
    const { GET } = load("src/app/api/swatches/video/route.ts", {
      "../design/media": media, "../active-session": { hasActiveSession: async () => authorised }, "../session": {
        json: (body, status) => Response.json(body, { status }),
      },
    });
    const signal = new AbortController().signal;
    const request = (sku, range, ifRange) => ({
      nextUrl: new URL("/api/swatches/video?sku=" + encodeURIComponent(sku) + "&fileId=untrusted-must-be-ignored", origin),
      headers: new Headers({ ...(range ? { Range: range } : {}), ...(ifRange ? { "If-Range": ifRange } : {}) }),
      signal,
    });
    assert.equal((await GET(request("S86", "bytes=2-5"))).status, 401);
    assert.equal(calls.length, 0);
    assert.equal(tokens.length, 0);
    authorised = true;
    assert.equal((await GET(request("T118"))).status, 404);
    assert.equal((await GET(request(fakeDriveFile))).status, 404);
    assert.equal(media.hasOriginalSwatchVideoForSku("S86"), true);
    assert.equal(media.hasOriginalSwatchVideoForSku("T118"), false);
    for (const raw of ["bytes=16-", "bytes=-0", "bytes=4-3", "bytes=2-3,5-6", "bytes=9999999999999999-", "garbage", "bytes=-"]) {
      const fail = await GET(request("S86", raw));
      assert.equal(fail.status, 416);
      assert.equal(fail.headers.get("Content-Range"), "bytes */16");
    }
    assert.equal(calls.length, 0);

    const full = await GET(request("S86"));
    assert.equal(full.status, 200);
    assert.equal(await full.text(), fakeDriveData);
    assert.equal(full.headers.get("Content-Length"), "16");
    assert.equal(full.headers.get("Content-Range"), null);
    const partial = await GET(request("S86", "bytes=2-5"));
    assert.equal(partial.status, 206);
    assert.equal(partial.headers.get("Content-Range"), "bytes 2-5/16");
    assert.equal(partial.headers.get("Content-Length"), "4");
    assert.equal(partial.headers.get("Cache-Control"), "private, no-store, no-transform");
    assert.equal(partial.headers.get("Content-Type"), "video/mp4");
    assert.equal(partial.headers.get("Accept-Ranges"), "bytes");
    assert.match(partial.headers.get("X-Robots-Tag"), /noindex/);
    assert.equal(await partial.text(), "2345");
    assert.doesNotMatch(JSON.stringify([...partial.headers.entries()]), /mock-file|fake-drive-token|location/);
    assert.equal(calls.at(-1).opts.signal, signal);
    const tail = await GET(request("S86", "bytes=-2"));
    assert.equal(tail.status, 206);
    assert.equal(tail.headers.get("Content-Range"), "bytes 14-15/16");
    assert.equal(await tail.text(), "EF");
    const open = await GET(request("S86", "bytes=13-"));
    assert.equal(open.status, 206);
    assert.equal(await open.text(), "DEF");
    const clamped = await GET(request("S86", "bytes=13-99999", full.headers.get("ETag")));
    assert.equal(clamped.status, 206);
    assert.equal(await clamped.text(), "DEF");
    const changed = await GET(request("S86", "bytes=13-", '"different"'));
    assert.equal(changed.status, 200);
    assert.equal(await changed.text(), fakeDriveData);
    for (const [idx, { url }] of calls.entries()) assert.equal(url.searchParams.has("alt"), Boolean(idx % 2));
  } finally { env.GOOGLE_SERVICE_ACCOUNT_JSON = previous; }
});

test("Drive manifest rejects duplicates and unsafe values without disturbing local/GCS source selection", async () => {
  const previous = env.GOOGLE_SERVICE_ACCOUNT_JSON;
  try {
    const { calls, drive } = driveSetup({ manifest: "not-json" });
    assert.equal(drive.hasDriveVideo, false);
    assert.equal(calls.length, 0);
    const parse = (assets) => drive.parseDriveVideoConfig(fakeDriveFolder, JSON.stringify({ version: 1, assets }));
    assert.ok(parse([fakeManifestEntry]));
    for (const prohibited of [
      [{ ...fakeManifestEntry, fileId: fakeDriveFolder }],
      [{ ...fakeManifestEntry, fileId: "https://drive.google.com/xyz" }],
      [{ ...fakeManifestEntry, sku: "S109" }],
      [{ ...fakeManifestEntry, bytes: 1e20 }],
      [{ ...fakeManifestEntry, md5: "not-a-checksum" }],
      [{ ...fakeManifestEntry, scope: "unexpected" }],
      [fakeManifestEntry, { ...fakeManifestEntry, sku: "S85" }],
      [fakeManifestEntry, { ...fakeManifestEntry, fileId: "mock-other-file" }],
    ]) assert.equal(parse(prohibited), undefined);
  } finally { env.GOOGLE_SERVICE_ACCOUNT_JSON = previous; }
});

test("Drive denies unexpected folder/bytes/type, download restrictions, user OAuth and malformed upstream ranges", async () => {
  const previous = env.GOOGLE_SERVICE_ACCOUNT_JSON;
  try {
    for (const metadata of [
      { ...fakeMetadata, parents: ["elsewhere"] },
      { ...fakeMetadata, md5Checksum: "updated-in-drive" },
      { ...fakeMetadata, name: "S85.mp4" },
      { ...fakeMetadata, mimeType: "application/vnd.google-apps.shortcut" },
      { ...fakeMetadata, capabilities: { canDownload: false } },
    ]) {
      const { calls, media } = driveSetup({ metadata });
      assert.equal((await media.approvedMedia("mp4", "S86", null)).status, 404);
      assert.equal(calls.length, 1);
    }
    for (const scenario of [{ badRange: true }, { refusal: true }, { userOauth: true }]) {
      const { calls, media } = driveSetup(scenario);
      const fail = await media.approvedMedia("mp4", "S86", "bytes=2-3");
      assert.equal(fail.status, 503);
      assert.equal(await fail.text(), "");
      if (scenario.badRange) assert.equal(calls.length, 2);
      if (scenario.userOauth) assert.equal(calls.length, 0);
    }
  } finally { env.GOOGLE_SERVICE_ACCOUNT_JSON = previous; }
});

test("Drive is opt-in for matching MP4s only and leaves local video and GCS reads intact", async () => {
  const previous = env.GOOGLE_SERVICE_ACCOUNT_JSON;
  try {
    const { calls, drive } = driveSetup();
    const folder = mkdtempSync(join(tmpdir(), "yj-swatch-drive-priority-test-"));
    mkdirSync(join(folder, "mp4"));
    writeFileSync(join(folder, "mp4", "S86.mp4"), Buffer.from("local-approval-priority"));
    env.SWATCHES_ORIGINAL_VIDEO_DIRECTORY = folder;
    const localMedia = load("src/app/api/swatches/design/media.ts", {
      googleapis: { google: {} }, "./drive-video": drive,
    });
    delete env.SWATCHES_ORIGINAL_VIDEO_DIRECTORY;
    assert.equal(await (await localMedia.approvedMedia("mp4", "S86", null)).text(), "local-approval-priority");
    assert.equal(calls.length, 0);

    env.SWATCHES_MEDIA_BUCKET = "mock-gcs-bucket";
    const gcsCalls = [];
    const gcsMedia = load("src/app/api/swatches/design/media.ts", {
      googleapis: { google: { auth: { GoogleAuth: class {
        constructor(config) { assert.deepEqual(Array.from(config.scopes), ["https://www.googleapis.com/auth/devstorage.read_only"]); }
        async getAccessToken() { return "fake-gcs-token"; }
      } } } },
      "./drive-video": drive,
    }, async (url, options) => {
      gcsCalls.push([decodeURIComponent(url), options.headers.Authorization]);
      assert.equal(options.cache, "no-store");
      return new Response("gcs-approval");
    });
    delete env.SWATCHES_MEDIA_BUCKET;
    assert.equal(await (await gcsMedia.approvedMedia("png", "S86", null)).text(), "gcs-approval");
    assert.equal(await (await gcsMedia.approvedMedia("mp4", "T118", null)).text(), "gcs-approval");
    assert.ok(gcsCalls[0][0].includes("/approved-236-v1/png/S86.png?alt=media"));
    assert.ok(gcsCalls[1][0].includes("/approved-236-v1/mp4/T118.mp4?alt=media"));
    assert.ok(gcsCalls.every(([, header]) => header === "Bearer fake-gcs-token"));
    assert.equal(calls.length, 0);
  } finally {
    env.GOOGLE_SERVICE_ACCOUNT_JSON = previous;
    delete env.SWATCHES_ORIGINAL_VIDEO_DIRECTORY;
    delete env.SWATCHES_MEDIA_BUCKET;
  }
});

test("missing Sheet IDs fail closed without falling back to any real data source", async () => {
  const { routes, reads, writes } = setup();
  const crm = env.SWATCHES_CRM_SHEET_ID;
  try {
    delete env.SWATCHES_CRM_SHEET_ID;
    const result = await routes.access.POST(request({ code: "0358" }));
    assert.equal(result.status, 503);
    assert.deepEqual(reads, []);
    assert.deepEqual(writes, []);
    assert.equal(result.cookies.size, 0);
  } finally { env.SWATCHES_CRM_SHEET_ID = crm; }
});

test("selects only export KRW/yd and fails closed rather than quoting domestic or USD prices", () => {
  const sh = load("src/app/api/swatches/sheets.ts", {
    "@/app/swatches/customer-code": codes, "@/lib/contact": contact, "@/lib/contact-notification": notification,
  });
  const [h, row] = productRows;
  const [head, data] = [[...h, "한국 가격", "참고가(USD/yd)"], [...row, 123, 5]];
  const parse = (header, values) => sh.parseCatalog([header, values], rollRows).patterns[0].variants[0].price;
  assert.equal(parse(head, data), row[3]);
  assert.equal(parse(head, data.map((v, i) => i === 3 ? "" : v)), null);
  assert.throws(() => parse(head.map((v) => v === "수출가(원/yd)" ? "가격" : v), data), /Missing/);
  assert.throws(() => parse([...head, "수출가(원/yd)"], [...data, 321]), /Ambiguous/);
});

test("public code-only catalog parser never forwards Sheet photo URLs", () => {
  const sh = load("src/app/api/swatches/sheets.ts", {
    "@/app/swatches/catalog": catalog,
    "@/app/swatches/customer-code": codes,
    "@/lib/contact": contact,
    "@/lib/contact-notification": notification,
  });
  const [head, ...rest] = productRows;
  const r = sh.parseCatalog([[...head, "사진 URL"], ...rest.map(p => [...p, "https://drive.example.invalid/private-fixture-id"])], rollRows);
  assert.equal(r.patterns[0].variants[0].image, null);
  assert.doesNotMatch(JSON.stringify(r), /private-fixture-id/);
});

test("front and reverse images require an active session, separate manifests, and exact verified private metadata", async () => {
  const prev = env.GOOGLE_SERVICE_ACCOUNT_JSON;
  const account = JSON.stringify({ type: "service_account", client_email: "asset-test@example.invalid", private_key: "fixture" });
  const size = 8, md5 = "0123456789abcdef0123456789abcdef";
  const keys = ["SWATCHES_DRIVE_FRONT_FOLDER_ID","SWATCHES_DRIVE_FRONT_MANIFEST","SWATCHES_DRIVE_REVERSE_FOLDER_ID","SWATCHES_DRIVE_REVERSE_MANIFEST"];
  const urls = [], assetFolders = ["fake-front-folder","fake-reverse-folder"], ids = ["fake-front-file","fake-reverse-file"];
  let unsafeMetadata = false;
  try {
    env.GOOGLE_SERVICE_ACCOUNT_JSON = account;
    env[keys[0]] = assetFolders[0];
    env[keys[1]] = JSON.stringify({version:1,assets:[{sku:"S1",fileId:ids[0],bytes:size,md5}]});
    env[keys[2]] = assetFolders[1];
    env[keys[3]] = JSON.stringify({version:1,assets:[{sku:"S1",fileId:ids[1],bytes:size,md5}]});
    const google = { auth: { GoogleAuth: class { async getAccessToken() { return "only-fixture-token"; } } } };
    const testFetch=async (url,opts) => {
      assert.equal(url.origin,"https://www.googleapis.com");
      assert.equal(opts.redirect,"error");
      const p=ids.indexOf(url.pathname.split("/").at(-1));
      assert.ok(p===0||p===1);
      assert.equal(opts.headers.Authorization,"Bearer only-fixture-token");
      assert.equal(opts.headers.Range,undefined);
      urls.push(p);
      if(url.searchParams.get("alt")==="media") return new Response(p===0?"front123":"rev12345",{headers:{"Content-Length":String(size)}});
      return Response.json({
        id:ids[p],name:"S1.webp",mimeType:unsafeMetadata?"video/mp4":"image/webp",
        parents:[assetFolders[p]],size:String(size),md5Checksum:md5,trashed:false,capabilities:{canDownload:true},
      });
    };
    const drive = loadDrive({ googleapis: {google} }, testFetch);
    const media = load("src/app/api/swatches/design/media.ts", {googleapis:{google},"./drive-video":drive});
    const reverse = load("src/app/api/swatches/design/reverse-textures.ts", {"./drive-video":drive});
    const photos = load("src/app/api/swatches/design/photos.ts", {"./media":media,"./reverse-textures":reverse});
    let authorised=false;
    const deps={"../active-session":{hasActiveSession:async()=>authorised},"../session":load(sessionPath)};
    const frontRoute=load("src/app/api/swatches/photo/route.ts",{...deps,"../design/photos":photos});
    const reverseRoute=load("src/app/api/swatches/reverse/route.ts",{...deps,"../design/reverse-textures":reverse});
    const view=(handler,sku)=>handler.GET({nextUrl:new URL("/api/swatches/photo?sku="+encodeURIComponent(sku)+"&fileId=user-supplied",origin)});
    assert.equal((await view(frontRoute,"S1")).status,401);
    assert.equal((await view(reverseRoute,"S1")).status,401);
    assert.deepEqual(urls,[]);
    authorised=true;
    assert.equal((await view(frontRoute,"S2")).status,404);
    assert.equal((await view(reverseRoute,"T1")).status,404);
    assert.deepEqual(urls,[]);
    for (const [handler,expected] of [[frontRoute,"front123"],[reverseRoute,"rev12345"]]) {
      const response=await view(handler,"S1");
      assert.equal(response.status,200);
      assert.equal(response.headers.get("Content-Type"),"image/webp");
      assert.equal(response.headers.get("Cache-Control"),"private, no-store, no-transform");
      assert.equal(response.headers.get("Location"),null);
      assert.doesNotMatch(JSON.stringify([...response.headers]),/fake-.*-file|fixture-token/);
      assert.equal(await response.text(),expected);
    }
    assert.deepEqual(urls,[0,0,1,1]);
    unsafeMetadata=true;
    assert.equal((await view(reverseRoute,"S1")).status,404);
    assert.deepEqual(urls,[0,0,1,1,1]);
    env[keys[2]]=assetFolders[0];
    const crossed = loadDrive({googleapis:{google}},testFetch);
    assert.equal(crossed.hasDriveFrontForSku("S1"),false);
    assert.equal(crossed.hasDriveReverseForSku("S1"),false);
    assert.equal((await crossed.driveFront("S1")).status,404);
  } finally {
    env.GOOGLE_SERVICE_ACCOUNT_JSON=prev;
    for(const k of keys)delete env[k];
  }
});

test("server configuration accepts plain JSON or canonical gzip1 with strict byte limits", () => {
  const { decodeSwatchesConfig } = configCodec;
  const plain = JSON.stringify({ caption: "원단 눈으로 보기" });
  assert.equal(decodeSwatchesConfig(plain, 128), plain);
  assert.equal(decodeSwatchesConfig(packed(plain), 128), plain);
  assert.equal(decodeSwatchesConfig(plain, Buffer.byteLength(plain) - 1), undefined);
  assert.equal(decodeSwatchesConfig(packed(plain) + "=", 128), undefined);
  assert.equal(decodeSwatchesConfig(packed(plain) + "\n", 128), undefined);
  assert.equal(decodeSwatchesConfig(packed(plain).slice(0, -3), 128), undefined);
  assert.equal(decodeSwatchesConfig("gzip1:" + Buffer.from("not gzip").toString("base64url"), 128), undefined);
  assert.equal(decodeSwatchesConfig(packed(Buffer.from([0xc0, 0xae])), 128), undefined);
  assert.equal(decodeSwatchesConfig(packed("x".repeat(2_048)), 128), undefined);
});

test("compressed Drive manifest still validates allowlists and approved metadata", async () => {
  const previous = env.GOOGLE_SERVICE_ACCOUNT_JSON;
  const fixture = driveSetup({ manifest: packed(fakeManifest) });
  try {
    assert.equal(fixture.drive.hasDriveVideo, true);
    const response = await fixture.drive.driveVideo("S86", "bytes=4-8");
    assert.equal(response.status, 206);
    assert.equal(await response.text(), "45678");
    const invalid = packed(JSON.stringify({ version: 1, assets: [fakeManifestEntry, fakeManifestEntry] }));
    assert.equal(fixture.drive.parseDriveVideoConfig(fakeDriveFolder, invalid), undefined);
  } finally { env.GOOGLE_SERVICE_ACCOUNT_JSON = previous; }
});

test("compressed layout snapshot never enables the mutable store", async () => {
  const layoutModel = load("src/app/swatches/design-layout.ts");
  const snapshot = { order: ["직조A"], covers: { 직조A: "S86" }, sizes: {}, rowHeights: {}, columns: 5 };
  const store = () => load("src/app/api/swatches/design/store.ts", {
    "@/app/swatches/design-layout": layoutModel,
    "./secret-config": configCodec,
    googleapis: { google: { sheets() { throw Error("unexpected Sheets access"); } } },
  });
  try {
    env.SWATCHES_LAYOUT_JSON = packed(JSON.stringify(snapshot));
    env.SWATCHES_DESIGN_SHEET_ID = "fake-sheet-must-not-be-called";
    const reader = store();
    assert.deepEqual(JSON.parse(JSON.stringify(await reader.readSwatchesLayout())), snapshot);
    assert.equal(reader.canSaveSwatchesLayout(), false);
    await assert.rejects(reader.saveSwatchesLayout(snapshot), /read-only/);
    env.SWATCHES_LAYOUT_JSON = "gzip1:invalid";
    const rejected = store();
    assert.equal(rejected.canSaveSwatchesLayout(), false);
    await assert.rejects(rejected.readSwatchesLayout(), /invalid/i);
  } finally {
    delete env.SWATCHES_LAYOUT_JSON;
    delete env.SWATCHES_DESIGN_SHEET_ID;
  }
});

test("hosted Swatches requires the dedicated credential and never falls back from an invalid value", async () => {
  const names = ["VERCEL", "VERCEL_ENV", "VERCEL_TARGET_ENV", "NODE_ENV", "SWATCHES_GOOGLE_SERVICE_ACCOUNT_JSON", "GOOGLE_SERVICE_ACCOUNT_JSON"];
  const saved = Object.fromEntries(names.map((key) => [key, env[key]]));
  try {
    for (const key of names) delete env[key];
    env.NODE_ENV = "production";
    env.GOOGLE_SERVICE_ACCOUNT_JSON = JSON.stringify({ client_email: "old-contact@example.invalid" });
    assert.equal(await googleCredentials.readSwatchesGoogleCredentials(), env.GOOGLE_SERVICE_ACCOUNT_JSON);
    env.VERCEL_ENV = "production";
    await assert.rejects(googleCredentials.readSwatchesGoogleCredentials(), /dedicated service account is missing/);
    assert.equal(await googleCredentials.readContactGoogleCredentials(), env.GOOGLE_SERVICE_ACCOUNT_JSON);
    env.SWATCHES_GOOGLE_SERVICE_ACCOUNT_JSON = "broken-dedicated-value-must-not-be-echoed";
    await assert.rejects(googleCredentials.readSwatchesGoogleCredentials(), {
      message: "Swatches dedicated service account is invalid",
    });
    env.SWATCHES_GOOGLE_SERVICE_ACCOUNT_JSON = "";
    await assert.rejects(googleCredentials.readSwatchesGoogleCredentials(), /dedicated service account is invalid/);
    env.SWATCHES_GOOGLE_SERVICE_ACCOUNT_JSON = JSON.stringify({ type: "client_web", client_email: "swatch@example.invalid", private_key: "invalid" });
    await assert.rejects(googleCredentials.readSwatchesGoogleCredentials(), /dedicated service account is invalid/);
  } finally {
    for (const key of names) {
      if (saved[key] === undefined) delete env[key];
      else env[key] = saved[key];
    }
  }
});

test("CRM and catalog use the dedicated identity while contact inquiries preserve Contact credentials", async () => {
  const names = ["VERCEL_ENV", "SWATCHES_GOOGLE_SERVICE_ACCOUNT_JSON", "GOOGLE_SERVICE_ACCOUNT_JSON"];
  const saved = Object.fromEntries(names.map((key) => [key, env[key]]));
  const activity = [];
  try {
    env.VERCEL_ENV = "production";
    env.SWATCHES_GOOGLE_SERVICE_ACCOUNT_JSON = JSON.stringify({
      type: "service_account",
      client_email: "swatch@example.invalid",
      private_key: "-----BEGIN PRIVATE KEY-----\nfixture-not-a-real-key\n-----END PRIVATE KEY-----\n",
    });
    env.GOOGLE_SERVICE_ACCOUNT_JSON = JSON.stringify({ client_email: "contact@example.invalid" });
    const google = {
      auth: { GoogleAuth: class { constructor({ credentials }) { this.identity = credentials.client_email; } } },
      sheets: ({ auth }) => ({ spreadsheets: { values: {
        get: async () => { activity.push(["crm-read", auth.identity]); return { data: { values: crmRows } }; },
        batchGet: async () => { activity.push(["inventory-read", auth.identity]); return { data: { valueRanges: [{ values: productRows }, { values: rollRows }] } }; },
        append: async ({ spreadsheetId }) => {
          activity.push([spreadsheetId === env.SWATCHES_CRM_SHEET_ID ? "crm-append" : "contact-append", auth.identity]);
          return { data: { updates: { updatedRange: "'Inquiries'!A2:F2" } } };
        },
      } } }),
    };
    const sheets = load("src/app/api/swatches/sheets.ts", {
      googleapis: { google },
      "@/app/swatches/catalog": catalog,
      "@/app/swatches/customer-code": codes,
      "@/lib/contact": contact,
      "@/lib/contact-notification": { ...notification, notifyContactRow: async () => "sent" },
    });
    const [company] = await sheets.readCompanies();
    await sheets.readCatalog();
    await sheets.logAccess(company, "fixture");
    assert.equal(await sheets.recordInquiry(company, "fixture inquiry"), "sent");
    assert.deepEqual(activity, [
      ["crm-read", "swatch@example.invalid"],
      ["inventory-read", "swatch@example.invalid"],
      ["crm-append", "swatch@example.invalid"],
      ["contact-append", "contact@example.invalid"],
    ]);
  } finally {
    for (const key of names) {
      if (saved[key] === undefined) delete env[key];
      else env[key] = saved[key];
    }
  }
});

test("experimental row returns only protected, expected paths, no stock, and respects actual density", async () => {
  const path = "src/app/api/swatches/first-row/route.ts";
  const helper = load("src/app/swatches/welcome-covers.ts");
  let sourceReads = 0, layout = {order:["A","B","C","D","E","F"],covers:{ A:"S1",B:"S2",C:"S3",D:"S4",E:"S5",F:"S6" },sizes:{},columns:5};
  const photo = (sku,admin,v) => "/api/swatches/photo?sku="+sku+"&v="+v;
  const deps = {
    "../active-session":{hasActiveSession: async req => req.signed === true},
    "../design/drive-list-thumbnails":{listThumbnailUrl: (sku) => ["S2","S4"].includes(sku) ? undefined : "/api/swatches/thumbnail?sku="+sku},
    "../design/media":{validApprovedSku: sku => /^S[1-6]$/.test(sku), hasApprovedMediaForSku: sku=>sku !== "S6"},
    "../design/photos":{photoStorageAvailable:false,swatchPhotoUrl:photo},
    "../design/store":{readSwatchesLayout: async()=>{sourceReads++;return layout;}},
    "../session":{json:(data,status,extra)=>Response.json(data,{status,headers:{"Cache-Control":"private, no-store",...extra}})},
    "@/app/swatches/welcome-covers":helper,
  };
  const req=(width,dpr,signed=true,site="same-origin")=>({nextUrl:new URL("http://test.invalid/?width="+width+"&dpr="+dpr), signed, headers:new Headers({"sec-fetch-site":site})});
  const {GET}=load(path,deps);
  const previous=env.SWATCHES_LAYOUT_JSON;
  try {
    delete env.SWATCHES_LAYOUT_JSON;
    assert.equal((await GET(req(1200,1))).status,404);
    env.SWATCHES_LAYOUT_JSON="immutable";
    assert.equal((await GET(req(1200,1,false))).status,401);
    assert.equal((await GET(req(1200,1,true,"cross-site"))).status,403);
    assert.deepEqual(await (await GET(req(0,1))).json(),{images:[]});
    assert.equal(sourceReads,0);
    const desktop=await GET(req(1200,1)); assert.match(desktop.headers.get("Cache-Control"),/no-store/);
    assert.deepEqual((await desktop.json()).images, ["/api/swatches/thumbnail?sku=S1",photo("S2",false,1),"/api/swatches/thumbnail?sku=S3",photo("S4",false,1),"/api/swatches/thumbnail?sku=S5"]);
    assert.deepEqual((await (await GET(req(390,3))).json()).images,[photo("S1",false,1),photo("S2",false,1)]);
    assert.deepEqual((await (await GET(req(320,2.5))).json()).images,[photo("S2",false,1)]);
    assert.equal((await load(path,{...deps,"../design/photos":{...deps["../design/photos"],photoStorageAvailable:true}}).GET(req(1200,1))).status,404);
    layout={...layout,covers:{A:"../../no",B:"S6"}};
    assert.deepEqual((await (await GET(req(1200,1))).json()).images,[]);
  } finally { if(previous === undefined)delete env.SWATCHES_LAYOUT_JSON;else env.SWATCHES_LAYOUT_JSON=previous; }
});

test("private poster route checks login first, only accepts same-origin exact SKU query", async () => {
  const requests = [];
  let active = false;
  const failure = status => new Response(null, { status, headers: { "Cache-Control": "private, no-store" } });
  const route = load("src/app/api/swatches/poster/route.ts", {
    "../active-session": { hasActiveSession: async () => active },
    "../design/drive-posters": { posterFailure: failure, drivePoster: async (...args) => {
      requests.push(args); return args[0] === "S84" ? new Response("fixture-poster") : failure(404);
    } },
  });
  const request = (query, site = "same-origin") => ({ headers: new Headers({ "sec-fetch-site": site }), nextUrl: new URL("https://test.invalid/api/swatches/poster?" + query) });
  assert.equal((await route.GET(request("sku=S84"))).status, 401);
  assert.deepEqual(requests, []);
  active = true;
  assert.equal((await route.GET(request("sku=S84", "cross-site"))).status, 403);
  assert.equal((await route.GET(request("sku=S84&sku=S85"))).status, 404);
  assert.equal((await route.GET(request("sku=S84&url=evil"))).status, 404);
  assert.deepEqual(requests, []);
  assert.equal(await (await route.GET(request("sku=S84"))).text(), "fixture-poster");
  assert.equal((await route.GET(request("sku=S85"))).status, 404);
  assert.deepEqual(requests, [["S84"], ["S85"]]);
});

test("poster registry requires 236 unique bounded assets, exact set and matching SHA", () => {
  const { createHash } = require("node:crypto");
  const valid = v => /^[ST][1-9][0-9]{0,2}$/.test(v) && Number(v.slice(1)) <= (v.startsWith("S") ? 108 : 128);
  const io = load("src/app/api/swatches/design/drive-posters.ts", {
    "server-only": {}, "./drive-video": {}, "./drive-list-thumbnails": {
      parseListThumbnailLocator: () => undefined, validListThumbnailSku: valid,
    },
  });
  const assets = [...Array.from({ length: 108 }, (_, i) => "S" + (i+1)), ...Array.from({ length: 128 }, (_, i) => "T" + (i+1))]
    .map(sku => ({ sku, fileId: "fixture_poster_" + sku, bytes: 50, sha256: "a".repeat(64) }));
  const parse = (rows, hash) => {
    const bytes = Buffer.from(JSON.stringify({version:1,assets: rows}));
    return io.parsePosterRegistry(bytes, hash || createHash("sha256").update(bytes).digest("hex"), ["fixture_manifest"]);
  };
  assert.equal(parse(assets).size, 236);
  assert.equal(parse(assets).get("S84").fileId, "fixture_poster_S84");
  assert.throws(() => parse(assets.slice(1)), /236/);
  assert.throws(() => parse([...assets.slice(1), assets[1]]), /duplicate/);
  assert.throws(() => parse(assets, "0".repeat(64)), /digest/);
  assert.throws(() => parse([...assets.slice(1), {...assets[0], fileId:"fixture_manifest"}]), /duplicate/);
});

test("only the exact affirmative CRM cell on one column discloses prices", async () => {
  const company = ["Fixture B", "b@example.invalid", "B002", "활성"];
  for (const [labels, values] of [
    [[], []], [["가격 공개"], []], [["가격 공개"], ["비공개"]], [["가격 공개"], ["공개 "]],
    [["가격 공개"], [true]], [["가격 공개"], ["YES"]], [["가격 공개", "가격 공개"], ["공개", "공개"]],
  ]) {
    const { routes } = setup([[...crmRows[0].slice(0, 4), ...labels], [...company, ...values]]);
    const entered = await routes.access.POST(request({ code: "B002" }));
    assert.equal(entered.body.welcomeName, "Fixture B");
    const result = await routes.catalog.GET(request(undefined, entered.cookies.get("yj_swatches")));
    assert.equal(result.body.canViewPrices, false);
    assert.doesNotMatch(JSON.stringify(result.body), /"price"|4200|3900/);
    assert.deepEqual(JSON.parse(JSON.stringify(result.body.patterns[0].variants[0].rolls[0])), { id: "A1:92:1", yards: 92 });
  }
});

test("signed sessions honor CRM changes on the next catalog and inquiry, including conflicts", async () => {
  const rows = crmRows.map(row => [...row]);
  const { routes, writes, market } = setup(rows);
  const entered = await routes.access.POST(request({ code: "0358" }));
  const token = entered.cookies.get("yj_swatches");
  const query = () => routes.catalog.GET(request(undefined, token));
  const send = items => routes.inquiry.POST(request({ items }, token));
  const id = "A1:92:1";
  assert.equal((await query()).body.patterns[0].variants[0].price, 4200);
  rows[1][4] = "비공개";
  assert.equal((await query()).body.canViewPrices, false);
  const exists = [{ id }];
  for (const items of [[{ id, price: 4200 }], [{ id, price: 3999 }], [{ id: "sold-roll" }]]) {
    const conflict = await send(items);
    assert.equal(conflict.status, 409);
    assert.deepEqual(Object.keys(conflict.body), ["error"]);
    assert.match(conflict.headers["Cache-Control"], /private, no-store/);
    assert.equal(conflict.headers["Vary"], "Cookie");
    assert.equal(conflict.headers["Vercel-CDN-Cache-Control"], "no-store");
  }
  market.products[1][3] = 6743;
  const result = await send(exists);
  assert.equal(result.status, 200);
  assert.doesNotMatch(JSON.stringify(result.body), /6743|620356/);
  assert.match(writes.at(-1).requestBody.values[0][4], /A1:92:1.*₩6,743.*₩620,356/);
  market.stock[1][2] = market.stock[2][2] = "출고완료";
  assert.equal((await send(exists)).status, 409);
  rows[1][3] = "비활성";
  assert.equal((await query()).status, 401);
  assert.equal((await send(exists)).status, 401);
  assert.equal(writes.length, 2);
});

test("projection preserves the detail media and removes unknown monetary fields", () => {
  const { customerPatterns } = load("src/app/api/swatches/price-visibility.ts");
  const image = "/api/swatches/photo?sku=S1&v=1", video = "/api/swatches/video?sku=S1";
  const input = [{ name: "Twill", total: 81234, variants: [{ sku: "S1", image, video, price: 87654,
    landedCost: 76543, rolls: [{ id: "S1:3:1", yards: 3, total: 65432 }] }] }];
  const [hidden] = customerPatterns(input, false);
  assert.equal(hidden.variants[0].image, image);
  assert.equal(hidden.variants[0].video, video);
  assert.doesNotMatch(JSON.stringify(hidden), /"price"|total|Cost|87654|76543|65432|81234/);
  assert.equal(customerPatterns(input, true)[0].variants[0].price, 87654);
});


test("a new document or another company's tab cannot use the shared cookie for catalog or inquiry", async () => {
  const { routes, reads, writes } = setup([...crmRows, ["Fixture B", "b@example.invalid", "B002", "활성", "비공개"]]);
  const login = code => routes.access.POST(request({ code }));
  const a = await login("0358");
  const b = await login("B002");
  for (const key of ["", b.body.visitKey]) {
    const stale = request({ items: [{ id: "A1:92:1" }] }, a.cookies.get("yj_swatches"));
    stale.headers.set("X-Swatches-Visit", key);
    assert.equal((await routes.catalog.GET(stale)).status, 401);
    assert.equal((await routes.inquiry.POST(stale)).status, 401);
  }
  assert.equal(reads.includes("inventory"), false);
  assert.equal(writes.length, 2);
});

test("a source outage fails closed after a priced visit and writes no inquiry", async () => {
  const { routes, market, writes } = setup();
  const entered = await routes.access.POST(request({ code: "0358" }));
  const token = entered.cookies.get("yj_swatches");
  assert.equal((await routes.catalog.GET(request(undefined, token))).body.canViewPrices, true);
  Object.defineProperty(market, "stock", { get() { throw Error("provider diagnostic: 1234567"); } });
  for (const result of [
    await routes.catalog.GET(request(undefined, token)),
    await routes.inquiry.POST(request({ items: [{ id: "A1:92:1", price: 4200 }] }, token)),
  ]) {
    assert.equal(result.status, 503);
    assert.deepEqual(Object.keys(result.body), ["error"]);
    assert.doesNotMatch(JSON.stringify(result.body), /provider|1234567|4200/);
    assert.match(result.headers["Cache-Control"], /no-store/);
  }
  assert.equal(writes.length, 1);
});

test("design editor login alone does not disclose price", async () => {
  const layout = { order: [], covers: {}, sizes: {}, rowHeights: {} };
  const design = load("src/app/api/swatches/design/route.ts", {
    "@/app/swatches/design-layout": {}, "../session": { json: body => body },
    "../price-visibility": load("src/app/api/swatches/price-visibility.ts"),
    "../sheets": { readCatalog: async () => ({ patterns: [{ name: "Test", variants: [{ sku: "S1", price: 765432, rolls: [] }] }] }) },
    "./auth": { hasDesignSession: () => true }, "./store": { readSwatchesLayout: () => layout, canSaveSwatchesLayout: () => false },
    "./photos": { withSwatchPhotos: patterns => patterns },
  });
  const result = await design.GET(request());
  assert.equal(result.patterns[0].variants[0].sku, "S1");
  assert.doesNotMatch(JSON.stringify(result), /price|765432/);
});


test("visibility appended at Z or AA resolves by header; another copy beyond Z denies disclosure", async () => {
  for (const index of [25, 26]) {
    const header = [...crmRows[0].slice(0, 4)];
    const row = [...crmRows[1].slice(0, 4)];
    while (header.length < index) { header.push("other"); row.push(""); }
    header.push("가격 공개");
    row.push("공개");
    const { routes } = setup([header, row]);
    const login = await routes.access.POST(request({ code: "0358" }));
    const catalogRequest = request(undefined, login.cookies.get("yj_swatches"));
    const catalog = () => routes.catalog.GET(catalogRequest);
    assert.equal((await catalog()).body.patterns[0].variants[0].price, 4200);
    header.push("가격 공개");
    row.push("공개");
    const hidden = await catalog();
    assert.equal(hidden.body.canViewPrices, false);
    assert.doesNotMatch(JSON.stringify(hidden.body), /"price"/);
  }
});

test("twenty distinct P/Q fixture companies keep their identity across disclosure and restoration", async () => {
  const { makeCompanyMatrix } = await import("./company-matrix.mjs");
  const { headers, external, internal } = makeCompanyMatrix();
  const original = external.map(row => [...row]);
  const hidden = external.slice(0, 10);
  const temporary = external.slice(10);
  assert.equal(new Set([...external, internal].map(row => row[2])).size, 21);
  assert.equal(new Set(external.map(row => row[0])).size, 20);

  async function check(row, admitted, showPrice) {
    const { routes, reads } = setup([headers, ...external, internal]);
    const entered = await routes.access.POST(request({ code: row[2] }));
    assert.equal(entered.status, admitted ? 200 : 401);
    if (!admitted) {
      assert.equal(reads.includes("inventory"), false);
      assert.equal(entered.cookies.size, 0);
      return;
    }
    assert.equal(entered.body.welcomeName, row[0]);
    const response = await routes.catalog.GET(request(undefined, entered.cookies.get("yj_swatches")));
    assert.equal(response.status, 200);
    assert.equal(response.body.canViewPrices, showPrice);
    const variant = response.body.patterns[0].variants[0];
    if (showPrice) assert.equal(variant.price, 4200);
    else assert.equal(Object.hasOwn(variant, "price"), false);
  }

  temporary.forEach(row => { row[16] = "공개"; });
  for (const row of hidden) await check(row, true, false);
  for (const row of temporary) await check(row, true, true);
  temporary.forEach((row, i) => { row[16] = original[10 + i][16]; });
  for (const row of temporary) await check(row, true, false);
  assert.deepEqual(external, original);
  for (const [i, row] of external.entries()) {
    row[15] = "비활성";
    row[16] = i < 10 ? "" : "공개";
    await check(row, false, false);
  }
  await check(internal, true, true);
});
