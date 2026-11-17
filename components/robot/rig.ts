import { PropertyBinding, type Camera, type Object3D } from "three";

/**
 * Procedural animation for the robot model (public/models/robot.glb).
 *
 * The model is static (no baked animation), so everything here is code:
 *  1. Scroll choreography: one pose per page section (`data-camera`),
 *     blended as each section reaches the top of the viewport.
 *  2. Idle life: breathing, weight shift with counter-rotating hips, a
 *     looping arm gesture, eyes that blink, a slow look-around.
 *  3. Pointer: head, then torso, then the whole body turn toward the cursor;
 *     the camera parallaxes slightly.
 *  4. Momentum: the robot leans with scroll speed and settles back.
 *  5. Entrance: it rises into frame on load.
 *
 * Every value eases toward its target with a frame-rate independent damp,
 * so scroll jumps never snap. Units are Spline's (camera ~900 away).
 */

type Pose = {
  cam: [number, number, number];
  /** Robot offset from its authored position, and its turn/tilt (radians). */
  x: number;
  y: number;
  ry: number;
  rx: number;
};

/** Landscape screens: the robot steps aside for left-aligned text. */
const WIDE: Record<string, Pose> = {
  hero: { cam: [0, 160, 900], x: 0, y: 0, ry: 0, rx: 0 },
  about: { cam: [0, 150, 1350], x: 360, y: -20, ry: -0.55, rx: 0.04 },
  work: { cam: [0, 70, 1300], x: 330, y: -50, ry: -0.7, rx: -0.14 },
  contact: { cam: [0, 170, 1150], x: 300, y: -10, ry: -0.42, rx: 0 },
};

/** Portrait screens: text spans the width, so the robot recedes behind it. */
const TALL: Record<string, Pose> = {
  hero: { cam: [0, 170, 1150], x: 0, y: 0, ry: 0, rx: 0 },
  about: { cam: [0, 240, 2100], x: 0, y: -40, ry: 0.5, rx: 0.05 },
  work: { cam: [0, 120, 1900], x: 0, y: -80, ry: -0.6, rx: -0.12 },
  contact: { cam: [0, 120, 1500], x: 0, y: 0, ry: -0.25, rx: 0 },
};

const KEYS = ["camX", "camY", "camZ", "x", "y", "ry", "rx"] as const;
type State = Record<(typeof KEYS)[number], number>;

const smoothstep = (t: number) => t * t * (3 - 2 * t);
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
/** Frame-rate independent exponential ease toward a target. */
const damp = (current: number, target: number, rate: number, dt: number) =>
  current + (target - current) * (1 - Math.exp(-rate * dt));

type Rest = { px: number; py: number; x: number; y: number; z: number };
/** The authored transform, recorded once so re-creating the rig never drifts. */
const rest = (obj: Object3D): Rest =>
  (obj.userData.rest ??= {
    px: obj.position.x,
    py: obj.position.y,
    x: obj.rotation.x,
    y: obj.rotation.y,
    z: obj.rotation.z,
  });

type Joint = Rest & { obj: Object3D };
const joint = (obj: Object3D): Joint => ({ obj, ...rest(obj) });

/**
 * Find nodes by their Spline name. three's GLTFLoader sanitises names
 * ("Top part" becomes "Top_part"), so look them up the same way.
 */
export const nodeName = (name: string) => PropertyBinding.sanitizeNodeName(name);

export function createRig(model: Object3D, camera: Camera) {
  const find = (name: string) => model.getObjectByName(nodeName(name));
  const all = (name: string) => {
    const out: Object3D[] = [];
    const wanted = nodeName(name);
    model.traverse((o) => o.name === wanted && out.push(o));
    return out;
  };

  const bot = find("Bot");
  if (!bot) return null;
  const top = find("Top part");
  const head = find("Head");
  const hips = find("Pelvic");
  const eyes = find("Eyes");

  const r = rest(bot);
  const base = { px: r.px, py: r.py, rx: r.x, ry: r.y, rz: r.z };
  const topJ = top && joint(top);
  const headJ = head && joint(head);
  const hipsJ = hips && joint(hips);
  // Both arm chains (the left one is a mirrored instance of the right).
  const arms = all("arm").map(joint);
  const forearms = all("forearm").map(joint);
  const elbows = all("elbow").map(joint);
  const hands = all("Hand LEFT").map(joint);

  let stops: { top: number; key: string }[] = [];
  let wide = true;
  const measure = () => {
    wide = window.innerWidth / window.innerHeight >= 1;
    stops = Array.from(document.querySelectorAll<HTMLElement>("[data-camera]"))
      .map((el) => ({
        top: el.getBoundingClientRect().top + window.scrollY,
        key: el.dataset.camera ?? "",
      }))
      .filter((s) => s.key in WIDE)
      .sort((a, b) => a.top - b.top);
  };

  const scrollPose = (): State => {
    const poses = wide ? WIDE : TALL;
    const from = (p: Pose): State => ({
      camX: p.cam[0], camY: p.cam[1], camZ: p.cam[2], x: p.x, y: p.y, ry: p.ry, rx: p.rx,
    });
    if (stops.length < 2) return from(poses.hero);

    const y = window.scrollY;
    let i = 0;
    while (i < stops.length - 2 && y >= stops[i + 1].top) i++;
    const a = from(poses[stops[i].key]);
    const b = from(poses[stops[i + 1].key]);
    const t = smoothstep(clamp((y - stops[i].top) / Math.max(stops[i + 1].top - stops[i].top, 1), 0, 1));
    const out = {} as State;
    for (const k of KEYS) out[k] = a[k] + (b[k] - a[k]) * t;
    return out;
  };

  // Pointer, normalised to [-1, 1], with the time it last moved.
  const pointer = { x: 0, y: 0, sx: 0, sy: 0, hx: 0, hy: 0, movedAt: -Infinity };
  const onPointer = (e: PointerEvent) => {
    if (e.pointerType === "touch") return;
    pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
    pointer.y = (e.clientY / window.innerHeight) * 2 - 1;
    pointer.movedAt = performance.now();
  };

  measure();
  // Start well below the frame: the robot rises in.
  const state: State = { ...scrollPose(), y: -1400 };
  bot.position.y = base.py + state.y;
  let lean = 0;
  let lastScroll = window.scrollY;
  let nextBlink = 2.5;

  const ro = new ResizeObserver(measure);
  ro.observe(document.body);
  window.addEventListener("pointermove", onPointer, { passive: true });

  return {
    update(rawDt: number, t: number) {
      const dt = Math.min(rawDt, 0.05);

      // Momentum: lean with scroll speed (px/s), then settle.
      const scroll = window.scrollY;
      const velocity = (scroll - lastScroll) / Math.max(dt, 1e-3);
      lastScroll = scroll;
      lean = damp(lean, clamp(velocity * 0.00006, -0.14, 0.14), 6, dt);

      // Pointer, or a slow look-around once it has been still for 3 s.
      const idle = performance.now() - pointer.movedAt > 3000;
      const tx = idle ? Math.sin(t * 0.35) * 0.5 : pointer.x;
      const ty = idle ? Math.sin(t * 0.23) * 0.25 : pointer.y;
      // The head reacts first, the body follows more lazily.
      pointer.hx = damp(pointer.hx, tx, idle ? 1.5 : 7, dt);
      pointer.hy = damp(pointer.hy, ty, idle ? 1.5 : 7, dt);
      pointer.sx = damp(pointer.sx, tx, idle ? 1 : 3, dt);
      pointer.sy = damp(pointer.sy, ty, idle ? 1 : 3, dt);

      const target = scrollPose();
      for (const k of KEYS) state[k] = damp(state[k], target[k], k === "y" ? 2.4 : 3.2, dt);

      const breathe = Math.sin(t * 1.7);
      const shift = Math.sin(t * 0.62);

      camera.position.set(
        state.camX + pointer.sx * 45,
        state.camY - pointer.sy * 25,
        state.camZ,
      );

      bot.position.x = base.px + state.x;
      bot.position.y = base.py + state.y + breathe * 2.5 - Math.abs(lean) * 40;
      bot.rotation.set(
        base.rx + state.rx + pointer.sy * 0.04 + lean,
        base.ry + state.ry + pointer.sx * 0.28 + Math.sin(t * 0.31) * 0.05,
        base.rz + shift * 0.022 - pointer.sx * 0.03,
      );

      if (hipsJ) hipsJ.obj.rotation.z = hipsJ.z - shift * 0.035;
      if (topJ) {
        topJ.obj.rotation.x = topJ.x + pointer.sy * 0.06 + breathe * 0.012;
        topJ.obj.rotation.y = topJ.y + pointer.hx * 0.14;
      }
      if (headJ) {
        headJ.obj.rotation.x = headJ.x + pointer.hy * 0.32;
        headJ.obj.rotation.y = headJ.y + pointer.hx * 0.5;
        headJ.obj.rotation.z = headJ.z - pointer.hx * 0.06;
      }

      // Arms: a slow, slightly out-of-phase gesture loop on each side.
      arms.forEach((j, i) => {
        j.obj.rotation.x = j.x + Math.sin(t * 0.9 + i * 0.7) * 0.18;
      });
      forearms.forEach((j, i) => {
        j.obj.rotation.x = j.x - 0.15 + Math.sin(t * 0.9 + i * 0.7 + 0.6) * 0.3;
      });
      elbows.forEach((j, i) => {
        j.obj.rotation.y = j.y + Math.sin(t * 0.7 + i) * 0.15;
      });
      hands.forEach((j, i) => {
        j.obj.rotation.z = j.z + Math.sin(t * 0.8 + i * 1.3) * 0.1;
      });

      // Blink every few seconds.
      if (eyes) {
        if (t > nextBlink + 0.16) nextBlink = t + 2.5 + Math.random() * 3.5;
        const k = t > nextBlink ? Math.abs(Math.sin(((t - nextBlink) / 0.16) * Math.PI)) : 0;
        eyes.scale.y = 1 - k * 0.9;
      }
    },
    dispose() {
      ro.disconnect();
      window.removeEventListener("pointermove", onPointer);
    },
  };
}

export type Rig = NonNullable<ReturnType<typeof createRig>>;
