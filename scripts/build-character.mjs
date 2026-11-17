/**
 * Builds the site's character: the Sketchfab model, skinned to a Mixamo
 * skeleton, with its own material and every animation, in one compressed GLB.
 *
 *   npm run character:build
 *   (assets/models/character.source.glb + assets/animations/*.fbx
 *    -> public/models/character.glb)
 *
 * 1. Skeleton: from RIG, an animation downloaded from Mixamo for this mesh
 *    (npm run character:mixamo makes the upload). Its rest pose is a T-pose;
 *    the model stands in an A-pose, so each arm bone is first swung onto the
 *    mesh's arm (the direction that runs through the most vertices).
 * 2. Skin weights: each vertex goes to its nearest bone segment, stray islands
 *    (a thigh next to a hand) are handed to the next-nearest bone, then the
 *    weights are diffused across the surface so joints bend smoothly.
 * 3. Animations: every FBX in assets/animations is retargeted onto the
 *    skeleton (world-space rotation deltas from the T-pose, so clips made on
 *    other Mixamo characters work too). Played in place: the hips keep their
 *    vertical motion only. Clips are named after their files.
 * 4. The source's material and textures are carried over; textures become
 *    1024 px WebP.
 */
import { readdirSync, statSync, writeFileSync } from "node:fs";
import * as THREE from "three";
import { GLTFExporter } from "three/addons/exporters/GLTFExporter.js";
import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import { copyToDocument, meshopt, prune, quantize, resample, textureCompress } from "@gltf-transform/functions";
import { MeshoptEncoder } from "meshoptimizer";
import sharp from "sharp";
import { SOURCE, boneKey, loadCharacterGeometry, loadFBX } from "./lib/character.mjs";

const RIG = "assets/animations/breathing-idle.fbx";
const ANIMATIONS = "assets/animations";
const OUT = "public/models/character.glb";
const FPS = 30;
/** The site's scene units: feet at this height inside the "Bot" node. */
const FEET_Y = -243;

/* ---------------------------------------------------------------- skeleton */

const rig = loadFBX(RIG);
const bones = new Map();
rig.traverse((o) => o.isBone && bones.set(boneKey(o.name), o));
const hips = bones.get("Hips");
const bone = (name) => {
  const b = bones.get(name);
  if (!b) throw new Error(`Missing bone ${name} in ${RIG}`);
  return b;
};
const world = (o) => o.getWorldPosition(new THREE.Vector3());
const worldQ = (o) => o.getWorldQuaternion(new THREE.Quaternion());

// The T-pose, recorded for retargeting before the arms are moved.
rig.updateMatrixWorld(true);
const tposeWorldQ = new Map([...bones].map(([n, b]) => [n, worldQ(b)]));
const tposeLocalQ = new Map([...bones].map(([n, b]) => [n, b.quaternion.clone()]));
const tposeHipsY = world(hips).y;

/* ---------------------------------------------------------------- mesh */

const geometry = await loadCharacterGeometry();
const P = geometry.attributes.position;
const V = P.count;
const points = Array.from({ length: V }, (_, i) => new THREE.Vector3().fromBufferAttribute(P, i));

/** Turn `b` (in world space) so its child sits along `dir`. */
function aim(b, child, dir) {
  rig.updateMatrixWorld(true);
  const from = world(child).sub(world(b)).normalize();
  const turn = new THREE.Quaternion().setFromUnitVectors(from, dir.clone().normalize());
  b.quaternion.copy(worldQ(b.parent).invert().multiply(turn.multiply(worldQ(b))));
  rig.updateMatrixWorld(true);
}

const segDist = (p, a, b) => {
  const ab = b.clone().sub(a);
  const t = THREE.MathUtils.clamp(p.clone().sub(a).dot(ab) / ab.lengthSq(), 0, 1);
  return p.distanceTo(a.clone().addScaledVector(ab, t));
};

/**
 * The direction from `from` (length `len`) that passes through the most mesh
 * vertices: a limb's axis. Searched over a cone around `guess`.
 */
/**
 * The arm's vertices on one side: in each horizontal slice, whatever lies
 * beyond the outermost gap (in an A-pose the arm hangs clear of the body
 * below the armpit; above it nothing is taken).
 */
function armPoints(side) {
  const slices = new Map();
  for (const p of points) {
    if (p.x * side <= 0) continue;
    const k = Math.round(p.y / 3);
    if (!slices.has(k)) slices.set(k, []);
    slices.get(k).push(p);
  }
  const out = [];
  for (const slice of slices.values()) {
    slice.sort((a, b) => a.x * side - b.x * side);
    let cut = -1;
    for (let i = 1; i < slice.length; i++) if ((slice[i].x - slice[i - 1].x) * side > 4) cut = i;
    if (cut > 0) out.push(...slice.slice(cut));
  }
  return out;
}
const arms = { 1: armPoints(1), [-1]: armPoints(-1) };

function limbDirection(from, len, guess, side) {
  const near = arms[side].filter((p) => p.distanceTo(from) < len * 1.2);
  let best = { score: -1, dir: guess };
  const g = guess.clone().normalize();
  for (let pitch = -1.4; pitch <= 1.4; pitch += 0.035) {
    for (let yaw = -0.6; yaw <= 0.6; yaw += 0.05) {
      const dir = g.clone().applyEuler(new THREE.Euler(yaw, 0, pitch * side, "YXZ"));
      // Score the far part only (the shoulder's bulk would pull every arm
      // inward), favouring vertices near the axis.
      let score = 0;
      for (const p of near) {
        const rel = p.clone().sub(from);
        const t = rel.dot(dir) / len;
        if (t < 0.35 || t > 1.05) continue;
        const d = rel.addScaledVector(dir, -t * len).length();
        if (d < 14) score += 1 - d / 14;
      }
      if (score > best.score) best = { score, dir };
    }
  }
  return best;
}

// Arms: shoulder → elbow → wrist → fingertips, each swung onto the mesh.
const deg = (v) => THREE.MathUtils.radToDeg(v).toFixed(0);
for (const [side, s] of [["Left", 1], ["Right", -1]]) {
  const chain = [`${side}Arm`, `${side}ForeArm`, `${side}Hand`, `${side}HandIndex4`].map(bone);
  for (let i = 0; i < 3; i++) {
    const [b, child] = [chain[i], chain[i + 1]];
    const len = world(child).distanceTo(world(b));
    const current = world(child).sub(world(b));
    const { dir, score } = limbDirection(world(b), len, current, s);
    aim(b, child, dir);
    console.log(`${b.name}: ${deg(Math.acos(-dir.y))}° from vertical (score ${score.toFixed(0)})`);
  }
}
rig.updateMatrixWorld(true);

/* ---------------------------------------------------------------- weights */

// Each weighted bone covers the segment to its child.
const SEGMENTS = [
  ["Hips", "Spine"], ["Spine", "Spine1"], ["Spine1", "Spine2"], ["Spine2", "Neck"],
  ["Neck", "Head"], ["Head", "HeadTop_End"],
  ...["Left", "Right"].flatMap((s) => [
    [`${s}Shoulder`, `${s}Arm`], [`${s}Arm`, `${s}ForeArm`], [`${s}ForeArm`, `${s}Hand`],
    [`${s}Hand`, `${s}HandIndex1`],
    [`${s}HandIndex1`, `${s}HandIndex2`], [`${s}HandIndex2`, `${s}HandIndex3`], [`${s}HandIndex3`, `${s}HandIndex4`],
    [`${s}HandThumb1`, `${s}HandThumb2`], [`${s}HandThumb2`, `${s}HandThumb3`], [`${s}HandThumb3`, `${s}HandThumb4`],
    [`${s}UpLeg`, `${s}Leg`], [`${s}Leg`, `${s}Foot`], [`${s}Foot`, `${s}ToeBase`], [`${s}ToeBase`, `${s}Toe_End`],
  ]),
].filter(([a, b]) => bones.has(a) && bones.has(b));
const skinBones = [...bones.values()]; // skeleton order
const segs = SEGMENTS.map(([a, b]) => ({ index: skinBones.indexOf(bone(a)), a: world(bone(a)), b: world(bone(b)) }));
const B = segs.length;

// Work on welded corners: UV seams split vertices that are one point on the body.
const key = (p) => `${Math.round(p.x * 1e3)},${Math.round(p.y * 1e3)},${Math.round(p.z * 1e3)}`;
const ids = new Map();
const weld = new Int32Array(V); // vertex -> corner
const corners = [];
for (let i = 0; i < V; i++) {
  const k = key(points[i]);
  if (!ids.has(k)) {
    ids.set(k, corners.length);
    corners.push(points[i]);
  }
  weld[i] = ids.get(k);
}
const C = corners.length;
const index = geometry.index.array;
const adj = Array.from({ length: C }, () => new Set());
for (let f = 0; f < index.length; f += 3) {
  const [a, b, c] = [weld[index[f]], weld[index[f + 1]], weld[index[f + 2]]];
  adj[a].add(b).add(c);
  adj[b].add(a).add(c);
  adj[c].add(a).add(b);
}
const neighbours = adj.map((s) => [...s]);
let edge = 0;
let edges = 0;
for (let i = 0; i < C; i++) {
  for (const j of neighbours[i]) {
    edge += corners[i].distanceTo(corners[j]);
    edges++;
  }
}
edge /= edges;

// 1. Nearest segment, with the alternatives ranked for reassignment.
const ranked = [];
const label = new Int32Array(C);
for (let i = 0; i < C; i++) {
  const order = segs.map((s, k) => [k, segDist(corners[i], s.a, s.b)]).sort((x, y) => x[1] - y[1]);
  ranked.push(order.map(([k]) => k));
  label[i] = order[0][0];
}

// 2. Each bone keeps only its largest connected patch; strays move on to their
//    next-nearest bone (a thigh beside the hand is not part of the hand).
for (let pass = 0; pass < 6; pass++) {
  let moved = 0;
  const seen = new Uint8Array(C);
  const patches = Array.from({ length: B }, () => []);
  for (let i = 0; i < C; i++) {
    if (seen[i]) continue;
    const patch = [];
    const stack = [i];
    seen[i] = 1;
    while (stack.length) {
      const v = stack.pop();
      patch.push(v);
      for (const n of neighbours[v]) {
        if (!seen[n] && label[n] === label[i]) {
          seen[n] = 1;
          stack.push(n);
        }
      }
    }
    patches[label[i]].push(patch);
  }
  for (const list of patches) {
    list.sort((a, b) => b.length - a.length);
    for (const patch of list.slice(1)) {
      for (const v of patch) {
        const r = ranked[v];
        label[v] = r[r.indexOf(label[v]) + 1] ?? label[v];
        moved++;
      }
    }
  }
  if (!moved) break;
  console.log(`pass ${pass}: ${moved} stray corners reassigned`);
}

// 3. Diffuse across the surface so each joint blends over ~BLEND units.
const BLEND = 12;
const iterations = Math.max(4, Math.round((BLEND / edge) ** 2));
let w = new Float32Array(C * B);
for (let i = 0; i < C; i++) w[i * B + label[i]] = 1;
for (let it = 0; it < iterations; it++) {
  const next = new Float32Array(C * B);
  for (let i = 0; i < C; i++) {
    const n = neighbours[i];
    for (let k = 0; k < B; k++) {
      let sum = 0;
      for (const j of n) sum += w[j * B + k];
      next[i * B + k] = n.length ? 0.5 * w[i * B + k] + (0.5 * sum) / n.length : w[i * B + k];
    }
  }
  w = next;
}
console.log(`weights: ${C} corners (${V} vertices), mean edge ${edge.toFixed(2)}, ${iterations} diffusion steps`);

// Top four influences per vertex.
const skinIndex = new Uint16Array(V * 4);
const skinWeight = new Float32Array(V * 4);
for (let i = 0; i < V; i++) {
  const c = weld[i];
  const top = Array.from({ length: B }, (_, k) => [k, w[c * B + k]])
    .sort((x, y) => y[1] - x[1])
    .slice(0, 4);
  const total = top.reduce((s, [, v]) => s + v, 0);
  top.forEach(([k, v], j) => {
    skinIndex[i * 4 + j] = segs[k].index;
    skinWeight[i * 4 + j] = v / total;
  });
}
geometry.setAttribute("skinIndex", new THREE.Uint16BufferAttribute(skinIndex, 4));
geometry.setAttribute("skinWeight", new THREE.Float32BufferAttribute(skinWeight, 4));

/* ---------------------------------------------------------------- animations */

/** World-space delta retarget of one Mixamo clip onto our T-posed skeleton. */
function retarget(file) {
  const src = loadFBX(file);
  const clip = src.animations[0];
  const srcBones = new Map();
  src.traverse((o) => o.isBone && srcBones.set(boneKey(o.name), o));
  const srcRest = new Map([...srcBones].map(([n, b]) => [n, worldQ(b)]));
  const srcHipsY = world(srcBones.get("Hips")).y;
  const hipsScale = tposeHipsY / srcHipsY;

  // Solve on a T-posed copy of our skeleton, parents first.
  const solve = new Map();
  const root = new THREE.Object3D();
  const build = (b, parent) => {
    const o = new THREE.Object3D();
    o.position.copy(b.position);
    o.quaternion.copy(tposeLocalQ.get(boneKey(b.name)));
    parent.add(o);
    solve.set(boneKey(b.name), o);
    b.children.filter((c) => c.isBone).forEach((c) => build(c, o));
  };
  build(hips, root);
  const order = [...solve.keys()];

  const mixer = new THREE.AnimationMixer(src);
  mixer.clipAction(clip).play();
  const frames = Math.max(2, Math.round(clip.duration * FPS) + 1);
  const times = new Float32Array(frames);
  const quats = new Map(order.map((n) => [n, new Float32Array(frames * 4)]));
  const hipsPos = new Float32Array(frames * 3);

  for (let f = 0; f < frames; f++) {
    const time = Math.min(f / FPS, clip.duration);
    times[f] = time;
    mixer.setTime(time);
    src.updateMatrixWorld(true);
    for (const name of order) {
      const o = solve.get(name);
      const s = srcBones.get(name);
      if (s) {
        const delta = worldQ(s).multiply(srcRest.get(name).clone().invert());
        const target = delta.multiply(tposeWorldQ.get(name));
        o.quaternion.copy(worldQ(o.parent).invert().multiply(target));
      }
      o.updateMatrixWorld(true);
      o.quaternion.toArray(quats.get(name), f * 4);
    }
    const y = (world(srcBones.get("Hips")).y - srcHipsY) * hipsScale;
    hipsPos.set([hips.position.x, hips.position.y + y, hips.position.z], f * 3);
  }

  const name = file.split("/").pop().replace(/\.fbx$/i, "");
  const tracks = [
    new THREE.VectorKeyframeTrack(`${hips.name}.position`, times, hipsPos),
    ...order.map((n) => new THREE.QuaternionKeyframeTrack(`${bone(n).name}.quaternion`, times, quats.get(n))),
  ];
  console.log(`${name}: ${clip.duration.toFixed(2)}s, ${frames} frames (${srcBones.size} source bones)`);
  return new THREE.AnimationClip(name, clip.duration, tracks);
}

const files = readdirSync(ANIMATIONS).filter((f) => f.toLowerCase().endsWith(".fbx")).sort();
const clips = files.map((f) => retarget(`${ANIMATIONS}/${f}`));

/* ---------------------------------------------------------------- assemble */

// Bind in the mesh's own pose (arms lowered).
rig.updateMatrixWorld(true);
const MATERIAL = "Character";
const mesh = new THREE.SkinnedMesh(geometry, new THREE.MeshStandardMaterial({ name: MATERIAL }));
mesh.name = "Character";
const character = new THREE.Group();
character.name = "Rig";
character.position.y = FEET_Y;
hips.removeFromParent();
character.add(hips, mesh);
character.updateMatrixWorld(true);
mesh.bind(new THREE.Skeleton(skinBones), mesh.matrixWorld);
const bot = new THREE.Group();
bot.name = "Bot";
bot.add(character);
const scene = new THREE.Scene();
scene.add(bot);

// GLTFExporter writes binaries through FileReader, which Node lacks.
globalThis.FileReader ??= class {
  readAsArrayBuffer(blob) {
    blob.arrayBuffer().then((r) => {
      this.result = r;
      this.onloadend?.();
    });
  }
};
const glb = await new GLTFExporter().parseAsync(scene, { binary: true, animations: clips });

const io = new NodeIO()
  .registerExtensions(ALL_EXTENSIONS)
  .registerDependencies({ "meshopt.encoder": MeshoptEncoder });
await MeshoptEncoder.ready;
const doc = await io.readBinary(new Uint8Array(glb));

// The source's own material (base colour, metal/roughness and normal maps).
const source = await io.read(SOURCE);
const sourceMaterial = source.getRoot().listMaterials()[0];
const material = copyToDocument(doc, source, [sourceMaterial]).get(sourceMaterial);
material.setName(MATERIAL);
for (const m of doc.getRoot().listMeshes()) for (const p of m.listPrimitives()) p.setMaterial(material);

await doc.transform(
  resample(),
  prune(),
  textureCompress({ encoder: sharp, targetFormat: "webp", resize: [1024, 1024], quality: 82 }),
  quantize(),
  meshopt({ encoder: MeshoptEncoder, level: "high" }),
);
writeFileSync(OUT, await io.writeBinary(doc));
console.log(`${OUT}: ${V} vertices, ${clips.length} clips, ${(statSync(OUT).size / 1024).toFixed(0)} KB`);
