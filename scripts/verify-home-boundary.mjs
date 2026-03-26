import fs from "node:fs";
import path from "node:path";

const projectRoot = process.cwd();
const entry = path.join(projectRoot, "src/app/page.tsx");
const forbiddenTokens = [
  "Fade into fabric.",
  "Motion becomes framing.",
  "Runway Kinetic",
];
const visited = new Set();
const offenders = [];

function resolveImport(fromFile, specifier) {
  if (!specifier.startsWith("@/") && !specifier.startsWith("./") && !specifier.startsWith("../")) {
    return null;
  }

  const candidateBase = specifier.startsWith("@/")
    ? path.join(projectRoot, "src", specifier.slice(2))
    : path.resolve(path.dirname(fromFile), specifier);

  const candidates = [
    candidateBase,
    `${candidateBase}.ts`,
    `${candidateBase}.tsx`,
    `${candidateBase}.js`,
    `${candidateBase}.jsx`,
    path.join(candidateBase, "index.ts"),
    path.join(candidateBase, "index.tsx"),
    path.join(candidateBase, "index.js"),
    path.join(candidateBase, "index.jsx"),
  ];

  return candidates.find((candidate) => fs.existsSync(candidate)) ?? null;
}

function walk(filePath) {
  if (visited.has(filePath)) {
    return;
  }

  visited.add(filePath);
  const source = fs.readFileSync(filePath, "utf8");
  const isHomeOwnedFile =
    filePath === entry ||
    filePath.includes(`${path.sep}src${path.sep}components${path.sep}home${path.sep}`);

  for (const token of forbiddenTokens) {
    if (source.includes(token)) {
      offenders.push({ filePath, reason: `forbidden token: ${token}` });
    }
  }

  const importMatches = source.matchAll(/import\s+(?:.+?\s+from\s+)?(["'])(.+?)\1/gms);

  for (const match of importMatches) {
    const [, , specifier] = match;

    const resolved = resolveImport(filePath, specifier);

    if (resolved) {
      const isProductImport = resolved.includes(`${path.sep}src${path.sep}components${path.sep}products${path.sep}`);

      if (
        isHomeOwnedFile &&
        isProductImport
      ) {
        offenders.push({
          filePath,
          reason: `forbidden product import: ${path.relative(projectRoot, resolved)}`,
        });
      }

      walk(resolved);
    }
  }
}

walk(entry);

if (offenders.length > 0) {
  console.error("Home dependency graph contains forbidden dependencies:");
  for (const offender of offenders) {
    console.error(`- ${path.relative(projectRoot, offender.filePath)} -> ${offender.reason}`);
  }
  process.exit(1);
}

console.log("Home dependency graph is clear of forbidden product-only dependencies.");
