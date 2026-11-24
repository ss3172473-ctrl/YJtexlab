import type { Language } from "./language";

const fibers: Record<string, [string, string, string]> = {
  C: ["면", "cotton", "棉"], N: ["나일론", "nylon", "锦纶"],
  P: ["폴리에스터", "polyester", "涤纶"], R: ["레이온", "rayon", "粘胶纤维"],
  PU: ["폴리우레탄", "polyurethane", "聚氨酯纤维"],
  "메탈사": ["메탈사", "metallic yarn", "金属纱"],
  "P방적": ["폴리에스터 방적사", "spun polyester", "涤纶短纤纱"],
};

export function localizedFabricSpecs(raw: string, width: string, language: Language) {
  const locale = language === "ko" ? 0 : language === "en" ? 1 : 2;
  const details: string[] = [];
  let rest = raw.trim();
  for (const [phrase, translated] of [
    ["우라기리", ["우라기리", "Uragiri (cut-float weave)", "剪花织法（Uragiri）"]],
    ["실크가공", ["실크가공", "silk-like finish", "仿丝整理"]],
    ["도비", ["도비", "dobby weave", "多臂织法"]],
    ["그라데이션", ["그라데이션", "gradient pattern", "渐变图案"]],
  ] as const) {
    if (rest.includes(phrase)) { details.push(translated[locale]); rest = rest.replace(phrase, " "); }
  }
  rest = rest.replace(/(\d+\s*:\s*\d+)\s*배열/g, (_, ratio: string) => {
    details.push([ratio + " 배열", ratio + " layout", ratio + " 排列"][locale]);
    return " ";
  }).trim().replace(/\s+/g, " ");

  const matches = Array.from(rest.matchAll(/(P방적|메탈사|PU|C|N|P|R)\s*(\d+(?:\.\d+)?)\s*%?/g));
  const parsed = matches.length > 0 && !rest.replace(/(P방적|메탈사|PU|C|N|P|R)\s*(\d+(?:\.\d+)?)\s*%?/g, "").trim();
  const compose = parsed
    ? matches.map(([, fiber, amount]) => locale === 2 ? `${amount}%${fibers[fiber][locale]}` : `${amount}% ${fibers[fiber][locale]}`).join(locale === 2 ? "／" : " / ")
    : /[가-힣]/.test(rest) && locale !== 0
      ? ["", "Composition not specified", "成分未注明"][locale] : rest;
  const inch = width.match(/^\s*(\d+(?:\.\d+)?)\s*(?:["″]|in(?:ch)?)?\s*$/i)?.[1];
  return {
    composition: compose,
    finishing: details.join(locale === 2 ? " · " : " · "),
    width: inch ? (locale === 0 ? `${inch}″` : locale === 1 ? `${inch} in` : `${inch} 英寸`) : width,
  };
}
