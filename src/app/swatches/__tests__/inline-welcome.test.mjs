import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import vm from "node:vm";
const read = file => readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
const entry = read("entry.tsx");
const page = read("swatches.tsx");

test("welcome cannot hide or disable the authorized catalog", () => {
  assert.doesNotMatch(page, /node\.inert|data-welcome-preparing|aria-hidden=\{welcomePreparing/);
  assert.match(page, /finishWelcome = useCallback\(\(\) => setWelcomePreparing\(false\)/);
  assert.match(page, /if \(status !== "ready"\)/);
  assert.match(page, /: catalog && <Grid/);
  assert.match(read("swatches.module.css"), /\.welcomeSlot \{ min-height: 96px; \}/);
  const welcome = entry.slice(entry.indexOf("export function Welcome"));
  assert.equal((welcome.match(/role="status"/g) ?? []).length, 1);
  assert.doesNotMatch(welcome, /role="dialog"|\.focus\(/);
  assert.match(read("experience.module.css"), /prefers-reduced-motion: reduce/);
});

test("warming timer clears on departure and unmount, including error removal", () => {
  const welcome = entry.slice(entry.indexOf("export function Welcome"));
  const effect = welcome.match(/useEffect\(\(\) => \{([\s\S]*?)\n  \}, \[onDone, firstCoverReady\]\);/)[1];
  for (const reduced of [false, true]) {
    const listeners = new Map();
    const pending = new Set();
    const context = {
      window: {
        matchMedia: () => ({ matches: reduced }),
        setTimeout: () => { pending.add(1); return 1; },
        clearTimeout: id => pending.delete(id),
        addEventListener: (name, fn) => listeners.set(name, fn),
        removeEventListener: name => listeners.delete(name),
      },
      performance: { now: () => 0 }, startedAt: { current: undefined },
      firstCoverReady: false, onDone: () => {},
    };
    const cleanup = vm.runInNewContext(`(() => {${effect}})()`, context);
    assert.equal(pending.size, 1);
    listeners.get("pagehide")();
    assert.equal(pending.size, 0);
    cleanup();
    assert.equal(listeners.size, 0);
    assert.match(page, /catch \{\n      setWelcomeName\(null\);\n      setWelcomePreparing\(false\);/);
  }
});


test("detail hides the mounted welcome without gating its timer or catalog", () => {
  assert.match(page, /<div className={styles.welcomeSlot} hidden={Boolean\(pattern && variant\)}>/);
  assert.match(page, /{welcomeName !== null && <Welcome/);
  const welcome = entry.slice(entry.indexOf("export function Welcome"));
  assert.match(welcome, /\[onDone, firstCoverReady\]/);
  assert.doesNotMatch(welcome, /pattern|variant/);
  assert.match(read("swatches.module.css"), /\.welcomeSlot\[hidden\] { display: none; }/);
});

test("short and mobile welcome reserves 64px and grows for full localized identity", () => {
  for (const [file, selector] of [["swatches.module.css", "welcomeSlot"], ["experience.module.css", "welcome"]]) {
    const css = read(file);
    assert.ok(css.includes(`@media (max-width: 640px), (max-height: 700px) {\n  .${selector} { min-height: 64px; }`));
    const rule = css.match(new RegExp(`\\.${selector} \\{([^}]+)`))[1];
    assert.doesNotMatch(rule, /overflow: hidden|(?<!min-)height:|position:|visibility:|animation:/);
  }
  const css = read("experience.module.css");
  const heading = css.match(/\.welcome h1 \{([^}]+)/)[1];
  assert.match(heading, /overflow-wrap: anywhere/);
  assert.doesNotMatch(heading, /nowrap|overflow: hidden|text-overflow/);
  assert.match(entry, /<p>{t\("welcome"\)}<\/p>/);
  assert.match(entry, /<h1 title={name}>{name}<\/h1>/);
});

test("quick detail open and return do not restart warming, including cover-ready updates", () => {
  const effect = entry.slice(entry.indexOf("export function Welcome"))
    .match(/useEffect\(\(\) => \{([\s\S]*?)\n  \}, \[onDone, firstCoverReady\]\);/)[1];
  for (const reduced of [false, true]) {
    let now = 0;
    let deadline;
    let callback;
    let finished = 0;
    const context = {
      window: {
        matchMedia: () => ({ matches: reduced }),
        setTimeout: (fn, delay) => { callback = fn; deadline = now + delay; return 1; },
        clearTimeout: () => { callback = undefined; },
        addEventListener: () => {}, removeEventListener: () => {},
      },
      performance: { now: () => now }, startedAt: { current: undefined },
      firstCoverReady: false, onDone: () => { finished++; },
    };
    let cleanup = vm.runInNewContext(`(() => {${effect}})()`, context);
    // CSS visibility changes at 20ms (detail) and 40ms (return) do not unmount Welcome.
    now = 20;
    now = 40;
    assert.equal(deadline, reduced ? 300 : 700);
    cleanup();
    context.firstCoverReady = true;
    cleanup = vm.runInNewContext(`(() => {${effect}})()`, context);
    assert.equal(deadline, reduced ? 100 : 440);
    callback();
    assert.equal(finished, 1);
    cleanup();
  }
});
