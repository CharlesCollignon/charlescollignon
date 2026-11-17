# Charles Collignon – Portfolio

Personal site of Charles Collignon, Engineering Manager, Design and Product.
Live at [charlescollignon.com](https://www.charlescollignon.com) (English) and
[charlescollignon.com/fr](https://www.charlescollignon.com/fr) (French).

## What's inside

- **Home**: a 3D character (three.js, Mixamo motion capture) that rises in, waves, follows the cursor and moves with the scroll, a manifesto that lights up word by word, and full-screen project panels that stack as you scroll, each in its project's own colours.
- **Case studies** (`/work/[slug]`): [Phronesis](https://www.phronesis-france.com), [Pluclair](https://pluclair.com) and QuantCube's Macro Intelligence Platform. The MIP visuals are redrawn diagrams because the platform is private; they contain no client data.
- **Interactions**: smooth scrolling, magnetic buttons, a context-aware cursor, text reveals, tilting device frames, and a horizontal gallery pinned to the scroll. Motion respects "reduce motion", touch devices skip the pointer effects, and constrained devices get a still frame instead of WebGL.
- **English and French**: English at `/` and French at `/fr`, with hreflang tags, a sitemap, JSON-LD and generated Open Graph images for every page.

## Stack

- Next.js 16 (App Router, static generation) and React 19
- TypeScript and Tailwind CSS 4
- `next-intl`
- GSAP (ScrollTrigger, SplitText), Lenis and Motion
- three.js with React Three Fiber, for the character
- Vercel Analytics and Speed Insights

## The character

The character is "[Skinny humanoid metallic model](https://sketchfab.com/3d-models/skinny-humanoid-metallic-model-d8d52ed456bd4d45a68f145238c700a5)" by Syed Mohammad Hasan (CC BY 4.0, credited in the footer), skinned to a Mixamo skeleton and animated with Mixamo motion capture. The rig (`components/character/rig.ts`) layers the clips and adds the scroll choreography, cursor tracking and reactions.

| Step | Command | Result |
| --- | --- | --- |
| Make the Mixamo upload | `npm run character:mixamo` | `assets/models/character.source.glb` (the Sketchfab GLB) → `assets/models/character-mixamo.obj` |
| Build the site's model | `npm run character:build` | `character.source.glb` + `assets/animations/*.fbx` → `public/models/character.glb` |

The build takes the mesh, skeleton and skin weights from `assets/animations/quick-formal-bow.fbx` (downloaded from Mixamo *With Skin*) and the T-pose from `breathing-idle.fbx` (*Without Skin*). It retargets every FBX in `assets/animations/` onto the skeleton and gives the model a dark chrome finish over its own normal map. Clips made on any Mixamo character work.

To add an animation: in Mixamo, download it as *FBX Binary, 30 fps*, with *In Place* checked if offered. Save it in `assets/animations/`, run `npm run character:build`, then use it by its file name in `components/character/rig.ts`.

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
