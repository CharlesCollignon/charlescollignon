/**
 * Project data that doesn't change between languages.
 * Localized copy lives in `messages/<locale>.json` under `projects.<slug>`.
 */
export type Project = {
  slug: "phronesis" | "pluclair" | "mip" | "bitcoin-tracker";
  year: string;
  /** Brand accent, used when the project takes over the page. */
  accent: string;
  /** Text colour that reads on `accent`. */
  onAccent: string;
  url?: string;
  repo?: string;
  stack: string[];
  featured: boolean;
  image?: string;
  hoverImage?: string;
};

export const projects: Project[] = [
  {
    slug: "phronesis",
    year: "2026",
    accent: "#FFBF00",
    onAccent: "#0a0a0a",
    url: "https://www.phronesis-france.com",
    repo: "https://github.com/CharlesCollignon/phronesis",
    stack: ["Next.js", "Drizzle", "Postgres", "ECharts", "AI SDK"],
    featured: true,
  },
  {
    slug: "pluclair",
    year: "2026",
    accent: "#fa9842",
    onAccent: "#0a0a10",
    url: "https://pluclair.com",
    repo: "https://github.com/CharlesCollignon/finance-tracker",
    stack: ["Next.js", "Expo", "Supabase", "WebGL", "TypeScript"],
    featured: true,
  },
  {
    slug: "mip",
    year: "2026",
    accent: "#c8403c",
    onAccent: "#ffffff",
    stack: ["TanStack Start", "ECharts", "MapLibre", "Tailwind", "Radix"],
    featured: true,
  },
  {
    slug: "bitcoin-tracker",
    year: "2025",
    accent: "#f0b90b",
    onAccent: "#0a0a0a",
    url: "https://bitcoin-tracker-nine.vercel.app/",
    stack: ["Next.js", "React", "Charts"],
    featured: false,
    image: "/binance-tracker-website.png",
    hoverImage: "/binance-tracker-app.png",
  },
];
