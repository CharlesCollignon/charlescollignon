/**
 * Project data that doesn't change between languages.
 * Localized copy lives in `messages/<locale>.json` under `projects.<slug>`
 * (card copy) and `caseStudies.<slug>` (case study copy, metric labels,
 * highlight text and image captions).
 */

export type ProjectSlug = "phronesis" | "pluclair" | "mip" | "bitcoin-tracker";

/** A figure shown in the case study. Numbers are formatted per locale. */
export type Metric = {
  /** Message key under `caseStudies.<slug>.metrics`. */
  key: string;
  value: number;
  prefix?: string;
  suffix?: string;
};

export type Shot = {
  src: string;
  width: number;
  height: number;
  device: "desktop" | "mobile";
  /** Message key under `caseStudies.<slug>.shots`. */
  key: string;
};

/** Redrawn, data-free illustrations (no real screenshots of private work). */
export type Visual =
  | "mip-engine"
  | "mip-modules"
  | "mip-before-after"
  | "mip-anatomy"
  | "mip-horizon";

export type Project = {
  slug: ProjectSlug;
  year: string;
  /** Brand accent, used when the project takes over the page. */
  accent: string;
  /** Text colour that reads on `accent`. */
  onAccent: string;
  /** Accent as small text on `surface` (AA). Defaults to `accent`. */
  accentText?: string;
  /** Page background while the case study is in view. */
  surface: string;
  onSurface: string;
  url?: string;
  repo?: string;
  stack: string[];
  featured: boolean;
  /** Message keys under `caseStudies.<slug>.highlights`. */
  highlights: string[];
  metrics: Metric[];
  /** Cover for cards: first frame, and a tall page that scrolls on hover. */
  cover?: { src: string; width: number; height: number };
  scroll?: { src: string; width: number; height: number };
  shots: Shot[];
  visuals: Visual[];
};

const desktop = (src: string, key: string): Shot => ({
  src,
  key,
  width: 2400,
  height: 1500,
  device: "desktop",
});
const mobile = (src: string, key: string): Shot => ({
  src,
  key,
  width: 1170,
  height: 2532,
  device: "mobile",
});

export const projects: Project[] = [
  {
    slug: "phronesis",
    year: "2026",
    accent: "#FFBF00",
    onAccent: "#0a0a0a",
    surface: "#fafaf7",
    onSurface: "#0a0a0a",
    url: "https://www.phronesis-france.com",
    repo: "https://github.com/CharlesCollignon/phronesis",
    stack: [
      "Next.js 16",
      "React 19",
      "TypeScript",
      "Tailwind 4",
      "Drizzle",
      "Postgres (Neon)",
      "ECharts",
      "AI SDK",
      "Clerk",
      "Vercel",
    ],
    featured: true,
    highlights: ["hemicycle", "compass", "neutral", "cache", "seo"],
    metrics: [
      { key: "bills", value: 3230 },
      { key: "votes", value: 9895 },
      { key: "positions", value: 2240295 },
      { key: "dilemmas", value: 19 },
    ],
    cover: { src: "/work/phronesis/desktop-home.webp", width: 2400, height: 1500 },
    scroll: { src: "/work/phronesis/full-home.webp", width: 1600, height: 5591 },
    shots: [
      desktop("/work/phronesis/desktop-vote.webp", "vote"),
      desktop("/work/phronesis/desktop-bill.webp", "bill"),
      desktop("/work/phronesis/desktop-compass.webp", "compass"),
      desktop("/work/phronesis/desktop-groups.webp", "groups"),
      desktop("/work/phronesis/desktop-officials.webp", "officials"),
      mobile("/work/phronesis/mobile-home.webp", "mobileHome"),
      mobile("/work/phronesis/mobile-vote.webp", "mobileVote"),
      mobile("/work/phronesis/mobile-compass.webp", "mobileCompass"),
      mobile("/work/phronesis/mobile-bill.webp", "mobileBill"),
    ],
    visuals: [],
  },
  {
    slug: "pluclair",
    year: "2026",
    accent: "#fa9842",
    onAccent: "#0a0a10",
    surface: "#0a0a10",
    onSurface: "#ececf1",
    url: "https://pluclair.com",
    repo: "https://github.com/CharlesCollignon/finance-tracker",
    stack: [
      "Next.js 16",
      "Expo",
      "React Native",
      "TypeScript",
      "Supabase",
      "Tailwind 4",
      "Base UI",
      "Motion",
      "Lenis",
      "OGL (WebGL)",
      "Zod",
      "Vercel",
    ],
    featured: true,
    highlights: ["ask", "statements", "light", "couples", "year"],
    metrics: [
      { key: "commits", value: 1360, suffix: "+" },
      { key: "modules", value: 281 },
      { key: "formats", value: 9 },
      { key: "platforms", value: 2 },
    ],
    cover: { src: "/work/pluclair/desktop-landing.webp", width: 2400, height: 1500 },
    scroll: { src: "/work/pluclair/full-landing.webp", width: 1200, height: 16000 },
    shots: [
      desktop("/work/pluclair/desktop-bearing.webp", "bearing"),
      desktop("/work/pluclair/desktop-calendar.webp", "calendar"),
      desktop("/work/pluclair/desktop-history.webp", "history"),
      desktop("/work/pluclair/desktop-plan.webp", "plan"),
      desktop("/work/pluclair/desktop-recurring.webp", "recurring"),
      desktop("/work/pluclair/desktop-analysis.webp", "analysis"),
      desktop("/work/pluclair/desktop-transactions.webp", "transactions"),
      mobile("/work/pluclair/mobile-bearing.webp", "mobileBearing"),
      mobile("/work/pluclair/mobile-calendar.webp", "mobileCalendar"),
      mobile("/work/pluclair/mobile-history.webp", "mobileHistory"),
      mobile("/work/pluclair/mobile-plan.webp", "mobilePlan"),
      mobile("/work/pluclair/mobile-analysis.webp", "mobileAnalysis"),
      mobile("/work/pluclair/mobile-recurring.webp", "mobileRecurring"),
    ],
    visuals: [],
  },
  {
    slug: "mip",
    year: "2026",
    accent: "#c8403c",
    onAccent: "#ffffff",
    accentText: "#ef6b63",
    surface: "#0a090d",
    onSurface: "#f4f4f5",
    stack: [
      "TanStack Start",
      "TanStack Query",
      "React 19",
      "TypeScript",
      "Vite 8",
      "ECharts 6",
      "MapLibre GL",
      "Tailwind 4",
      "Radix",
      "Zod 4",
      "TipTap",
      "Vitest",
    ],
    featured: true,
    highlights: ["engine", "views", "system", "phone", "horizon", "performance"],
    metrics: [
      { key: "modules", value: 32 },
      { key: "categories", value: 11 },
      { key: "views", value: 8 },
      { key: "files", value: 83, prefix: "−", suffix: "%" },
      { key: "tests", value: 611 },
      { key: "keys", value: 2299 },
    ],
    shots: [],
    visuals: [
      "mip-engine",
      "mip-modules",
      "mip-anatomy",
      "mip-before-after",
      "mip-horizon",
    ],
  },
  {
    slug: "bitcoin-tracker",
    year: "2025",
    accent: "#f0b90b",
    onAccent: "#0a0a0a",
    surface: "#0b0e11",
    onSurface: "#eaecef",
    url: "https://bitcoin-tracker-nine.vercel.app/",
    stack: ["Next.js", "React", "Charts"],
    featured: false,
    highlights: [],
    metrics: [],
    cover: {
      src: "/work/bitcoin-tracker-website.webp",
      width: 1894,
      height: 889,
    },
    scroll: { src: "/work/bitcoin-tracker-app.webp", width: 1920, height: 5004 },
    shots: [],
    visuals: [],
  },
];

export const getProject = (slug: string) =>
  projects.find((p) => p.slug === slug);

export const featuredProjects = projects.filter((p) => p.featured);
