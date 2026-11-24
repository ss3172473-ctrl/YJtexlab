// Match the CSS collection breakpoints and desktop span packing. Cards without a
// photo still occupy their slots, so the first row never pulls in a second row.
export function welcomeRowCovers(
  covers: readonly { image: string | null; span: number }[],
  viewportWidth: number,
  desktopColumns: number,
) {
  const columns = viewportWidth <= 460 ? 2
    : viewportWidth <= 700 ? 3
    : viewportWidth <= 900 ? 4 : desktopColumns;
  const warmed = new Set<string>();
  let slots = 0;
  for (const { image, span } of covers) {
    slots += viewportWidth <= 900 ? 1 : span;
    if (slots > columns) break;
    if (image) warmed.add(image);
  }
  return warmed;
}
