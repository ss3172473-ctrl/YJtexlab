#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

// A historical name (including "원단" or "public 2") is not evidence
// that the contents are disposable. Report unexpected roots in verify:deploy-input,
// instead of deleting them. Never remove tracked files, symlinks or their parents.
const root = process.cwd();
const tracked = new Set(execFileSync("git", ["ls-files", "-z"], { cwd: root, encoding: "utf8" }).split("\0").filter(Boolean).map((p) => p.split("/")[0]));
const isRegular = (p) => fs.lstatSync(p, {throwIfNoEntry: false})?.isFile() === true;
const isDirectory = (p) => fs.lstatSync(p, {throwIfNoEntry: false})?.isDirectory() === true;
const removed = [];
for (const entry of [".next", "tsconfig.tsbuildinfo"]) {
  if (tracked.has(entry)) continue;
  const p = path.join(root, entry);
  if (entry === ".next") {
    if (!isDirectory(p) || !isDirectory(path.join(p, "server")) || !isRegular(path.join(p, "build-manifest.json")) || !isRegular(path.join(p, "routes-manifest.json"))) continue;
    fs.rmSync(p, { recursive: true });
  } else {
    if (!isRegular(p)) continue;
    try {
      const data = JSON.parse(fs.readFileSync(p, "utf8"));
      if (!Array.isArray(data.fileNames ?? data.program?.fileNames) || typeof (data.version ?? data.program?.version) !== "string") continue;
    } catch { continue; }
    fs.unlinkSync(p);
  }
  removed.push(entry);
}
console.log(removed.length ? `Removed generated build output: ${removed.join(", ")}.` : "No verified disposable build output to remove.");
