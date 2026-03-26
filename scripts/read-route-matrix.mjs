#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const MATRIX_PATH = path.join(process.cwd(), "src/lib/route-matrix.ts");

export function readRouteMatrix(matrixPath = MATRIX_PATH) {
  const source = fs.readFileSync(matrixPath, "utf8");
  const match = source.match(/export const routeMatrix = (\[[\s\S]*?\]) as const/s);

  if (!match) {
    throw new Error(`Unable to parse routeMatrix from ${matrixPath}`);
  }

  return Function(`"use strict"; return (${match[1]});`)();
}
