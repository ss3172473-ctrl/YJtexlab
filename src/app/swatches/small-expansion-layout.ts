export type SmallExpansion = {
  cardWidth: number; gap: number; leftCount: number; rightCount: number; leftWidth: number; rightWidth: number;
};

/** Plan only complete, full-size cards. Keep the cover fixed and prefer balanced rails. */
export function fitSmallExpansion(count: number, cardWidth: number, left: number, right: number, preferredGap: number): SmallExpansion | undefined {
  if (cardWidth <= 0 || (count !== 1 && count !== 2)) return;
  const gaps = Array.from(new Set([preferredGap, 10, 6]));
  const fits = (n: number, room: number, gap: number) => n * (cardWidth + gap) <= room + .05;
  const plan = (gap: number, leftCount: number): SmallExpansion => {
    const rightCount = count - leftCount;
    const railWidth = (n: number) => n ? n * cardWidth + (n - 1) * gap : 0;
    return { cardWidth, gap, leftCount, rightCount, leftWidth: railWidth(leftCount), rightWidth: railWidth(rightCount) };
  };
  if (count === 2) for (const gap of gaps) {
    if (fits(1, left, gap) && fits(1, right, gap)) return plan(gap, 1);
  }
  for (const gap of gaps) {
    const fitsLeft = fits(count, left, gap), fitsRight = fits(count, right, gap);
    if (fitsLeft || fitsRight) return plan(gap, fitsLeft && (!fitsRight || left > right) ? count : 0);
  }
}
