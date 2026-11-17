import {
  AnimationMixer,
  Euler,
  Quaternion,
  Raycaster,
  Vector2,
  Vector3,
  type AnimationAction,
  type AnimationClip,
  type Bone,
  type Camera,
  type Object3D,
} from "three";

/**
 * Animation for the character (public/models/character.glb, built by
 * scripts/build-character.mjs: a skinned mesh, a Mixamo skeleton and
 * motion-capture clips). Every frame:
 *
 *  1. Scroll choreography: one pose per page section (`data-camera`),
 *     blended as each section reaches the top of the viewport: chest-up in
 *     the hero corner, full height beside the About text, a run across the
 *     screen (scrubbed by scrolling, either way), then turned toward Contact.
 *  2. Motion capture, layered: a breathing idle underneath, the section's
 *     clip (looking around in About, a handshake at Contact), the run, and
 *     one-shot gestures on top. Each layer covers the ones below by its
 *     weight, so everything crossfades.
 *  3. On top of the clips: the head, then the chest, then the whole body turn
 *     toward the cursor; hand-posed gestures (a wave) aim the arm in body
 *     space, so they work over any clip.
 *  4. Reactions: a wave on arrival and on returning to the tab, a jump when
 *     clicked, a spin after three quick clicks, a curious head tilt now and
 *     then, arms thrown out by fast scrolling.
 *
 * Everything eases with frame-rate independent damping.
 */

type Pose = {
  cam: [number, number, number];
  /** Character offset from its authored position, and its turn/tilt (radians). */
  x: number;
  y: number;
  ry: number;
  rx: number;
  /** How much the pointer steers the head, body and camera (0–1). */
  look: number;
};

/** Landscape screens. */
const WIDE: Record<string, Pose> = {
  // Top-left corner, chest up, turned toward the text in the bottom-right corner.
  hero: { cam: [0, 200, 700], x: -150, y: 0, ry: 0.55, rx: 0, look: 0.5 },
  // Full height on the left, turned toward the text on the right.
  about: { cam: [0, 40, 1450], x: -320, y: 0, ry: 0.6, rx: 0, look: 1 },
  // Leaving About it runs off to the left at the same scale…
  run: { cam: [0, 40, 1450], x: -1350, y: 0, ry: 0.6, rx: 0, look: 0 },
  // …then, off-screen, the camera pulls back so the whole figure fits between
  // the header and the pinned rows…
  runIn: { cam: [0, -370, 3600], x: -1700, y: 0, ry: 0.6, rx: 0, look: 0 },
  // …and it runs in from the left, across, and out on the right.
  runEnd: { cam: [0, -370, 3600], x: 2050, y: 0, ry: 0, rx: 0, look: 0 },
  work: { cam: [0, -370, 3600], x: 2050, y: 0, ry: 0, rx: 0, look: 0 },
  // Beside "Let's work together", turned toward it.
  contact: { cam: [0, 110, 1500], x: 380, y: 0, ry: -0.45, rx: 0, look: 0.6 },
};

/** Portrait screens: the text spans the width, so the character sits behind it. */
const TALL: Record<string, Pose> = {
  hero: { cam: [0, 150, 950], x: -55, y: 0, ry: 0.5, rx: 0, look: 0.5 },
  about: { cam: [0, 60, 2200], x: -170, y: 0, ry: 0.6, rx: 0, look: 1 },
  run: { cam: [0, 60, 2200], x: -720, y: 0, ry: 0.6, rx: 0, look: 0 },
  runIn: { cam: [0, -368, 3500], x: -700, y: 0, ry: 0.6, rx: 0, look: 0 },
  runEnd: { cam: [0, -368, 3500], x: 800, y: 0, ry: 0, rx: 0, look: 0 },
  work: { cam: [0, -368, 3500], x: 800, y: 0, ry: 0, rx: 0, look: 0 },
  contact: { cam: [0, 110, 1750], x: 0, y: 0, ry: -0.3, rx: 0, look: 0.6 },
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

/** Clip names: the files in assets/animations. */
const IDLE = "breathing-idle";
const RUN = "running-jump";

/** Additive offsets (radians, body space) a mood or action contributes. */
type Offsets = {
  botY?: number;
  botRy?: number;
  chestRx?: number;
  headRx?: number;
  headRy?: number;
  headRz?: number;
};

/** An arm aimed in body space: upper arm and forearm directions. */
type ArmAim = { upper: [number, number, number]; fore: [number, number, number] };

export type ActionName = "wave" | "curious" | "spin" | "jump" | "handshake" | "look";
type Action = {
  duration: number;
  fade?: [number, number];
  /** Spins carry their own easing: no envelope. */
  raw?: boolean;
  /** Motion-capture clip to play (its length wins). */
  clip?: string;
  pose?: (p: number, t: number) => Offsets;
  /** Hand-posed arms, by side as the viewer sees them. */
  arms?: (p: number, t: number) => { left?: ArmAim; right?: ArmAim };
};

const ACTIONS: Record<ActionName, Action> = {
  // The arm on the viewer's right goes up and out, the hand swings.
  wave: {
    duration: 2.6,
    fade: [0.16, 0.2],
    pose: () => ({ headRz: -0.08 }),
    arms: (_p, t) => ({
      right: { upper: [0.85, 0.45, 0.2], fore: [0.12 + Math.sin(t * 10) * 0.45, 1, 0.25] },
    }),
  },
  // Head tilt.
  curious: { duration: 2, pose: () => ({ headRz: 0.3, headRx: -0.05 }) },
  // A full turn on the spot.
  spin: {
    duration: 1.1,
    raw: true,
    pose: (p) => ({ botRy: smoothstep(p) * TAU, botY: Math.sin(p * Math.PI) * 24 }),
  },
  jump: { duration: 0.9, clip: RUN, fade: [0.08, 0.2] },
  handshake: { duration: 4.4, clip: "shaking-hands-2", fade: [0.12, 0.15] },
  look: { duration: 8, clip: "looking", fade: [0.1, 0.12] },
};

/** Section moods: held while in the section, blended in and out. */
const MOODS: Record<string, { pose: Offsets; /** Looping clip. */ clip?: string }> = {
  // Looking down toward the text in the bottom-right corner.
  hero: { pose: { headRx: 0.2, headRy: 0.15 } },
  about: { clip: "looking", pose: {} },
  run: { pose: {} },
  runIn: { pose: {} },
  runEnd: { pose: {} },
  work: { pose: {} },
  contact: { clip: "shaking-hands-2", pose: {} },
};

/** Stretches where the character runs, scrubbed by scrolling (from → to). */
const RUN_SEGMENTS = [
  ["about", "run"], // off to the left, leaving About
  ["runIn", "runEnd"], // in from the left, across the pinned rows
];
const RUN_PX_PER_SECOND = 450; // scroll distance that plays one second of running
/** The running jump leaps high; keep it under the header. */
const RUN_HIPS = 0.7;

const INTERACTIVE = "a, button, input, textarea, select, label, [role='button'], header, nav";

export function createRig(model: Object3D, camera: Camera, clips: AnimationClip[]) {
  const bot = model.getObjectByName("Bot");
  const bone = (name: string) => model.getObjectByName(`mixamorig${name}`) as Bone | undefined;
  const hips = bone("Hips");
  const chest = bone("Spine1");
  const neck = bone("Neck");
  const head = bone("Head");
  if (!bot || !hips) return null;
  // Arms as the viewer sees them: the figure faces the camera, so its left
  // arm is on the viewer's right.
  const arm = (side: "Left" | "Right") => {
    const upper = bone(`${side}Arm`);
    const fore = bone(`${side}ForeArm`);
    const hand = bone(`${side}Hand`);
    return upper && fore && hand ? { upper, fore, hand } : null;
  };
  const viewerLeft = arm("Right");
  const viewerRight = arm("Left");

  const base = { px: bot.position.x, py: bot.position.y };
  const hipsRestY = hips.position.y;

  /* ---------------------------------------------------------- clips */

  const mixer = new AnimationMixer(model);
  const actions = new Map<string, AnimationAction>();
  for (const clip of clips) {
    const action = mixer.clipAction(clip);
    // Times are set by hand every frame (scroll-scrubbed, per-layer clocks).
    action.play();
    action.paused = true;
    action.setEffectiveWeight(0);
    actions.set(clip.name, action);
  }
  const duration = (name: string) => actions.get(name)?.getClip().duration ?? 0;

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

    // Running: constant speed, facing the way it travels (which flips when
    // scrolling back up).
    let runZone = 0;
    if (RUN_SEGMENTS.some(([from, to]) => stops[i].key === from && stops[i + 1].key === to)) {
      out.x = a.x + (b.x - a.x) * linear;
      runZone = clamp(linear * 10, 0, 1) * clamp((1 - linear) * 10, 0, 1);
      const facing = Math.sign(b.x - a.x) * runDir > 0 ? Math.PI / 2 : -Math.PI / 2;
      out.ry = a.ry + (facing - a.ry) * clamp(linear * 10, 0, 1);
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

  let hoverCheck = 0;
  const onPointer = (e: PointerEvent) => {
    if (e.pointerType === "touch") return;
    pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
    pointer.y = (e.clientY / window.innerHeight) * 2 - 1;
    pointer.movedAt = performance.now();
    // Let the cursor say hello when it's over the character (throttled ray cast).
    const now = performance.now();
    if (now - hoverCheck > 120) {
      hoverCheck = now;
      const interactive = (e.target as Element | null)?.closest?.(INTERACTIVE);
      document.documentElement.classList.toggle("character-hover", !interactive && hits(e.clientX, e.clientY));
    }
  };

  let clicks: number[] = [];
  const onClick = (e: MouseEvent) => {
    if ((e.target as Element | null)?.closest?.(INTERACTIVE)) return;
    if (!hits(e.clientX, e.clientY)) return;
    const now = performance.now();
    clicks = [...clicks.filter((c) => now - c < 1200), now];
    // Three quick clicks earn a spin.
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

  const durationOf = (name: ActionName) => {
    const clip = ACTIONS[name].clip;
    return clip && actions.has(clip) ? duration(clip) : ACTIONS[name].duration;
  };
  let running: { name: ActionName; start: number }[] = [];
  const queue: ActionName[] = [];
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

  const moodStart: Record<string, number> = {};
  let runPhase = 0;
  let runActivity = 0;
  let section = "hero";
  let introDone = false;
  let nextIdle = 9;

  /* ---------------------------------------------------------- posing */

  const q = new Quaternion();
  const q2 = new Quaternion();
  const botQ = new Quaternion();
  const euler = new Euler();
  const v1 = new Vector3();
  const v2 = new Vector3();
  const v3 = new Vector3();

  /** Rotate a bone by `offset`, given in body space, keeping its children attached. */
  const rotateInBody = (b: Object3D, offset: Quaternion) => {
    b.updateWorldMatrix(true, false);
    bot.getWorldQuaternion(botQ);
    // world offset = bot · offset · bot⁻¹
    q.copy(botQ).multiply(offset).multiply(q2.copy(botQ).invert());
    b.getWorldQuaternion(q2);
    q.multiply(q2); // new world rotation
    b.parent!.getWorldQuaternion(q2);
    b.quaternion.copy(q2.invert().multiply(q));
    b.updateMatrixWorld(true);
  };
  const turnHead = (b: Object3D | undefined, rx: number, ry: number, rz: number) => {
    if (!b) return;
    rotateInBody(b, q.setFromEuler(euler.set(rx, ry, rz, "YXZ")).clone());
  };

  /** Swing a bone so its child points along `dir` (body space), by `weight`. */
  const aim = (b: Object3D, child: Object3D, dir: [number, number, number], weight: number) => {
    b.updateWorldMatrix(true, true);
    const from = child.getWorldPosition(v1).sub(b.getWorldPosition(v2)).normalize();
    bot.getWorldQuaternion(botQ);
    const to = v3.set(...dir).normalize().applyQuaternion(botQ);
    q.setFromUnitVectors(from, to);
    q.slerp(q2.identity(), 1 - weight); // partial swing
    b.getWorldQuaternion(q2);
    q.multiply(q2);
    b.parent!.getWorldQuaternion(q2);
    b.quaternion.copy(q2.invert().multiply(q));
    b.updateMatrixWorld(true);
  };
  const aimArm = (a: ReturnType<typeof arm>, target: ArmAim, weight: number) => {
    if (!a || weight < 0.001) return;
    aim(a.upper, a.fore, target.upper, weight);
    aim(a.fore, a.hand, target.fore, weight);
  };

  /* ---------------------------------------------------------- state */

  measure();
  const state: State = { ...scrollPose(), y: -1400 }; // rises in from below
  bot.position.y = base.py + state.y;
  const moodWeight: Record<string, number> = { hero: 1, about: 0, run: 0, runIn: 0, runEnd: 0, work: 0, contact: 0 };
  let lean = 0;
  let jolt = 0;
  let lastScroll = window.scrollY;

  const ro = new ResizeObserver(measure);
  ro.observe(document.body);
  window.addEventListener("pointermove", onPointer, { passive: true });
  window.addEventListener("click", onClick);
  document.addEventListener("visibilitychange", onVisibility);

  const add = (acc: Required<Offsets>, o: Offsets, w: number) => {
    for (const k of Object.keys(acc) as (keyof Offsets)[]) acc[k] += (o[k] ?? 0) * w;
  };

  return {
    play,
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

      // Say hello once it has risen into frame.
      if (!introDone && Math.abs(state.y - target.y) < 40) {
        introDone = true;
        play("wave", true);
      }
      if (target.section !== section) {
        section = target.section;
        moodStart[section] = t; // section clips start from the top
      }

      // The run: scrolling drives the stride; when scrolling stops, the
      // stride (or leap) finishes and settles instead of freezing mid-air.
      const runLength = duration(RUN);
      let runWeight = 0;
      if (runLength && target.runZone > 0) {
        const moving = Math.abs(velocity) > 20;
        const local = runPhase % runLength;
        const midStride = local > 0.04 && local < runLength - 0.04;
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

      // Now and then, when nothing else is going on, a curious head tilt
      // (other sections have their own clip).
      const still = Math.abs(velocity) < 5;
      if (introDone && still && !running.length && !queue.length) {
        if (t > nextIdle) {
          if (section === "hero") play("curious");
          nextIdle = t + 9 + Math.random() * 7;
        }
      } else {
        nextIdle = Math.max(nextIdle, t + 6);
      }

      /* ---------------------------------------------- motion capture */

      // Layers, bottom to top: idle, section clips, the run, gestures. Each
      // covers what's below by its weight; the idle gets what's left.
      const layers: { clip: string; time: number; weight: number }[] = [];
      for (const key of Object.keys(moodWeight)) {
        moodWeight[key] = damp(moodWeight[key], key === section ? 1 : 0, 2.5, dt);
        const clip = MOODS[key].clip;
        if (clip && actions.has(clip) && moodWeight[key] > 0.001) {
          layers.push({ clip, time: (t - (moodStart[key] ?? 0)) % duration(clip), weight: moodWeight[key] });
        }
      }
      if (runWeight > 0.001) layers.push({ clip: RUN, time: runPhase % runLength, weight: runWeight });

      const acc: Required<Offsets> = { botY: 0, botRy: 0, chestRx: 0, headRx: 0, headRy: 0, headRz: 0 };
      for (const key of Object.keys(moodWeight)) {
        if (moodWeight[key] > 0.001) add(acc, MOODS[key].pose, moodWeight[key]);
      }
      const arms: { side: "left" | "right"; aim: ArmAim; weight: number }[] = [];
      for (const a of running) {
        const def = ACTIONS[a.name];
        const p = clamp((t - a.start) / durationOf(a.name), 0, 1);
        const w = def.raw ? 1 : envelope(p, def.fade?.[0] ?? 0.18, def.fade?.[1] ?? 0.22);
        if (def.clip && actions.has(def.clip)) layers.push({ clip: def.clip, time: t - a.start, weight: w });
        if (def.pose) add(acc, def.pose(p, t), w);
        const posed = def.arms?.(p, t);
        if (posed?.left) arms.push({ side: "left", aim: posed.left, weight: w });
        if (posed?.right) arms.push({ side: "right", aim: posed.right, weight: w });
      }

      // Top layer first: each takes its share of what's left.
      let left = 1;
      const weights = new Map<string, number>();
      for (let i = layers.length - 1; i >= 0; i--) {
        const share = layers[i].weight * left;
        left -= share;
        weights.set(layers[i].clip, (weights.get(layers[i].clip) ?? 0) + share);
        actions.get(layers[i].clip)!.time = layers[i].time;
      }
      weights.set(IDLE, (weights.get(IDLE) ?? 0) + left);
      const idleAction = actions.get(IDLE);
      if (idleAction) idleAction.time = t % duration(IDLE);
      for (const [name, action] of actions) action.setEffectiveWeight(weights.get(name) ?? 0);
      mixer.update(0);

      // The run's leaps are tall: keep them lower.
      const runShare = weights.get(RUN) ?? 0;
      hips.position.y = hipsRestY + (hips.position.y - hipsRestY) * (1 - (1 - RUN_HIPS) * runShare);

      /* ---------------------------------------------- body, head, arms */

      camera.position.set(
        state.camX + pointer.sx * 45 * state.look,
        state.camY - pointer.sy * 25 * state.look,
        state.camZ,
      );

      bot.position.x = base.px + state.x;
      bot.position.y = base.py + state.y - Math.abs(lean) * 40 + acc.botY;
      bot.rotation.set(
        state.rx + pointer.sy * 0.04 * state.look + lean,
        state.ry + (pointer.sx * 0.28 + Math.sin(t * 0.31) * 0.05) * state.look + acc.botRy,
        -pointer.sx * 0.03 * state.look,
      );
      bot.updateMatrixWorld(true);

      // Look toward the pointer: chest a little, then neck and head.
      const look = state.look;
      const pitch = pointer.hy * 0.32 * look + acc.headRx - jolt * 0.1;
      const yaw = pointer.hx * 0.5 * look + acc.headRy;
      const roll = -pointer.hx * 0.06 * look + acc.headRz;
      turnHead(chest, pointer.sy * 0.06 * look + acc.chestRx, pointer.hx * 0.14 * look, 0);
      turnHead(neck, pitch * 0.4, yaw * 0.4, roll * 0.4);
      turnHead(head, pitch * 0.6, yaw * 0.6, roll * 0.6);

      // Hand-posed arms over the clip pose.
      for (const a of arms) aimArm(a.side === "left" ? viewerLeft : viewerRight, a.aim, a.weight);
      // Fast scrolling throws the arms out (not mid-run).
      if (jolt > 0.05 && target.runZone === 0) {
        const out = jolt * 0.6;
        aimArm(viewerLeft, { upper: [-1, 0.35, 0.1], fore: [-1, 0.5, 0.2] }, out);
        aimArm(viewerRight, { upper: [1, 0.35, 0.1], fore: [1, 0.5, 0.2] }, out);
      }
    },
    dispose() {
      ro.disconnect();
      mixer.stopAllAction();
      mixer.uncacheRoot(model);
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("click", onClick);
      document.removeEventListener("visibilitychange", onVisibility);
      document.documentElement.classList.remove("character-hover");
    },
  };
}

export type Rig = NonNullable<ReturnType<typeof createRig>>;
