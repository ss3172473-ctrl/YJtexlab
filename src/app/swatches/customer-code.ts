export const customerCodeMaxLength = 4;
// Numeric legacy inputs are valid. A code with letters also needs a digit.
export const customerCodePattern = "(?=.*[0-9])[A-Z0-9]{4}";
const format = new RegExp(`^${customerCodePattern}$`);

/** Accept partial input without truncating or dropping invalid characters. */
export function customerCodeInput(value: unknown) {
  if (typeof value !== "string" || value.length > 128) return null;
  const code = value.trim();
  if (code.length > customerCodeMaxLength || /[^A-Za-z0-9]/.test(code)) return null;
  return code.toUpperCase();
}

export function customerCode(value: unknown) {
  const code = customerCodeInput(value);
  return code !== null && format.test(code) ? code : null;
}
