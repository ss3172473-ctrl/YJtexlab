/** Read the ink/thread color from the actual protected, same-origin image. */
export function paintedAccent(image: HTMLImageElement, fallback: string) {
  try {
    const canvas = document.createElement("canvas");
    canvas.width = 126;
    canvas.height = 168;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return fallback;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    const samples: { r: number; g: number; b: number; light: number }[] = [];
    for (let y = 4; y < canvas.height - 4; y++) for (let x = 4; x < canvas.width - 4; x++) {
      const i = 4 * (y * canvas.width + x);
      if (data[i + 3] < 240) continue;
      const [r, g, b] = [data[i], data[i + 1], data[i + 2]];
      samples.push({ r, g, b, light: (r * 2126 + g * 7152 + b * 722) / 10_000 });
    }
    if (!samples.length) return fallback;
    samples.sort((a, b) => a.light - b.light);
    const lo = samples[Math.floor(samples.length * .10)].light;
    const hi = samples[Math.floor(samples.length * .73)].light;
    // A small set of dark motif threads can be meaningful even on white ground.
    const q = hi - lo > 28 ? .22 : .45;
    const rank = Math.min(samples.length - 1, Math.floor(samples.length * q));
    const lower = Math.max(0, rank - Math.floor(samples.length * .045));
    let chosen = samples.slice(lower, Math.min(samples.length, rank + Math.max(1, Math.floor(samples.length * .045))));
    const hex = /^#([0-9a-f]{6})$/i.exec(fallback)?.[1];
    const paper = samples[Math.floor(samples.length * .50)].light;
    const motifCount = samples.filter((p) => p.light < paper - 30).length;
    const motifRatio = motifCount / samples.length;
    if (hex && paper > 213 && motifRatio >= .009 && motifRatio <= .165) {
      const hint = [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16));
      const colorRange = Math.max(...hint) - Math.min(...hint);
      const mean = (hint[0] + hint[1] + hint[2]) / 3;
      const threads = samples.filter(({ r, g, b, light }) => {
        if (light > Math.min(225, paper - 22)) return false;
        const channels = [r, g, b];
        const spread = Math.max(...channels) - Math.min(...channels);
        if (colorRange < 24) return mean < 135 && light < paper - 38 && spread < 48;
        if (spread < 20) return false;
        const distances = [0, 1, 2].reduce((sum, index) =>
          sum + Math.abs((channels[index] - Math.min(...channels)) / spread - (hint[index] - Math.min(...hint)) / colorRange), 0);
        return distances < 0.94;
      });
      if (threads.length >= Math.max(7, Math.floor(samples.length * .001))) chosen = threads;
    }
    const channel = (key: "r" | "g" | "b") => {
      const values = chosen.map((p) => p[key]).sort((a, b) => a - b);
      return values[Math.floor(values.length / 2)];
    };
    return `rgb(${channel("r")}, ${channel("g")}, ${channel("b")})`;
  } catch {
    // Metadata color is the same SKU, never the outgoing or representative SKU.
    return fallback;
  }
}
