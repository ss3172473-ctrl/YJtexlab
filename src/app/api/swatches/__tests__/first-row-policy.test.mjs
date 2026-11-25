import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import vm from "node:vm";
import ts from "typescript";

const source = new URL("../../../swatches/first-row-policy.ts", import.meta.url);
const exports = {};
vm.runInNewContext(ts.transpileModule(readFileSync(source, "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText, { exports, URLSearchParams });

test("protected first-row preparation is on by default, explicit baseline remains an escape", () => {
  for (const q of ["", "?utm_source=test", "?swatchPerf=firstrow"]) assert.equal(exports.firstRowEnabled(q), true);
  for (const q of ["?swatchPerf=baseline", "?swatchPerf=", "?swatchPerf=x", "?swatchPerf=firstrow&swatchPerf=baseline",
    "?swatchPerf=firstrow&swatchPerf=firstrow", "?swatchPerf=FIRSTROW"]) assert.equal(exports.firstRowEnabled(q), false);
});
