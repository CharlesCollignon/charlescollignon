import type { Application } from "@splinetool/runtime";

/**
 * Procedural motion for the Spline robot, layered on top of what the Spline
 * scene already animates (arm idle loop, head/torso look-at on the cursor).
 *
 * We only drive parts Spline leaves alone: the camera, the robot's root
 * (`Bot`) and its hips (`Pelvic`). Every value is eased toward its target
 * each frame (frame-rate independent), so scroll jumps never snap.
 *
 * Layers, summed each frame:
 *  1. Scroll choreography: one pose per page section (`data-camera`), blended
 *     as each section reaches the top of the viewport.
 *  2. Idle life: breathing bob, weight shift with counter-rotating hips, a
 *     slow look-around when the pointer is still.
 *  3. Pointer: the whole body turns toward the cursor; the camera parallaxes.
 *  4. Momentum: the robot leans with scroll speed and settles back.
 *
 * The Spline scene plays its own intro (the robot rises into frame), so the
 * rig is attached with `whenAtRest` once that intro has finished.
 */

type Pose = {
  /** Camera position. */
  cam: [number, number, number];
  /** Root offset from its authored position, and its turn/tilt (radians). */
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
type Key = (typeof KEYS)[number];
type State = Record<Key, number>;

const smoothstep = (t: number) => t * t * (3 - 2 * t);
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
/** Frame-rate independent exponential ease toward a target. */
const damp = (current: number, target: number, rate: number, dt: number) =>
  current + (target - current) * (1 - Math.exp(-rate * dt));

export function createRobotRig(spline: Application) {
  const camera = spline.findObjectByName("Camera 2") ?? spline.findObjectByName("Camera");
  const bot = spline.findObjectByName("Bot");
  const hips = spline.findObjectByName("Pelvic");
  if (!camera || !bot) return null;

  const base = {
    x: bot.position.x,
    y: bot.position.y,
    rx: bot.rotation.x,
    ry: bot.rotation.y,
    rz: bot.rotation.z,
    hipsRz: hips?.rotation.z ?? 0,
  };

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

  /** The choreographed pose for the current scroll position. */
  const scrollPose = (): State => {
    const poses = wide ? WIDE : TALL;
    const fallback = poses.hero;
    if (stops.length === 0)
      return { camX: fallback.cam[0], camY: fallback.cam[1], camZ: fallback.cam[2], x: 0, y: 0, ry: 0, rx: 0 };

    const y = window.scrollY;
    let i = 0;
    while (i < stops.length - 2 && y >= stops[i + 1].top) i++;
    const a = poses[stops[i].key];
    const b = poses[stops[Math.min(i + 1, stops.length - 1)].key];
    const span = Math.max(stops[Math.min(i + 1, stops.length - 1)].top - stops[i].top, 1);
    const t = smoothstep(clamp((y - stops[i].top) / span, 0, 1));
    const mix = (p: number, q: number) => p + (q - p) * t;
    return {
      camX: mix(a.cam[0], b.cam[0]),
      camY: mix(a.cam[1], b.cam[1]),
      camZ: mix(a.cam[2], b.cam[2]),
      x: mix(a.x, b.x),
      y: mix(a.y, b.y),
      ry: mix(a.ry, b.ry),
      rx: mix(a.rx, b.rx),
    };
  };

  // Pointer, normalised to [-1, 1], with the time it last moved.
  const pointer = { x: 0, y: 0, sx: 0, sy: 0, movedAt: -Infinity };
  const onPointer = (e: PointerEvent) => {
    if (e.pointerType === "touch") return;
    pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
    pointer.y = (e.clientY / window.innerHeight) * 2 - 1;
    pointer.movedAt = performance.now();
  };

  measure();
  const state: State = scrollPose();
  let lean = 0;
  let lastScroll = window.scrollY;
  let last = performance.now();
  let raf = 0;
  let running = false;

  const tick = (now: number) => {
    raf = requestAnimationFrame(tick);
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    const t = now / 1000;

    // Momentum: lean with scroll speed (px/s), then settle.
    const scroll = window.scrollY;
    const velocity = (scroll - lastScroll) / Math.max(dt, 1e-3);
    lastScroll = scroll;
    lean = damp(lean, clamp(velocity * 0.00006, -0.14, 0.14), 6, dt);

    // Pointer, or a slow look-around once it has been still for 3 s.
    const idle = now - pointer.movedAt > 3000;
    const tx = idle ? Math.sin(t * 0.35) * 0.45 : pointer.x;
    const ty = idle ? Math.sin(t * 0.23) * 0.2 : pointer.y;
    pointer.sx = damp(pointer.sx, tx, idle ? 1.2 : 4, dt);
    pointer.sy = damp(pointer.sy, ty, idle ? 1.2 : 4, dt);

    const target = scrollPose();
    for (const k of KEYS) state[k] = damp(state[k], target[k], k === "y" ? 2.2 : 3.2, dt);

    const breathe = Math.sin(t * 1.7);
    const shift = Math.sin(t * 0.62);

    camera.position.x = state.camX + pointer.sx * 45;
    camera.position.y = state.camY - pointer.sy * 25;
    camera.position.z = state.camZ;

    bot.position.x = base.x + state.x;
    bot.position.y = base.y + state.y + breathe * 2.5 - Math.abs(lean) * 40;
    bot.rotation.y = base.ry + state.ry + pointer.sx * 0.32 + Math.sin(t * 0.31) * 0.05;
    bot.rotation.x = base.rx + state.rx + pointer.sy * 0.05 + lean;
    bot.rotation.z = base.rz + shift * 0.022 - pointer.sx * 0.03;
    if (hips) hips.rotation.z = base.hipsRz - shift * 0.035;
  };

  const ro = new ResizeObserver(measure);

  return {
    start() {
      if (running) return;
      running = true;
      measure();
      ro.observe(document.body);
      window.addEventListener("pointermove", onPointer, { passive: true });
      last = performance.now();
      lastScroll = window.scrollY;
      raf = requestAnimationFrame(tick);
    },
    stop() {
      if (!running) return;
      running = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("pointermove", onPointer);
    },
  };
}

export type RobotRig = NonNullable<ReturnType<typeof createRobotRig>>;

/**
 * Calls `onReady` once the scene's own intro animation has finished, i.e. the
 * robot and camera have stopped moving for half a second (or after `timeout`).
 * Returns a cancel function.
 */
export function whenAtRest(
  spline: Application,
  onReady: () => void,
  timeout = 8000,
) {
  let stillFor = 0;
  let prev = "";
  const started = performance.now();
  const id = setInterval(() => {
    const bot = spline.findObjectByName("Bot");
    const cam = spline.findObjectByName("Camera 2");
    const now = performance.now();
    if (bot && cam) {
      const snap = [bot.position.y, bot.rotation.y, cam.position.y, cam.position.z]
        .map((v) => v.toFixed(1))
        .join();
      stillFor = snap === prev ? stillFor + 1 : 0;
      prev = snap;
    }
    if ((bot && cam && stillFor >= 5) || now - started > timeout) {
      clearInterval(id);
      onReady();
    }
  }, 100);
  return () => clearInterval(id);
}
