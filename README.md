# Charles Collignon – Portfolio

Personal site of Charles Collignon, Engineering Manager, Design and Product.
Live at [charlescollignon.com](https://www.charlescollignon.com) (English) and
[charlescollignon.com/fr](https://www.charlescollignon.com/fr) (French).

## What's inside

- **Home**: a 3D robot (three.js) that rises in, follows the cursor and moves with the scroll, a manifesto that lights up word by word, and full-screen project panels that stack as you scroll, each in its project's own colours.
- **Case studies** (`/work/[slug]`): [Phronesis](https://www.phronesis-france.com), [Pluclair](https://pluclair.com) and QuantCube's Macro Intelligence Platform. The MIP visuals are redrawn diagrams because the platform is private; they contain no client data.
- **Interactions**: smooth scrolling, magnetic buttons, a context-aware cursor, text reveals, tilting device frames, and a horizontal gallery pinned to the scroll. Motion respects "reduce motion", touch devices skip the pointer effects, and constrained devices get a still frame instead of WebGL.
- **English and French**: English at `/` and French at `/fr`, with hreflang tags, a sitemap, JSON-LD and generated Open Graph images for every page.

## Stack

- Next.js 16 (App Router, static generation) and React 19
- TypeScript and Tailwind CSS 4
- `next-intl`
- GSAP (ScrollTrigger, SplitText), Lenis and Motion
- three.js with React Three Fiber, for the robot
- Vercel Analytics and Speed Insights

## The robot

The robot is a GLB exported from Spline. It is animated in code (`components/robot/`), with motion-capture clips from Mixamo blended in.

| Step | Command | Result |
| --- | --- | --- |
| Optimise the model | `npm run robot:optimize` | `assets/models/robot.source.glb` → `public/models/robot.glb` |
| Make the Mixamo upload | `npm run robot:mixamo` | a T-posed single-mesh OBJ, `assets/models/robot-tpose.obj` |
| Bake the animations | `npm run robot:bake` | `assets/animations/*.fbx` (Mixamo, *FBX Binary, Without Skin, 30 fps*) → `public/models/robot-clips.json` |

The bake retargets each Mixamo bone onto the matching robot part, so the robot keeps its materials, LED face and emblem.

Other characters can be tried with `?model=<key>` (listed in `CHARACTERS`, `components/robot/robot-model.tsx`). `?model=humanoid` shows "Humanoid Model" by CowboyTruman (CC BY 4.0, credited on the page while it is shown), prepared with `npm run humanoid:optimize` from the Sketchfab download in `assets/models/`. To add an animation, drop the FBX in `assets/animations/`, run the bake, then reference the clip by its file name in `components/robot/rig.ts`.

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
