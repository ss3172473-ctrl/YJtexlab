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
  const welcome = entry.slice(entry.indexOf("export function Welcome"));
  assert.equal((welcome.match(/role="status"/g) ?? []).length, 1);
  assert.doesNotMatch(welcome, /role="dialog"|\.focus\(/);
  assert.match(welcome, /prefers-reduced-motion: reduce/);
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


test("detail hides the company name without unmounting the warming effect", () => {
  assert.match(page, /firstCoverReady=\{firstCoverReady\} hidden=\{Boolean\(pattern && variant\)\}/);
  const welcome = entry.slice(entry.indexOf("export function Welcome"));
  assert.match(welcome, /\[onDone, firstCoverReady\]/);
  assert.match(welcome, /className=\{experience.companyIdentity\} lang=\{language\} hidden=\{hidden\}/);
  assert.match(read("experience.module.css"), /\.companyIdentity\[hidden\] \{ display: none; \}/);
});

test("company identity uses the masthead line without a welcome banner or full-page focus frame", () => {
  const css = read("experience.module.css");
  const shell = read("swatches.module.css");
  assert.match(css, /\.companyIdentity \{[^}]*position: absolute;[^}]*justify-content: flex-end;/s);
  assert.match(css, /\.companyIdentity strong \{[^}]*font-weight: 700;[^}]*text-overflow: ellipsis;/s);
  assert.match(entry, /<strong title=\{name\}>\{name\}<\/strong>/);
  assert.doesNotMatch(page + entry + css + shell, /welcomeSlot|lockAfter/);
  assert.match(shell, /\.shell\[tabindex="-1"\]:focus \{ outline: none; \}/);
  assert.match(shell, /\.shell button:focus-visible, \.shell input:focus-visible, \.shell a:focus-visible/);
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

test("company name gains subtle weight without another font download", () => {
  assert.match(read("experience.module.css"), /\.companyIdentity strong \{[^}]*font-weight: 700;[^}]*-webkit-text-stroke: 0\.25px currentColor;/s);
});
