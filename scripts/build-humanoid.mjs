/**
 * Builds the site's character: the Sketchfab humanoid, skinned to the Mixamo
 * skeleton, with every animation, in one compressed GLB.
 *
 *   npm run humanoid:build
 *   (assets/models/humanoid-static.glb + assets/animations/*.fbx
 *    -> public/models/humanoid.glb)
 *
 * 1. Skeleton: from RIG, an animation downloaded from Mixamo for this mesh
 *    (FBX Binary, Without Skin). Its rest pose is a T-pose; the mesh hangs
 *    its arms, so the arm bones are first turned down into the mesh's arms.
 * 2. Skin weights: each vertex goes to its nearest bone segment, stray islands
 *    (a thigh next to a hand) are handed to the next-nearest bone, then the
 *    weights are diffused across the surface so joints bend smoothly.
 * 3. Animations: every FBX in assets/animations is retargeted onto the
 *    skeleton (world-space rotation deltas from the T-pose, so clips made on
 *    other Mixamo characters work too). Played in place: the hips keep their
 *    vertical motion only. Clips are named after their files.
 */
import { readdirSync, statSync, writeFileSync } from "node:fs";
import * as THREE from "three";
import { GLTFExporter } from "three/addons/exporters/GLTFExporter.js";
import { NodeIO } from "@gltf-transform/core";
import { EXTMeshoptCompression, KHRMeshQuantization } from "@gltf-transform/extensions";
import { meshopt, prune, quantize, resample } from "@gltf-transform/functions";
import { MeshoptEncoder } from "meshoptimizer";
import { boneKey, loadFBX, loadHumanoidGeometry } from "./lib/humanoid.mjs";

const RIG = "assets/animations/running-jump.fbx";
/**
 * RIG was made in Mixamo from the first upload, which faced -Z: Mixamo fitted
 * the skeleton facing +Z, i.e. to the mesh's back. The mesh is now turned
 * around (scripts/lib/humanoid.mjs), so the joints' depths are mirrored to
 * follow it. Set to false once RIG comes from a fresh upload of the turned
 * mesh (npm run humanoid:mixamo).
 */
const RIG_FITTED_BACKWARDS = true;
const ANIMATIONS = "assets/animations";
const OUT = "public/models/humanoid.glb";
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

if (RIG_FITTED_BACKWARDS) {
  // Mirror each joint's depth (z → -z), parents first; rotations are kept.
  rig.updateMatrixWorld(true);
  const targets = new Map([...bones.values()].map((b) => [b, world(b).multiply(new THREE.Vector3(1, 1, -1))]));
  for (const b of bones.values()) {
    b.parent.updateMatrixWorld(true);
    b.position.copy(b.parent.worldToLocal(targets.get(b).clone()));
    b.updateMatrixWorld(true);
  }
}

// The T-pose, recorded for retargeting before the arms are moved.
rig.updateMatrixWorld(true);
const tposeWorldQ = new Map([...bones].map(([n, b]) => [n, worldQ(b)]));
const tposeLocalQ = new Map([...bones].map(([n, b]) => [n, b.quaternion.clone()]));
const tposeHipsY = world(hips).y;

/* ---------------------------------------------------------------- mesh */

const geometry = await loadHumanoidGeometry();
const P = geometry.attributes.position;
const V = P.count;
const vx = (i) => new THREE.Vector3(P.getX(i), P.getY(i), P.getZ(i));

/** Turn `b` (in world space) so its child sits along `dir`. */
function aim(b, child, dir) {
  rig.updateMatrixWorld(true);
  const from = world(child).sub(world(b)).normalize();
  const turn = new THREE.Quaternion().setFromUnitVectors(from, dir.clone().normalize());
  const target = turn.multiply(worldQ(b));
  b.quaternion.copy(worldQ(b.parent).invert().multiply(target));
  rig.updateMatrixWorld(true);
}

/** Axis of the vertices in a region (centroid + principal direction). */
function axis(filter) {
  const pts = [];
  for (let i = 0; i < V; i++) {
    const p = vx(i);
    if (filter(p)) pts.push(p);
  }
  const c = pts.reduce((a, p) => a.add(p), new THREE.Vector3()).divideScalar(pts.length);
  // Power iteration on the covariance matrix.
  let d = new THREE.Vector3(0, -1, 0);
  for (let k = 0; k < 20; k++) {
    const n = new THREE.Vector3();
    for (const p of pts) {
      const q = p.clone().sub(c);
      n.addScaledVector(q, q.dot(d));
    }
    d = n.normalize();
  }
  if (d.y > 0) d.negate(); // pointing down the arm
  return { c, d, n: pts.length };
}

// Arms: below the armpit they stand clear of the body (|x| > 50).
for (const [side, s] of [["Left", 1], ["Right", -1]]) {
  const arm = bone(`${side}Arm`), fore = bone(`${side}ForeArm`), hand = bone(`${side}Hand`);
  const upper = axis((p) => p.x * s > 50 && p.y > 300 && p.y < 385);
  // Upper arm: from the shoulder joint through the middle of the upper arm.
  aim(arm, fore, upper.c.clone().sub(world(arm)));
  const lower = axis((p) => p.x * s > 50 && p.y > 150 && p.y < 280);
  // Forearm: from the elbow to the forearm's axis, a forearm-length on.
  const elbow = world(fore);
  const t = lower.d.clone();
  const along = lower.c.clone().addScaledVector(t, -lower.c.clone().sub(elbow).dot(t));
  const len = world(hand).distanceTo(elbow);
  aim(fore, hand, along.addScaledVector(t, len).sub(elbow));
  const deg = (v) => THREE.MathUtils.radToDeg(v).toFixed(0);
  console.log(
    `${side} arm: upper ${deg(Math.acos(-upper.d.y))}° from vertical (${upper.n} verts), ` +
      `forearm ${deg(Math.acos(-lower.d.y))}° (${lower.n}), elbow y ${world(fore).y.toFixed(0)}, hand y ${world(hand).y.toFixed(0)}`,
  );
}
// Hands and fingers continue the forearm.
for (const side of ["Left", "Right"]) {
  const dir = world(bone(`${side}Hand`)).sub(world(bone(`${side}ForeArm`)));
  aim(bone(`${side}Hand`), bone(`${side}HandIndex1`), dir);
  for (const i of [1, 2, 3]) aim(bone(`${side}HandIndex${i}`), bone(`${side}HandIndex${i + 1}`), dir);
}
rig.updateMatrixWorld(true);

/* ---------------------------------------------------------------- weights */

// Each weighted bone covers the segment to its child.
const SEGMENTS = [
  ["Hips", "Spine"], ["Spine", "Spine1"], ["Spine1", "Spine2"], ["Spine2", "Neck"],
  ["Neck", "Head"], ["Head", "HeadTop_End"],
  ...["Left", "Right"].flatMap((s) => [
    [`${s}Shoulder`, `${s}Arm`], [`${s}Arm`, `${s}ForeArm`], [`${s}ForeArm`, `${s}Hand`],
    [`${s}Hand`, `${s}HandIndex4`],
    [`${s}UpLeg`, `${s}Leg`], [`${s}Leg`, `${s}Foot`], [`${s}Foot`, `${s}ToeBase`], [`${s}ToeBase`, `${s}Toe_End`],
  ]),
];
const skinBones = [...bones.values()]; // skeleton order
const segs = SEGMENTS.map(([a, b]) => ({
  index: skinBones.indexOf(bone(a)),
  a: world(bone(a)),
  b: world(bone(b)),
}));
const B = segs.length;
const segDist = (p, s) => {
  const ab = s.b.clone().sub(s.a);
  const t = THREE.MathUtils.clamp(p.clone().sub(s.a).dot(ab) / ab.lengthSq(), 0, 1);
  return p.distanceTo(s.a.clone().addScaledVector(ab, t));
};

// Neighbours along mesh edges.
const index = geometry.index.array;
const adj = Array.from({ length: V }, () => new Set());
for (let f = 0; f < index.length; f += 3) {
  const [a, b, c] = [index[f], index[f + 1], index[f + 2]];
  adj[a].add(b).add(c);
  adj[b].add(a).add(c);
  adj[c].add(a).add(b);
}
const neighbours = adj.map((s) => [...s]);
let edge = 0;
for (let i = 0; i < V; i++) for (const j of neighbours[i]) edge += vx(i).distanceTo(vx(j));
edge /= neighbours.reduce((n, s) => n + s.length, 0);

// 1. Nearest segment, with the alternatives ranked for reassignment.
const ranked = [];
const label = new Int32Array(V);
for (let i = 0; i < V; i++) {
  const p = vx(i);
  const order = segs.map((s, k) => [k, segDist(p, s)]).sort((x, y) => x[1] - y[1]);
  ranked.push(order.map(([k]) => k));
  label[i] = order[0][0];
}

// 2. Each bone keeps only its largest connected patch; strays move on to their
//    next-nearest bone (a thigh beside the hand is not part of the hand).
for (let pass = 0; pass < 4; pass++) {
  let moved = 0;
  const seen = new Uint8Array(V);
  const patches = Array.from({ length: B }, () => []);
  for (let i = 0; i < V; i++) {
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
  console.log(`pass ${pass}: ${moved} stray vertices reassigned`);
}

// 3. Diffuse across the surface so each joint blends over ~BLEND units.
const BLEND = 14;
const iterations = Math.round((BLEND / edge) ** 2);
let w = new Float32Array(V * B);
for (let i = 0; i < V; i++) w[i * B + label[i]] = 1;
for (let it = 0; it < iterations; it++) {
  const next = new Float32Array(V * B);
  for (let i = 0; i < V; i++) {
    const n = neighbours[i];
    for (let k = 0; k < B; k++) {
      let sum = 0;
      for (const j of n) sum += w[j * B + k];
      next[i * B + k] = 0.5 * w[i * B + k] + (0.5 * sum) / n.length;
    }
  }
  w = next;
}
console.log(`weights: mean edge ${edge.toFixed(2)}, ${iterations} diffusion steps`);

// Top four influences per vertex.
const skinIndex = new Uint16Array(V * 4);
const skinWeight = new Float32Array(V * 4);
for (let i = 0; i < V; i++) {
  const top = Array.from({ length: B }, (_, k) => [k, w[i * B + k]])
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
  const solve = new Map(); // bone name -> scratch Object3D
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
        o.updateWorldMatrix(true, false);
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

// Bind with the arms lowered (the mesh's own pose).
rig.updateMatrixWorld(true);
const mesh = new THREE.SkinnedMesh(geometry, new THREE.MeshStandardMaterial({ name: "Humanoid" }));
mesh.name = "Humanoid";
const character = new THREE.Group();
character.name = "Character";
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
  readAsDataURL(blob) {
    blob.arrayBuffer().then((r) => {
      this.result = `data:${blob.type};base64,${Buffer.from(r).toString("base64")}`;
      this.onloadend?.();
    });
  }
};
const glb = await new GLTFExporter().parseAsync(scene, { binary: true, animations: clips });

const io = new NodeIO()
  .registerExtensions([EXTMeshoptCompression, KHRMeshQuantization])
  .registerDependencies({ "meshopt.encoder": MeshoptEncoder });
await MeshoptEncoder.ready;
const doc = await io.readBinary(new Uint8Array(glb));
await doc.transform(resample(), prune(), quantize(), meshopt({ encoder: MeshoptEncoder, level: "high" }));
writeFileSync(OUT, await io.writeBinary(doc));
console.log(`${OUT}: ${V} vertices, ${clips.length} clips, ${(statSync(OUT).size / 1024).toFixed(0)} KB`);
