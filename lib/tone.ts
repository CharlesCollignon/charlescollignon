/**
 * Whether a background colour is light or dark, for elements that float over
 * it (the glass header adapts its tint and labels to what's underneath).
 * Sections with a fixed colour declare it with `data-header-tone`.
 */
export function toneFor(hex: string): "light" | "dark" {
  const n = hex.replace("#", "");
  const full = n.length === 3 ? [...n].map((c) => c + c).join("") : n;
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16) / 255);
  // Relative luminance (sRGB), compared with the mid point between black and white.
  const lin = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  const l = 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  return l > 0.18 ? "light" : "dark";
}
