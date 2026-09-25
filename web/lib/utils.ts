import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

const customTwMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      shadow: [{ shadow: ["card", "pop"] }],
    },
  },
});

/** Class-name merge helper (shadcn/ui convention). */
export function cn(...inputs: ClassValue[]) {
  return customTwMerge(clsx(inputs));
}
