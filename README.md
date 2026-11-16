# Charles Collignon – Portfolio

Personal site of Charles Collignon, Engineering Manager, Design and Product.
Live at [charlescollignon.com](https://www.charlescollignon.com) (English) and
[charlescollignon.com/fr](https://www.charlescollignon.com/fr) (French).

## What's inside

- **Home**: a Spline 3D hero whose camera follows the scroll, a manifesto that lights up word by word, and full-screen project panels that stack as you scroll, each in its project's own colours.
- **Case studies** (`/work/[slug]`): [Phronesis](https://www.phronesis-france.com), [Pluclair](https://pluclair.com) and QuantCube's Macro Intelligence Platform. The MIP visuals are redrawn diagrams because the platform is private; they contain no client data.
- **Interactions**: smooth scrolling, magnetic buttons, a context-aware cursor, text reveals, tilting device frames, and a horizontal gallery pinned to the scroll. Motion respects "reduce motion", touch devices skip the pointer effects, and constrained devices get a still frame instead of WebGL.
- **English and French**: English at `/` and French at `/fr`, with hreflang tags, a sitemap, JSON-LD and generated Open Graph images for every page.

## Stack

- Next.js 16 (App Router, static generation) and React 19
- TypeScript and Tailwind CSS 4
- `next-intl`
- GSAP (ScrollTrigger, SplitText), Lenis and Motion
- Spline and React Three Fiber
- Vercel Analytics and Speed Insights

## Develop

```bash
npm install
npm run dev     # http://localhost:3000
npm run lint
npm run build
```

## Where things live

| Path | What |
| --- | --- |
| `app/[locale]/` | Pages: home, case studies, 404, OG images |
| `components/sections/` | Home sections: hero, about, work, contact, footer |
| `components/work/`, `components/case/` | Project panels, device frames, MIP diagrams, case study layout |
| `components/motion/` | Animation building blocks |
| `content/projects.ts` | Project data: colours, figures, screenshots |
| `messages/{en,fr}.json` | All copy, in both languages |
| `public/work/` | Project screenshots (WebP) |

## Contact

📧 collignoncharles@gmail.com · 💼 [LinkedIn](https://www.linkedin.com/in/charles-collignon/) · [GitHub](https://github.com/CharlesCollignon)

© 2026 Charles Collignon
