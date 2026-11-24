import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import vm from "node:vm";
import ts from "typescript";

const source = new URL("../../../swatches/language.ts", import.meta.url);
const exports = {};
vm.runInNewContext(ts.transpileModule(readFileSync(source, "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText, { exports });
const { fabricName, colorName } = exports;

test("established names retain verified trade terminology without inferred fibers", () => {
  assert.equal(fabricName("50수체크", "ko"), "50수체크");
  assert.equal(fabricName("50수체크", "en"), "50s Check");
  assert.equal(fabricName("50수체크", "zh-CN"), "50支格纹");
  assert.equal(fabricName("CN스판", "zh-CN"), "CN 弹力面料");
  assert.equal(fabricName("５０수 체크", "en"), "50s Check");
  assert.equal(fabricName("면선염", "zh-CN"), "色织棉布");
  assert.equal(fabricName("CP선염", "zh-CN"), "CP 色织面料");
});

test("new combinations localize only recognized whole terms and yarn counts", () => {
  assert.equal(fabricName("60수 고밀도 트윌", "en"), "60s High-Density Twill");
  assert.equal(fabricName("60수 고밀도 트윌", "zh-CN"), "60支高密斜纹面料");
  assert.equal(fabricName("30수 옥스포드", "zh-CN"), "30支牛津布");
  assert.equal(fabricName("선염 체크", "en"), "Yarn-Dyed Check");
  assert.equal(fabricName("60수 고밀도 트윌", "ko"), "60수 고밀도 트윌");
});

test("unrecognized source names, product codes, and unsupported mixtures are unchanged", () => {
  for (const name of [" 신제품 A-01 ", "60수 미등록 원단", "S74", "Velo Check", "30수 50수체크", "30수 트윌-01", "기모", "점선OX", "변형체크", "멀티ST", "__proto__", ""]) {
    assert.equal(fabricName(name, "en"), name);
    assert.equal(fabricName(name, "zh-CN"), name);
  }
  assert.equal(colorName("Indian Pink", "zh-CN"), "Indian Pink");
});
