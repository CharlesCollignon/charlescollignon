/**
 * The two ticker rows in About. Tools link to their official site; skills
 * link to the case study that best shows them in practice.
 */
export type SkillLink = {
  label: string;
  /** External URL, or an internal path such as "/work/mip". */
  href: string;
};

export const SKILLS: SkillLink[] = [
  { label: "Product design", href: "/work/pluclair" },
  { label: "Design systems", href: "/work/mip" },
  { label: "Team leadership", href: "/work/mip" },
  { label: "Design ops", href: "/work/mip" },
  { label: "Accessibility", href: "/work/phronesis" },
  { label: "Motion design", href: "/work/pluclair" },
  { label: "Data visualisation", href: "/work/phronesis" },
  { label: "Prototyping", href: "/work/phronesis" },
  { label: "Figma", href: "https://www.figma.com" },
];

export const STACK: SkillLink[] = [
  { label: "TypeScript", href: "https://www.typescriptlang.org" },
  { label: "React", href: "https://react.dev" },
  { label: "Next.js", href: "https://nextjs.org" },
  { label: "TanStack", href: "https://tanstack.com" },
  { label: "Tailwind CSS", href: "https://tailwindcss.com" },
  { label: "Motion", href: "https://motion.dev" },
  { label: "GSAP", href: "https://gsap.com" },
  { label: "Three.js", href: "https://threejs.org" },
  { label: "ECharts", href: "https://echarts.apache.org" },
  { label: "MapLibre", href: "https://maplibre.org" },
  { label: "Postgres", href: "https://www.postgresql.org" },
  { label: "Supabase", href: "https://supabase.com" },
];

export const isExternal = (href: string) => /^https?:\/\//.test(href);
