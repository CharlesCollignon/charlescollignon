import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

// Teach tailwind-merge the custom font sizes from the @theme in globals.css,
// otherwise `text-h2` is mistaken for a colour and dropped next to `text-zinc-*`.
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      text: ["eyebrow", "body", "lead", "h3", "h2", "display"],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
