export const customerCodeMaxLength = 4;
export const customerCodePattern = "[0-9]{4}";
const format = new RegExp(`^${customerCodePattern}$`);

export function customerCode(value: unknown) {
  const code = typeof value === "string" ? value.trim() : "";
  return format.test(code) ? code : null;
}
