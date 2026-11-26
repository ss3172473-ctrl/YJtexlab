/** Shared with public access responses; preserve the existing UTF-16 truncation. */
export function customerWelcomeName(name: string) {
  return name.slice(0, 100);
}
