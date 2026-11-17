import {
  Color,
  Euler,
  PropertyBinding,
  Quaternion,
  Raycaster,
  Vector2,
  type Camera,
  type InstancedMesh,
  type Material,
  type Object3D,
} from "three";
import { EYE_COLS, EYE_ROWS, FACES, FACE_COLORS, type Expression } from "./face";
import { sampleBone, sampleHipsY, type ClipSet } from "./clips";

/**
 * Procedural animation for the robot (public/models/robot.glb). The model has
 * no baked animation; everything is layered here, every frame:
 *
 *  1. Scroll choreography: one pose per page section (`data-camera`),
 *     blended as each section reaches the top of the viewport: a face
 *     close-up in the hero, the full robot beside the About text, a run
 *     across the screen (scrubbed by scrolling, either way), then facing the
 *     visitor at Contact.
 *  2. Idle life: breathing, weight shift, an arm sway, a heartbeat in the
 *     chest emblem, blinking, a slow look-around when the pointer is still.
 *  3. Pointer: head, then torso, then the whole body turn toward the cursor.
 *  4. Moods per section, blended by weight: reading in About, excited at the
 *     projects, affectionate at Contact.
 *  5. One-shot actions with smooth envelopes: wave, hop, stretch, curious
 *     tilt, point, spin. Triggered by sections, clicks, idling and tab
 *     returns.
 *  6. Momentum: fast scrolling throws the arms out and startles the face.
 *  7. Motion capture (when loaded): Mixamo clips retargeted onto the parts
 *     (clips.ts). A breathing idle loops underneath everything; gestures
 *     (handshake, jump, look around) crossfade in. Every layer above is
 *     applied on top of the clip pose, so scroll, pointer and face still work.
 *
 * Everything eases with frame-rate independent damping. Units are Spline's.
 */

type Pose = {
  cam: [number, number, number];
  /** Robot offset from its authored position, and its turn/tilt (radians). */
  x: number;
  y: number;
  ry: number;
  rx: number;
  /** How much the pointer steers the head, body and camera (0–1). */
  look: number;
};

/** Landscape screens. */
const WIDE: Record<string, Pose> = {
  // Top-left corner, chest up (face ~23% across, ~30% down a 16:10 screen),
  // turned toward the text in the bottom-right corner.
  hero: { cam: [0, 200, 700], x: -150, y: 0, ry: 0.55, rx: 0, look: 0.5 },
  // Full robot on the left, turned toward the text on the right.
  about: { cam: [0, 40, 1450], x: -400, y: 0, ry: 0.6, rx: 0, look: 1 },
  // The run, above the pinned skill rows: the camera pulls back so the whole
  // robot fits between the header and the rows (feet ~385 px down a 900 px
  // screen, head ~105 px). It enters from off-screen left…
  run: { cam: [0, -370, 3600], x: -1650, y: 0, ry: 0.6, rx: 0, look: 0 },
  // …and has left on the right when the pin releases.
  runEnd: { cam: [0, -370, 3600], x: 1700, y: 0, ry: 0, rx: 0, look: 0 },
  work: { cam: [0, -370, 3600], x: 1700, y: 0, ry: 0, rx: 0, look: 0 },
  // Facing the visitor beside "Let's work together".
  contact: { cam: [0, 110, 1500], x: 380, y: 0, ry: -0.15, rx: 0, look: 0.6 },
};

/** Portrait screens: the text spans the width, so the robot sits behind it. */
const TALL: Record<string, Pose> = {
  hero: { cam: [0, 150, 950], x: -55, y: 0, ry: 0.5, rx: 0, look: 0.5 },
  about: { cam: [0, 60, 2200], x: -170, y: 0, ry: 0.6, rx: 0, look: 1 },
  // Feet ~360 px down an 844 px screen, above the rows.
  run: { cam: [0, -368, 3500], x: -640, y: 0, ry: 0.6, rx: 0, look: 0 },
  runEnd: { cam: [0, -368, 3500], x: 650, y: 0, ry: 0, rx: 0, look: 0 },
  work: { cam: [0, -368, 3500], x: 650, y: 0, ry: 0, rx: 0, look: 0 },
  contact: { cam: [0, 110, 1750], x: 0, y: 0, ry: 0, rx: 0, look: 0.6 },
};

const KEYS = ["camX", "camY", "camZ", "x", "y", "ry", "rx", "look"] as const;
type State = Record<(typeof KEYS)[number], number>;

const TAU = Math.PI * 2;
const smoothstep = (t: number) => t * t * (3 - 2 * t);
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const damp = (current: number, target: number, rate: number, dt: number) =>
  current + (target - current) * (1 - Math.exp(-rate * dt));
/** 0 → 1 → 0 envelope with eased edges, for a normalised time p in [0, 1]. */
const envelope = (p: number, fadeIn: number, fadeOut: number) =>
  smoothstep(clamp(p / fadeIn, 0, 1)) * smoothstep(clamp((1 - p) / fadeOut, 0, 1));

/** Additive offsets an action or mood contributes for one frame. */
type Offsets = {
  botY?: number;
  botRy?: number;
  topRx?: number;
  headRx?: number;
  headRy?: number;
  headRz?: number;
  /** Per arm (0 = viewer's left, 1 = viewer's right). */
  armX?: [number, number];
  armZ?: [number, number];
  elbowZ?: [number, number];
  forearmX?: [number, number];
};

export type ActionName =
  | "wave"
  | "hop"
  | "stretch"
  | "curious"
  | "point"
  | "spin"
  | "lookUp"
  | "handshake"
  | "jump"
  | "look";
type Action = {
  duration: number;
  /** Offsets at normalised time p, before the envelope is applied. */
  pose: (p: number, t: number) => Offsets;
  fade?: [number, number];
  /** Hops and spins carry their own easing: no envelope. */
  raw?: boolean;
  face?: Expression;
  /** Motion-capture clip to play instead; `pose` is the fallback without clips. */
  clip?: string;
};

const ACTIONS: Record<ActionName, Action> = {
  // Right arm out, forearm up, hand swinging.
  wave: {
    duration: 2.6,
    face: "happy",
    pose: (_p, t) => ({
      armZ: [0, 1.5],
      elbowZ: [0, 1.25 + Math.sin(t * 11) * 0.38],
      headRz: 0.1,
      topRx: -0.03,
    }),
  },
  // Anticipation dip, jump, squash on landing.
  hop: {
    duration: 0.95,
    face: "happy",
    raw: true,
    pose: (p) => {
      const dip = p < 0.2 ? -Math.sin((p / 0.2) * Math.PI) * 16 : 0;
      const air = p >= 0.2 && p < 0.7 ? Math.sin(((p - 0.2) / 0.5) * Math.PI) * 70 : 0;
      const land = p >= 0.7 ? -Math.sin(((p - 0.7) / 0.3) * Math.PI) * 10 : 0;
      const arms = p >= 0.15 && p < 0.75 ? Math.sin(((p - 0.15) / 0.6) * Math.PI) * 0.6 : 0;
      return { botY: dip + air + land, armZ: [arms, arms], headRx: -arms * 0.2 };
    },
  },
  // Both arms up, look up, settle.
  stretch: {
    duration: 3.2,
    face: "sleepy",
    fade: [0.22, 0.25],
    pose: () => ({ armZ: [2.6, 2.6], elbowZ: [0.3, 0.3], headRx: -0.25, topRx: -0.08 }),
  },
  // Head tilt with a little shrug.
  curious: {
    duration: 2,
    face: "curious",
    pose: () => ({
      headRz: 0.3,
      headRx: -0.05,
      armZ: [0.4, 0.4],
      forearmX: [-1, -1],
      elbowZ: [0.5, 0.5],
    }),
  },
  // Points at the visitor.
  point: {
    duration: 1.8,
    face: "wink",
    pose: () => ({ armX: [0, -1.45], armZ: [0, 0.25], headRz: -0.08 }),
  },
  // A full turn on the spot.
  spin: {
    duration: 1.1,
    face: "happy",
    raw: true,
    pose: (p) => ({ botRy: smoothstep(p) * TAU, botY: Math.sin(p * Math.PI) * 24 }),
  },
  // Looks up, startled, at the projects.
  lookUp: {
    duration: 1.6,
    face: "surprised",
    pose: () => ({ headRx: -0.38, topRx: -0.1, armZ: [0.25, 0.25] }),
  },
  // Motion capture, with hand-made fallbacks.
  handshake: {
    duration: 2.6,
    face: "happy",
    clip: "shaking-hands-2",
    fade: [0.12, 0.15],
    pose: (p, t) => ACTIONS.wave.pose(p, t),
  },
  jump: {
    duration: 0.95,
    face: "happy",
    clip: "running-jump",
    fade: [0.08, 0.2],
    pose: (p, t) => ACTIONS.hop.pose(p, t),
  },
  look: {
    duration: 2,
    face: "curious",
    clip: "looking",
    fade: [0.1, 0.12],
    pose: (p, t) => ACTIONS.curious.pose(p, t),
  },
};

/** Section moods: held while in the section, blended in and out. */
const MOODS: Record<
  string,
  { face: Expression; pose: (t: number) => Offsets; /** Looping motion-capture clip. */ clip?: string }
> = {
  // Looking down toward the text in the bottom-right corner.
  hero: { face: "neutral", pose: () => ({ headRx: 0.2, headRy: 0.15 }) },
  about: { face: "reading", clip: "looking", pose: () => ({}) },
  run: { face: "happy", pose: () => ({}) },
  runEnd: { face: "happy", pose: () => ({}) },
  work: { face: "happy", pose: () => ({}) },
  contact: { face: "heart", clip: "shaking-hands-2", pose: () => ({}) },
};

/** What to do when arriving in a section (at most every few seconds). */
const ON_ENTER: Record<string, ActionName[]> = {};

/** The run across the screen, scrubbed by scrolling. */
const RUN_CLIPS = ["running", "running-jump"]; // a proper run cycle wins if present
const RUN_PX_PER_SECOND = 450; // scroll distance that plays one second of running

/**
 * Find nodes by their Spline name. three's GLTFLoader sanitises names
 * ("Top part" becomes "Top_part"), so look them up the same way.
 */
export const nodeName = (name: string) => PropertyBinding.sanitizeNodeName(name);

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

export function createRig(
  model: Object3D,
  camera: Camera,
  extras: { eyes?: InstancedMesh; emblem?: Material } = {},
) {
  const find = (name: string) => model.getObjectByName(nodeName(name));
  // Duplicate parts (both arms, both legs) are made unique by the loader:
  // "arm", "arm_1", … so match the base name with an optional suffix.
  const all = (name: string) => {
    const out: Object3D[] = [];
    const wanted = new RegExp(`^${nodeName(name)}(_\\d+)?$`);
    model.traverse((o) => wanted.test(o.name) && out.push(o));
    return out;
  };

  const bot = find("Bot");
  if (!bot) return null;
  const top = find("Top part");
  const head = find("Head");
  const hips = find("Pelvic");

  const r = rest(bot);
  const base = { px: r.px, py: r.py, rx: r.x, ry: r.y, rz: r.z };
  const topJ = top && joint(top);
  const headJ = head && joint(head);
  const hipsJ = hips && joint(hips);
  // Index 0 is the mirrored instance on the viewer's left, 1 the viewer's right.
  const arms = all("arm").map(joint);
  const forearms = all("forearm").map(joint);
  const elbows = all("elbow").map(joint);
  const shoulders = all("Hand LEFT").map(joint);
  const legs = [...all("Leg Left"), ...all("Leg Left Instance")].map(joint);
  const shins = all("shin").map(joint);
  const feet = all("Foot").map(joint);

  // Motion capture, once loaded: which bone drives each part.
  let clipSet: ClipSet | null = null;
  const boneOf = new Map<Object3D, string>();
  const BASE_CLIP = "breathing-idle";
  const clipQ = new Quaternion();
  const blendQ = new Quaternion();
  const offQ = new Quaternion();
  const euler = new Euler();

  /* ---------------------------------------------------------- sections */

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

  let runDir = 1; // +1 running right (scrolling down), -1 left (scrolling up)
  const scrollPose = (): State & { section: string; runZone: number } => {
    const poses = wide ? WIDE : TALL;
    const from = (p: Pose): State => ({
      camX: p.cam[0], camY: p.cam[1], camZ: p.cam[2], x: p.x, y: p.y, ry: p.ry, rx: p.rx, look: p.look,
    });
    if (stops.length < 2) return { ...from(poses.hero), section: "hero", runZone: 0 };

    const y = window.scrollY;
    let i = 0;
    while (i < stops.length - 2 && y >= stops[i + 1].top) i++;
    const a = from(poses[stops[i].key]);
    const b = from(poses[stops[i + 1].key]);
    const span = Math.max(stops[i + 1].top - stops[i].top, 1);
    const linear = clamp((y - stops[i].top) / span, 0, 1);
    const t = smoothstep(linear);
    const out = {} as State;
    for (const k of KEYS) out[k] = a[k] + (b[k] - a[k]) * t;

    // Running: constant speed across the screen, facing the way it runs.
    let runZone = 0;
    if (stops[i].key === "run" && stops[i + 1].key === "runEnd") {
      out.x = a.x + (b.x - a.x) * linear;
      runZone = clamp(linear * 8, 0, 1) * clamp((1 - linear) * 8, 0, 1);
      const facing = runDir > 0 ? Math.PI / 2 : -Math.PI / 2;
      out.ry = a.ry + (facing - a.ry) * clamp(linear * 8, 0, 1);
    }

    // The section under the middle of the viewport sets the mood.
    const mid = y + window.innerHeight * 0.5;
    let section = stops[0].key;
    for (const s of stops) if (mid >= s.top) section = s.key;
    return { ...out, section, runZone };
  };

  /* ---------------------------------------------------------- input */

  const pointer = { x: 0, y: 0, sx: 0, sy: 0, hx: 0, hy: 0, movedAt: -Infinity };
  const raycaster = new Raycaster();
  const ndc = new Vector2();
  const hits = (clientX: number, clientY: number) => {
    ndc.set((clientX / window.innerWidth) * 2 - 1, -(clientY / window.innerHeight) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
    return raycaster.intersectObject(bot, true).length > 0;
  };
  const INTERACTIVE = "a, button, input, textarea, select, label, [role='button'], header, nav";

  let hoverCheck = 0;
  const onPointer = (e: PointerEvent) => {
    if (e.pointerType === "touch") return;
    pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
    pointer.y = (e.clientY / window.innerHeight) * 2 - 1;
    pointer.movedAt = performance.now();
    // Let the cursor say hello when it's over the robot (throttled ray cast).
    const now = performance.now();
    if (now - hoverCheck > 120) {
      hoverCheck = now;
      const interactive = (e.target as Element | null)?.closest?.(INTERACTIVE);
      document.documentElement.classList.toggle("robot-hover", !interactive && hits(e.clientX, e.clientY));
    }
  };

  let clicks: number[] = [];
  const onClick = (e: MouseEvent) => {
    if ((e.target as Element | null)?.closest?.(INTERACTIVE)) return;
    if (!hits(e.clientX, e.clientY)) return;
    const now = performance.now();
    clicks = [...clicks.filter((c) => now - c < 1200), now];
    // Three quick boops earn a spin.
    if (clicks.length >= 3) {
      play("spin", true);
      clicks = [];
    } else {
      play("jump", true);
    }
  };

  let hiddenAt = 0;
  const onVisibility = () => {
    if (document.visibilityState === "hidden") hiddenAt = performance.now();
    else if (hiddenAt && performance.now() - hiddenAt > 3000) play("wave", true);
  };

  /* ---------------------------------------------------------- actions */

  type Running = { name: ActionName; start: number };
  /** An action's length: its clip's when motion capture is loaded. */
  const durationOf = (name: ActionName) => {
    const clipName = ACTIONS[name].clip;
    const clip = clipName ? clipSet?.clips[clipName] : undefined;
    return clip ? clip.duration : ACTIONS[name].duration;
  };
  let running: Running[] = [];
  let queue: ActionName[] = [];
  let clock = 0;

  /** Play an action now, or after the current one unless interrupting. */
  function play(name: ActionName, interrupt = false) {
    if (interrupt) {
      running = running.filter((a) => a.name !== name);
      running.push({ name, start: clock });
      return;
    }
    if (running.length) queue.push(name);
    else running.push({ name, start: clock });
  }

  const lastEntered: Record<string, number> = {};
  const moodStart: Record<string, number> = {};
  let runPhase = 0;
  let runActivity = 0;
  let section = "hero";
  let introDone = false;
  let nextIdle = 9;

  /* ---------------------------------------------------------- face */

  const eyes = extras.eyes;
  const dots = EYE_COLS * EYE_ROWS;
  const level = new Float32Array(dots * 2);
  const ledColor = new Color();
  const tmp = new Color();
  const tint = [...FACE_COLORS.neutral];
  let nextBlink = 2.5;

  const renderFace = (expression: Expression, dt: number, t: number) => {
    if (!eyes) return;
    const [left, right] = FACES[expression];
    const target = FACE_COLORS[expression];
    for (let k = 0; k < 3; k++) tint[k] = damp(tint[k], target[k], 8, dt);
    ledColor.setRGB(tint[0], tint[1], tint[2]);
    // The reading face sweeps a brighter column across, like scanning text.
    const scan = expression === "reading" ? Math.floor(t * 7) % EYE_COLS : -1;

    for (let side = 0; side < 2; side++) {
      const mask = side === 0 ? left : right;
      for (let row = 0; row < EYE_ROWS; row++) {
        for (let col = 0; col < EYE_COLS; col++) {
          const i = side * dots + row * EYE_COLS + col;
          const lit = mask[row][col] ? (col === scan ? 1.5 : 1) : 0.05;
          level[i] = damp(level[i], lit, 22, dt);
          eyes.setColorAt(i, tmp.copy(ledColor).multiplyScalar(level[i]));
        }
      }
    }
    if (eyes.instanceColor) eyes.instanceColor.needsUpdate = true;
  };

  /* ---------------------------------------------------------- state */

  measure();
  const state: State = { ...scrollPose(), y: -1400 }; // rises in from below
  bot.position.y = base.py + state.y;
  const moodWeight: Record<string, number> = { hero: 1, about: 0, run: 0, runEnd: 0, work: 0, contact: 0 };
  let lean = 0;
  let jolt = 0;
  let lastScroll = window.scrollY;

  const ro = new ResizeObserver(measure);
  ro.observe(document.body);
  window.addEventListener("pointermove", onPointer, { passive: true });
  window.addEventListener("click", onClick);
  document.addEventListener("visibilitychange", onVisibility);

  const add = (acc: Required<Offsets>, o: Offsets, w: number) => {
    acc.botY += (o.botY ?? 0) * w;
    acc.botRy += (o.botRy ?? 0) * w;
    acc.topRx += (o.topRx ?? 0) * w;
    acc.headRx += (o.headRx ?? 0) * w;
    acc.headRy += (o.headRy ?? 0) * w;
    acc.headRz += (o.headRz ?? 0) * w;
    for (const k of ["armX", "armZ", "elbowZ", "forearmX"] as const) {
      const v = o[k];
      if (v) {
        acc[k][0] += v[0] * w;
        acc[k][1] += v[1] * w;
      }
    }
  };

  return {
    play,
    /** Attach motion-capture clips (see clips.ts); before that, all procedural. */
    setClips(set: ClipSet | null) {
      clipSet = set;
      boneOf.clear();
      set?.parts.forEach((obj, bone) => boneOf.set(obj, bone));
      // Parts the clips stop driving go back to their authored pose.
      if (!set) [...legs, ...shins, ...feet].forEach((j) => j.obj.rotation.set(j.x, j.y, j.z));
    },
    update(rawDt: number, t: number) {
      const dt = Math.min(rawDt, 0.05);
      clock = t;

      // Momentum from scroll speed (px/s).
      const scroll = window.scrollY;
      const velocity = (scroll - lastScroll) / Math.max(dt, 1e-3);
      lastScroll = scroll;
      lean = damp(lean, clamp(velocity * 0.00006, -0.14, 0.14), 6, dt);
      if (Math.abs(velocity) > 30) runDir = Math.sign(velocity);
      const fast = Math.abs(velocity) > 1800;
      jolt = damp(jolt, clamp((Math.abs(velocity) - 1800) / 2500, 0, 1), fast ? 10 : 2.5, dt);

      // Pointer, or a slow look-around once it has been still for 3 s.
      const idle = performance.now() - pointer.movedAt > 3000;
      const tx = idle ? Math.sin(t * 0.35) * 0.5 : pointer.x;
      const ty = idle ? Math.sin(t * 0.23) * 0.25 : pointer.y;
      pointer.hx = damp(pointer.hx, tx, idle ? 1.5 : 7, dt);
      pointer.hy = damp(pointer.hy, ty, idle ? 1.5 : 7, dt);
      pointer.sx = damp(pointer.sx, tx, idle ? 1 : 3, dt);
      pointer.sy = damp(pointer.sy, ty, idle ? 1 : 3, dt);

      // Scroll pose and the section we're in.
      const target = scrollPose();
      for (const k of KEYS) state[k] = damp(state[k], target[k], k === "y" ? 2.4 : 3.2, dt);

      // Say hello once the robot has risen into frame.
      if (!introDone && Math.abs(state.y - target.y) < 40) {
        introDone = true;
        play("wave", true);
      }
      if (target.section !== section) {
        section = target.section;
        moodStart[section] = t;
        const now = performance.now();
        if (introDone && now - (lastEntered[section] ?? -1e9) > 5000) {
          lastEntered[section] = now;
          queue = [];
          ON_ENTER[section]?.forEach((name, i) => (i === 0 ? play(name, true) : queue.push(name)));
        }
      }

      // The run: scrolling drives the stride; when scrolling stops, the robot
      // finishes its stride (or leap) and settles instead of freezing mid-air.
      const runName = RUN_CLIPS.find((n) => clipSet?.clips[n]);
      const runClip = runName ? clipSet!.clips[runName] : undefined;
      let runWeight = 0;
      if (runClip && target.runZone > 0) {
        const moving = Math.abs(velocity) > 20;
        const local = runPhase % runClip.duration;
        const midStride = local > 0.04 && local < runClip.duration - 0.04;
        if (moving) runPhase += (Math.abs(velocity) * dt) / RUN_PX_PER_SECOND;
        else if (midStride) runPhase += dt;
        runActivity = damp(runActivity, moving || midStride ? 1 : 0, 6, dt);
        runWeight = target.runZone * runActivity;
      } else {
        runActivity = damp(runActivity, 0, 6, dt);
      }

      // Actions: retire finished ones, then start the next queued one.
      running = running.filter((a) => t - a.start < durationOf(a.name));
      if (!running.length && queue.length) play(queue.shift()!);

      // Now and then, when nothing else is going on, do something.
      const still = Math.abs(velocity) < 5;
      if (introDone && still && !running.length && !queue.length) {
        if (t > nextIdle) {
          // Other sections have their own clip; the close-up gets a head tilt.
          if (section === "hero") play("curious");
          nextIdle = t + 9 + Math.random() * 7;
        }
      } else {
        nextIdle = Math.max(nextIdle, t + 6);
      }

      // Blend moods and actions into one set of offsets.
      const acc: Required<Offsets> = {
        botY: 0, botRy: 0, topRx: 0, headRx: 0, headRy: 0, headRz: 0,
        armX: [0, 0], armZ: [0, 0], elbowZ: [0, 0], forearmX: [0, 0],
      };
      for (const key of Object.keys(moodWeight)) {
        moodWeight[key] = damp(moodWeight[key], key === section ? 1 : 0, 2.5, dt);
        if (moodWeight[key] > 0.001) add(acc, MOODS[key].pose(t), moodWeight[key]);
      }
      let face: Expression = MOODS[section]?.face ?? "neutral";
      // Clip actions crossfade over the idle clip. Hand-made actions add their
      // offsets, except on clip-driven limbs: there the action's tuned pose is
      // a target the limb crossfades to (offsets on top of a mocap arm would
      // rotate around the wrong axes).
      const mocapOn = Boolean(clipSet?.clips[BASE_CLIP]);
      let gesture: { clip: string; time: number; weight: number } | null = null;
      let handmade: { off: Offsets; weight: number } | null = null;
      for (const a of running) {
        const def = ACTIONS[a.name];
        const duration = durationOf(a.name);
        const p = clamp((t - a.start) / duration, 0, 1);
        const w = def.raw ? 1 : envelope(p, def.fade?.[0] ?? 0.18, def.fade?.[1] ?? 0.22);
        const clip = def.clip && clipSet?.clips[def.clip];
        if (clip) {
          if (!gesture || w > gesture.weight) gesture = { clip: def.clip!, time: t - a.start, weight: w };
        } else if (mocapOn) {
          const { armX, armZ, elbowZ, forearmX, ...rest } = def.pose(p, t);
          add(acc, rest, w);
          if (!handmade || w > handmade.weight) handmade = { off: { armX, armZ, elbowZ, forearmX }, weight: w };
        } else {
          add(acc, def.pose(p, t), w);
        }
        if (def.face && w > 0.3) face = def.face;
      }
      // Fast scrolling: arms fly out, the face startles.
      if (jolt > 0.05 && target.runZone === 0) {
        acc.armZ[0] += jolt * 0.55;
        acc.armZ[1] += jolt * 0.55;
        acc.headRx -= jolt * 0.1;
        if (jolt > 0.35) face = "surprised";
      }
      // Blink now and then, unless the face is busy.
      if (t > nextBlink + 0.14) nextBlink = t + 2.4 + Math.random() * 3.6;
      if (t > nextBlink && (face === "neutral" || face === "reading" || face === "happy")) face = "blink";

      /* ------------------------------------------------------ apply */

      const breathe = Math.sin(t * 1.7);
      const shift = Math.sin(t * 0.62);
      const mocap = mocapOn;

      // The motion-capture pose of a part (idle loop, crossfaded with the
      // current gesture), or null when it isn't driven by a clip.
      // Layers, bottom to top: breathing idle, section clips (Looking,
      // handshake), the run, then any gesture.
      const layers: { clip: string; time: number; weight: number; hips?: number }[] = [];
      for (const key of Object.keys(moodWeight)) {
        const clip = MOODS[key]?.clip;
        const c = clip && clipSet?.clips[clip];
        if (c && moodWeight[key] > 0.001) {
          layers.push({ clip, time: (t - (moodStart[key] ?? 0)) % c.duration, weight: moodWeight[key] });
        }
      }
      if (runClip && runWeight > 0.001) {
        layers.push({ clip: runName!, time: runPhase % runClip.duration, weight: runWeight, hips: 0.7 });
      }
      if (gesture) layers.push(gesture);

      const clipPose = (obj: Object3D) => {
        const bone = boneOf.get(obj);
        const base = clipSet?.clips[BASE_CLIP];
        if (!bone || !base || !sampleBone(base, bone, t % base.duration, blendQ)) return null;
        for (const layer of layers) {
          if (sampleBone(clipSet!.clips[layer.clip], bone, layer.time, clipQ)) blendQ.slerp(clipQ, layer.weight);
        }
        return blendQ;
      };
      // Part rotation = clip pose (or its rest pose) × additive offsets; a
      // hand-made gesture (g, in the authored rest frame) crossfades over it.
      const gestQ = new Quaternion();
      const pose = (
        j: { obj: Object3D; x: number; y: number; z: number },
        ox: number,
        oy: number,
        oz: number,
        g?: [number, number, number],
      ) => {
        const fromClip = clipPose(j.obj);
        if (!fromClip) {
          j.obj.rotation.set(j.x + ox, j.y + oy, j.z + oz);
          return;
        }
        offQ.setFromEuler(euler.set(ox, oy, oz));
        j.obj.quaternion.copy(fromClip).multiply(offQ);
        if (g && handmade && handmade.weight > 0.001) {
          gestQ.setFromEuler(euler.set(j.x + ox + g[0], j.y + oy + g[1], j.z + oz + g[2]));
          j.obj.quaternion.slerp(gestQ, handmade.weight);
        }
      };
      const hm = (key: "armX" | "armZ" | "elbowZ" | "forearmX", i: number) => handmade?.off[key]?.[i] ?? 0;

      camera.position.set(
        state.camX + pointer.sx * 45 * state.look,
        state.camY - pointer.sy * 25 * state.look,
        state.camZ,
      );

      // Hips: the clip's own bob replaces the procedural breathing.
      let hipsY = 0;
      if (mocap) {
        const base = clipSet!.clips[BASE_CLIP];
        hipsY = sampleHipsY(base, t % base.duration);
        for (const layer of layers) {
          const y = sampleHipsY(clipSet!.clips[layer.clip], layer.time) * (layer.hips ?? 1);
          hipsY += (y - hipsY) * layer.weight;
        }
      }
      bot.position.x = base.px + state.x;
      bot.position.y =
        base.py + state.y + (mocap ? hipsY : breathe * 2.5) - Math.abs(lean) * 40 + acc.botY;
      // The scroll pose turns the whole robot; the clip moves the hips within it.
      euler.set(
        base.rx + state.rx + pointer.sy * 0.04 * state.look + lean,
        base.ry + state.ry + (pointer.sx * 0.28 + Math.sin(t * 0.31) * 0.05) * state.look + acc.botRy,
        base.rz + shift * 0.022 - pointer.sx * 0.03 * state.look,
      );
      bot.quaternion.setFromEuler(euler);
      const hipsQ = clipPose(bot);
      if (hipsQ) bot.quaternion.multiply(hipsQ);

      if (hipsJ) hipsJ.obj.rotation.z = hipsJ.z - (mocap ? 0 : shift * 0.035);
      const look = state.look;
      if (topJ) pose(topJ, pointer.sy * 0.06 * look + (mocap ? 0 : breathe * 0.012) + acc.topRx, pointer.hx * 0.14 * look, 0);
      if (headJ) {
        pose(
          headJ,
          pointer.hy * 0.32 * look + acc.headRx,
          pointer.hx * 0.5 * look + acc.headRy,
          -pointer.hx * 0.06 * look + acc.headRz,
        );
      }

      // Arms: the clip (or a slow procedural sway), plus moods and actions.
      const sway = mocap ? 0 : 1;
      arms.forEach((j, i) =>
        pose(j, Math.sin(t * 0.9 + i * 0.7) * 0.12 * sway + acc.armX[i], 0, acc.armZ[i], [hm("armX", i), 0, hm("armZ", i)]),
      );
      forearms.forEach((j, i) => {
        if (!mocap) {
          j.obj.rotation.x = j.x - 0.12 + Math.sin(t * 0.9 + i * 0.7 + 0.6) * 0.2 + acc.forearmX[i];
          return;
        }
        // The clips were baked with straight forearms (the Mixamo T-pose);
        // hand-made gestures were tuned on the authored bend.
        const w = handmade?.weight ?? 0;
        j.obj.rotation.x = (j.x + hm("forearmX", i)) * w + acc.forearmX[i];
      });
      elbows.forEach((j, i) =>
        pose(j, 0, Math.sin(t * 0.7 + i) * 0.12 * sway, acc.elbowZ[i], [0, 0, hm("elbowZ", i)]),
      );
      shoulders.forEach((j, i) => pose(j, 0, 0, Math.sin(t * 0.8 + i * 1.3) * 0.06 * sway, [0, 0, 0]));
      if (mocap) [...legs, ...shins, ...feet].forEach((j) => pose(j, 0, 0, 0));

      renderFace(face, dt, t);

      // Chest emblem: a double "heartbeat" pulse, quicker when excited.
      if (extras.emblem) {
        const bpm = face === "heart" ? 1.9 : section === "work" ? 1.4 : 1;
        const beat = (t * bpm) % 1.2;
        const pulse =
          Math.exp(-((beat - 0.1) ** 2) / 0.002) + 0.6 * Math.exp(-((beat - 0.32) ** 2) / 0.002);
        extras.emblem.opacity = 0.45 + 0.55 * Math.min(pulse, 1);
      }
    },
    dispose() {
      ro.disconnect();
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("click", onClick);
      document.removeEventListener("visibilitychange", onVisibility);
      document.documentElement.classList.remove("robot-hover");
    },
  };
}

export type Rig = NonNullable<ReturnType<typeof createRig>>;
