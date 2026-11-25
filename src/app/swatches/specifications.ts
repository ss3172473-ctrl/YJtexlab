import type { Language } from "./language";

const fibers: Record<string, [string, string, string, string]> = {
  C: ["면", "cotton", "棉", "綿"], N: ["나일론", "nylon", "锦纶", "ナイロン"],
  P: ["폴리에스터", "polyester", "涤纶", "ポリエステル"], R: ["레이온", "rayon", "粘胶纤维", "レーヨン"],
  PU: ["폴리우레탄", "polyurethane", "聚氨酯纤维", "ポリウレタン"],
  "메탈사": ["메탈사", "metallic yarn", "金属纱", "メタリック糸"],
  "P방적": ["폴리에스터 방적사", "spun polyester", "涤纶短纤纱", "ポリエステル紡績糸"],
};

export function localizedFabricSpecs(raw: string, width: string, language: Language) {
  const locale = { ko: 0, en: 1, "zh-CN": 2, ja: 3 } as const;
  const index = locale[language];
  const details: string[] = [];
  let rest = raw.trim();
  for (const [phrase, translated] of [
    ["우라기리", ["우라기리", "Uragiri (cut-float weave)", "剪花织法（Uragiri）", "ウラギリ"]],
    ["실크가공", ["실크가공", "silk-like finish", "仿丝整理", "シルク調加工"]],
    ["도비", ["도비", "dobby weave", "多臂织法", "ドビー織り"]],
    ["그라데이션", ["그라데이션", "gradient pattern", "渐变图案", "グラデーション柄"]],
  ] as const) {
    if (rest.includes(phrase)) { details.push(translated[index]); rest = rest.replace(phrase, " "); }
  }
  rest = rest.replace(/(\d+\s*:\s*\d+)\s*배열/g, (_, ratio: string) => {
    details.push([ratio + " 배열", ratio + " layout", ratio + " 排列", ratio + " 配列"][index]);
    return " ";
  }).trim().replace(/\s+/g, " ");

  const matches = Array.from(rest.matchAll(/(P방적|메탈사|PU|C|N|P|R)\s*(\d+(?:\.\d+)?)\s*%?/g));
  const parsed = matches.length > 0 && !rest.replace(/(P방적|메탈사|PU|C|N|P|R)\s*(\d+(?:\.\d+)?)\s*%?/g, "").trim();
  const compose = parsed
    ? matches.map(([, fiber, amount]) => language === "ja" ? `${fibers[fiber][index]} ${amount}%` : index === 2 ? `${amount}%${fibers[fiber][index]}` : `${amount}% ${fibers[fiber][index]}`).join(index === 2 ? "／" : " / ")
    : /[가-힣]/.test(rest) && index !== 0
      ? ["", "Composition not specified", "成分未注明", "混用率の記載なし"][index] : rest;
  const inch = width.match(/^\s*(\d+(?:\.\d+)?)\s*(?:["″]|in(?:ch)?)?\s*$/i)?.[1];
  return {
    composition: compose,
    finishing: details.join(" · "),
    width: inch ? `${inch}${{ ko: "″", en: " in", "zh-CN": " 英寸", ja: " インチ" }[language]}` : width,
  };
}
