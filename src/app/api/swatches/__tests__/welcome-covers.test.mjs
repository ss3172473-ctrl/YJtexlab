import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import vm from "node:vm";
import ts from "typescript";

const source = new URL("../../../swatches/welcome-covers.ts", import.meta.url);
const exports = {};
vm.runInNewContext(ts.transpileModule(readFileSync(source, "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText, { exports });
const { welcomeRowCovers } = exports;
const items = "abcdefgh".split("").map((image) => ({ image, span: 1 }));

test("uses the existing responsive card counts and the selected desktop grid layout", () => {
  for (const [width, columns, expected] of [[390, 5, "ab"], [460, 5, "ab"], [461, 5, "abc"],
    [700, 5, "abc"], [701, 5, "abcd"], [900, 5, "abcd"], [901, 5, "abcde"], [1440, 6, "abcdef"],
    [1440, 8, "abcdefgh"]]) {
    assert.equal([...welcomeRowCovers(items, width, columns)].join(""), expected);
  }
});

test("desktop honors spans, mobile ignores them, and missing photos do not shift the row", () => {
  const mixed = [{ image: "a", span: 2 }, { image: null, span: 1 }, { image: "c", span: 2 },
    { image: "d", span: 1 }];
  assert.equal([...welcomeRowCovers(mixed, 1100, 5)].join(""), "ac");
  assert.equal([...welcomeRowCovers(mixed, 1100, 4)].join(""), "a");
  assert.equal([...welcomeRowCovers(mixed, 700, 5)].join(""), "ac");
  assert.equal([...welcomeRowCovers([], 1440, 5)].join(""), "");
});
