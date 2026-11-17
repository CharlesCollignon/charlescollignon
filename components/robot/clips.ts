import { PropertyBinding, Quaternion, Vector3, type Object3D } from "three";

/**
 * Motion-capture clips retargeted from Mixamo onto the robot
 * (scripts/bake-animations.mjs → public/models/robot-clips.json).
 */

export const CLIPS_URL = "/models/robot-clips.json";

type PartInfo = { bone: string; spline: string[]; side: -1 | 0 | 1 };
type RawClip = { fps: number; frames: number; duration: number; tracks: Record<string, string>; hipsY: number[] };
type RawFile = { parts: PartInfo[]; clips: Record<string, RawClip> };

export type Clip = {
  fps: number;
  frames: number;
  duration: number;
  /** bone → frames × 4 quaternion components */
  tracks: Map<string, Float32Array>;
  hipsY: number[];
};

export type ClipSet = {
  clips: Record<string, Clip>;
  /** bone → the robot part it drives */
  parts: Map<string, Object3D>;
};

const decode = (b64: string) => {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  const ints = new Int16Array(bytes.buffer);
  const out = new Float32Array(ints.length);
  for (let i = 0; i < ints.length; i++) out[i] = ints[i] / 32767;
  return out;
};

/** Fetch the baked clips and resolve each bone to a part of `model`. */
export async function loadClips(model: Object3D): Promise<ClipSet | null> {
  const res = await fetch(CLIPS_URL);
  if (!res.ok) return null;
  const raw = (await res.json()) as RawFile;

  const bot = model.getObjectByName(PropertyBinding.sanitizeNodeName("Bot"));
  if (!bot) return null;
  model.updateWorldMatrix(true, true);
  const x = (o: Object3D) => o.getWorldPosition(new Vector3()).x;
  const botX = x(bot);

  const parts = new Map<string, Object3D>();
  for (const info of raw.parts) {
    const res = info.spline.map((n) => new RegExp(`^${PropertyBinding.sanitizeNodeName(n)}(_\\d+)?$`));
    const candidates: Object3D[] = [];
    model.traverse((o) => res.some((re) => re.test(o.name)) && candidates.push(o));
    const part = info.side
      ? candidates.find((o) => Math.sign(x(o) - botX) === info.side)
      : candidates[0];
    if (part) parts.set(info.bone, part);
  }

  const clips: Record<string, Clip> = {};
  for (const [name, c] of Object.entries(raw.clips)) {
    clips[name] = {
      fps: c.fps,
      frames: c.frames,
      duration: c.duration,
      hipsY: c.hipsY,
      tracks: new Map(Object.entries(c.tracks).map(([bone, data]) => [bone, decode(data)])),
    };
  }
  return { clips, parts };
}

const qa = new Quaternion();
const qb = new Quaternion();

/** Sample a bone's local rotation at `time` (seconds), interpolating frames. */
export function sampleBone(clip: Clip, bone: string, time: number, out: Quaternion) {
  const track = clip.tracks.get(bone);
  if (!track) return false;
  const f = Math.min(Math.max(time * clip.fps, 0), clip.frames - 1);
  const i = Math.floor(f);
  const j = Math.min(i + 1, clip.frames - 1);
  qa.fromArray(track, i * 4).normalize();
  qb.fromArray(track, j * 4).normalize();
  out.slerpQuaternions(qa, qb, f - i);
  return true;
}

/** The hips' vertical offset at `time`. */
export function sampleHipsY(clip: Clip, time: number) {
  const f = Math.min(Math.max(time * clip.fps, 0), clip.frames - 1);
  const i = Math.floor(f);
  const j = Math.min(i + 1, clip.frames - 1);
  return clip.hipsY[i] + (clip.hipsY[j] - clip.hipsY[i]) * (f - i);
}
