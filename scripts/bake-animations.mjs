/**
 * Retargets Mixamo animations onto the multi-part robot and bakes them into
 * a compact file the site plays back.
 *
 *   node scripts/bake-animations.mjs
 *   (assets/animations/*.fbx -> public/models/robot-clips.json)
 *
 * The Mixamo rig was built from the robot in a T-pose (scripts/export-mixamo
 * .mjs). For every frame, each Mixamo bone's rotation relative to its rest
 * pose, in world space, is applied to the matching robot part in that same
 * T-pose, top-down through the robot's own hierarchy. Mirrored parts and
 * differing joint axes are handled because only world-space deltas move.
 *
 * Output per clip: the local quaternion of every driven part per frame
 * (int16-quantised, base64) plus the hips' vertical offset.
 */
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import * as THREE from "three";
import { FBXLoader } from "three/addons/loaders/FBXLoader.js";
import { applyTPose, loadRobot, named } from "./lib/robot.mjs";

const DIR = "assets/animations";
const OUT = "public/models/robot-clips.json";
const FPS = 30;

/** Mixamo bone (without the "mixamorig" prefix) → robot part (Spline name). */
const MAP = [
  ["Hips", "Bot"],
  ["Spine2", "Top part"],
  ["Head", "Head"],
  ["Shoulder", "Hand LEFT"],
  ["Arm", "arm"],
  ["ForeArm", "elbow"],
  // The mirrored leg is a separate instance: "Leg Left Instance".
  ["UpLeg", ["Leg Left", "Leg Left Instance"]],
  ["Leg", "shin"],
  ["Foot", "Foot"],
];
const SIDED = new Set(["Shoulder", "Arm", "ForeArm", "UpLeg", "Leg", "Foot"]);

/* ------------------------------------------------------------ the robot */

const { root, bot } = await loadRobot();
applyTPose(root, bot);
const worldX = (o) => o.getWorldPosition(new THREE.Vector3()).x;

// Robot parts, resolved per side by which way they sit on the X axis.
function robotPart(spline, side) {
  const nodes = [spline].flat().flatMap((n) => named(root, n));
  if (!side) return nodes[0];
  // Mixamo "Left" is the character's left: +X when facing +Z.
  const sign = side === "Left" ? 1 : -1;
  return nodes.find((n) => Math.sign(worldX(n) - worldX(bot)) === sign);
}

/* ------------------------------------------------------------ helpers */

const restWorld = new Map(); // robot part -> world matrix in the T-pose
const restLocal = new Map(); // robot part -> local quaternion in the T-pose
const decompose = (m) => {
  const p = new THREE.Vector3(), q = new THREE.Quaternion(), s = new THREE.Vector3();
  m.decompose(p, q, s);
  return { p, q, s };
};
const worldQuat = (o) => decompose(o.matrixWorld).q;

const encode = (floats) => {
  const ints = new Int16Array(floats.length);
  floats.forEach((v, i) => (ints[i] = Math.round(Math.max(-1, Math.min(1, v)) * 32767)));
  return Buffer.from(ints.buffer).toString("base64");
};

/* ------------------------------------------------------------ bake */

const files = readdirSync(DIR).filter((f) => f.toLowerCase().endsWith(".fbx")).sort();
const clips = {};
let pairs; // [mixamo bone name, robot part] resolved once

for (const file of files) {
  const buf = readFileSync(`${DIR}/${file}`);
  const rig = new FBXLoader().parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength), "");
  const clip = rig.animations[0];
  const bones = new Map();
  rig.traverse((o) => o.isBone && bones.set(o.name.replace(/^mixamorig\d*:?/, ""), o));

  // Rest pose of the Mixamo skeleton (before any animation is applied).
  rig.updateMatrixWorld(true);
  const boneRest = new Map([...bones].map(([n, b]) => [n, worldQuat(b)]));
  const hipsRestY = bones.get("Hips").getWorldPosition(new THREE.Vector3()).y;

  if (!pairs) {
    pairs = [];
    for (const [mx, spline] of MAP) {
      for (const side of SIDED.has(mx) ? ["Left", "Right"] : [null]) {
        const boneName = side ? `${side}${mx}` : mx;
        const part = robotPart(spline, side);
        if (!bones.has(boneName) || !part) {
          console.warn(`skip ${boneName} -> ${spline}`);
          continue;
        }
        pairs.push([boneName, part, { bone: boneName, spline: [spline].flat(), side: side === "Left" ? 1 : side === "Right" ? -1 : 0 }]);
      }
    }
    // Parents before children, so each part is solved against its moved parent.
    const depth = (o) => (o.parent ? depth(o.parent) + 1 : 0);
    pairs.sort((a, b) => depth(a[1]) - depth(b[1]));
    root.updateMatrixWorld(true);

    /* Line each robot limb up with its Mixamo bone in the rest pose. The
       robot's meshes don't sit exactly on its joint axes (the forearms droop
       ~25° even in the T-pose), and copying rotations would carry that
       offset along (hanging arms would bend inward). */
    const partOf = new Map(pairs.map(([b, p]) => [b, p]));
    const handMesh = (forearmPart) => {
      let hand;
      forearmPart.traverse((o) => {
        if (!hand && o.isMesh && /^Hand(_\d+)?$/.test(o.name)) hand = o;
      });
      return hand && new THREE.Box3().setFromObject(hand).getCenter(new THREE.Vector3());
    };
    const childOf = {
      Arm: (side) => [partOf.get(`${side}ForeArm`)?.getWorldPosition(new THREE.Vector3()), `${side}ForeArm`],
      ForeArm: (side) => [handMesh(partOf.get(`${side}ForeArm`)), `${side}Hand`],
      UpLeg: (side) => [partOf.get(`${side}Leg`)?.getWorldPosition(new THREE.Vector3()), `${side}Leg`],
      Leg: (side) => [partOf.get(`${side}Foot`)?.getWorldPosition(new THREE.Vector3()), `${side}Foot`],
    };
    for (const [boneName, part] of pairs) {
      const m = boneName.match(/^(Left|Right)(Arm|ForeArm|UpLeg|Leg)$/);
      if (!m) continue;
      root.updateMatrixWorld(true);
      const [childPoint, childBone] = childOf[m[2]](m[1]);
      if (!childPoint || !bones.has(childBone)) continue;
      const pivot = part.getWorldPosition(new THREE.Vector3());
      const robotDir = childPoint.clone().sub(pivot).normalize();
      const boneDir = bones.get(childBone).getWorldPosition(new THREE.Vector3())
        .sub(bones.get(boneName).getWorldPosition(new THREE.Vector3())).normalize();
      const align = new THREE.Quaternion().setFromUnitVectors(robotDir, boneDir);
      const target = new THREE.Matrix4().makeRotationFromQuaternion(align)
        .multiply(part.matrixWorld.clone().setPosition(0, 0, 0)).setPosition(pivot);
      part.quaternion.copy(decompose(part.parent.matrixWorld.clone().invert().multiply(target)).q);
      const deg = (THREE.MathUtils.radToDeg(robotDir.angleTo(boneDir))).toFixed(1);
      console.log(`  align ${boneName}: ${deg}°`);
    }
    root.updateMatrixWorld(true);
    for (const [, part] of pairs) {
      restWorld.set(part, part.matrixWorld.clone());
      restLocal.set(part, part.quaternion.clone());
    }
  }

  const mixer = new THREE.AnimationMixer(rig);
  mixer.clipAction(clip).play();
  const frames = Math.max(2, Math.round(clip.duration * FPS) + 1);
  const tracks = Object.fromEntries(pairs.map(([bone]) => [bone, []]));
  const hipsY = [];

  for (let f = 0; f < frames; f++) {
    mixer.setTime(Math.min(f / FPS, clip.duration));
    rig.updateMatrixWorld(true);

    // Reset the robot to its T-pose, then solve top-down.
    for (const [, part] of pairs) part.quaternion.copy(restLocal.get(part));
    root.updateMatrixWorld(true);

    for (const [boneName, part] of pairs) {
      // World-space rotation of the bone relative to its rest pose.
      const delta = worldQuat(bones.get(boneName)).multiply(boneRest.get(boneName).clone().invert());
      // Rotate the part's rest frame by the same amount, in world space.
      const rest = restWorld.get(part).clone();
      const pos = new THREE.Vector3().setFromMatrixPosition(part.matrixWorld);
      rest.setPosition(0, 0, 0);
      const target = new THREE.Matrix4().makeRotationFromQuaternion(delta).multiply(rest).setPosition(pos);
      const local = part.parent.matrixWorld.clone().invert().multiply(target);
      part.quaternion.copy(decompose(local).q);
      part.updateMatrixWorld(true);
      tracks[boneName].push(...part.quaternion.toArray());
    }
    hipsY.push(bones.get("Hips").getWorldPosition(new THREE.Vector3()).y - hipsRestY);
  }

  const name = file.replace(/\.fbx$/i, "");
  clips[name] = {
    fps: FPS,
    frames,
    duration: +clip.duration.toFixed(3),
    tracks: Object.fromEntries(Object.entries(tracks).map(([k, v]) => [k, encode(v)])),
    // Vertical hips motion only: horizontal travel is dropped (played in place).
    hipsY: hipsY.map((v) => +v.toFixed(1)),
  };
  console.log(`${name}: ${frames} frames, ${clip.duration.toFixed(2)}s`);
}

// Parts are described by Spline name and side (+1 = the robot's +X side), so
// the site resolves them the same way, independent of loader naming.
writeFileSync(OUT, JSON.stringify({ parts: pairs.map(([, , info]) => info), clips }));
console.log(`${OUT}: ${(readFileSync(OUT).length / 1024).toFixed(0)} KB`);
