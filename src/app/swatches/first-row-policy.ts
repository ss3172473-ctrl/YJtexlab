// A missing selector is the production default. baseline (and unknown values)
// use the ordinary authenticated gallery, permitting a like-for-like rollback.
export function firstRowEnabled(search: string): boolean {
  const modes = new URLSearchParams(search).getAll("swatchPerf");
  return modes.length === 0 || (modes.length === 1 && ["firstrow", "split"].includes(modes[0]));
}

// Candidate rollout policy: explicit firstrow retains the previous strategy;
// baseline/ambiguous selectors bypass speculative delivery entirely.
export function splitRowEnabled(search: string, hidden: boolean, saveData: boolean): boolean {
  const modes = new URLSearchParams(search).getAll("swatchPerf");
  return !hidden && !saveData && (modes.length === 0 || (modes.length === 1 && modes[0] === "split"));
}
