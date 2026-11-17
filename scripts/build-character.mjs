/**
 * Builds the site's character: the Sketchfab model as rigged by Mixamo, in
 * dark chrome, with every animation, in one compressed GLB.
 *
 *   npm run character:build
 *   (assets/animations/*.fbx + assets/models/character.source.glb
 *    -> public/models/character.glb)
 *
 * 1. Mesh and skin: from SKIN, an animation downloaded from Mixamo for this
 *    character *With Skin* (Mixamo's skeleton and skin weights).
 * 2. T-pose: from TPOSE, a download *Without Skin*, whose rest pose is
 *    Mixamo's T-pose. Clips are retargeted from it.
 * 3. Animations: every FBX in assets/animations is retargeted onto the
 *    skeleton (world-space rotation deltas from the T-pose, so clips made on
 *    other Mixamo characters work too). Played in place: the hips keep their
 *    vertical motion only. Clips are named after their files.
 * 4. Material: dark chrome under a clear coat, keeping the source's normal map
 *    (its sculpted detail) at full resolution.
 */
import { readdirSync, statSync, writeFileSync } from "node:fs";
import * as THREE from "three";
import { GLTFExporter } from "three/addons/exporters/GLTFExporter.js";
import { mergeVertices } from "three/addons/utils/BufferGeometryUtils.js";
import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS, KHRMaterialsClearcoat } from "@gltf-transform/extensions";
import { copyToDocument, meshopt, prune, quantize, resample, textureCompress } from "@gltf-transform/functions";
import { MeshoptEncoder } from "meshoptimizer";
import sharp from "sharp";
import { SOURCE, boneKey, loadFBX } from "./lib/character.mjs";

const SKIN = "assets/animations/quick-formal-bow.fbx";
const TPOSE = "assets/animations/breathing-idle.fbx";
const ANIMATIONS = "assets/animations";
const OUT = "public/models/character.glb";
const FPS = 30;
/** The site's scene units: feet at this height inside the "Bot" node. */
const FEET_Y = -243;

/** Dark chrome: a near-black mirror under a thin lacquer. */
const CHROME = {
  color: [0.16, 0.17, 0.19, 1], // linear
  metallic: 1,
  roughness: 0.2,
  clearcoat: 0.7,
  clearcoatRoughness: 0.06,
};

const world = (o) => o.getWorldPosition(new THREE.Vector3());
const worldQ = (o) => o.getWorldQuaternion(new THREE.Quaternion());
const bonesOf = (root) => {
  const m = new Map();
  root.traverse((o) => o.isBone && m.set(boneKey(o.name), o));
  return m;
};
const hasSkin = (root) => {
  let found = false;
  root.traverse((o) => (found ||= Boolean(o.isSkinnedMesh)));
  return found;
};

/* ---------------------------------------------------------------- skin */

const skin = loadFBX(SKIN);
let mesh;
skin.traverse((o) => {
  if (o.isSkinnedMesh) mesh = o;
});
if (!mesh) throw new Error(`${SKIN} has no mesh: download it from Mixamo "With Skin"`);
const bones = bonesOf(skin);
const hips = bones.get("Hips");
const bindLocalQ = new Map([...bones].map(([n, b]) => [n, b.quaternion.clone()]));

// Mixamo's mesh is a triangle soup: weld it, and add tangents for the normal map.
const soup = mesh.geometry;
for (const name of Object.keys(soup.attributes)) {
  if (!["position", "normal", "uv", "skinIndex", "skinWeight"].includes(name)) soup.deleteAttribute(name);
}
mesh.geometry = mergeVertices(soup, 1e-4);
mesh.geometry.computeTangents();
mesh.name = "Character";

/* ---------------------------------------------------------------- T-pose */

// Mixamo skeletons share their bones' local frames: the T-pose skeleton's
// rotations put this one in the T-pose too.
const tposeBones = bonesOf(loadFBX(TPOSE));
const toTPose = (boneMap) => {
  for (const [n, b] of boneMap) {
    const t = tposeBones.get(n);
    if (t) b.quaternion.copy(t.quaternion);
  }
};
toTPose(bones);
skin.updateMatrixWorld(true);
const tposeWorldQ = new Map([...bones].map(([n, b]) => [n, worldQ(b)]));
const tposeLocalQ = new Map([...bones].map(([n, b]) => [n, b.quaternion.clone()]));
const tposeHipsY = world(hips).y;
// Back to the bind pose (the mesh's own).
for (const [n, b] of bones) b.quaternion.copy(bindLocalQ.get(n));
skin.updateMatrixWorld(true);

/* ---------------------------------------------------------------- animations */

/** World-space delta retarget of one Mixamo clip onto our T-posed skeleton. */
function retarget(file) {
  const src = loadFBX(file);
  const clip = src.animations[0];
  const srcBones = bonesOf(src);
  // A download with skin rests in the character's own pose, not the T-pose.
  if (hasSkin(src)) {
    toTPose(srcBones);
    src.updateMatrixWorld(true);
  }
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
    ...order.map((n) => new THREE.QuaternionKeyframeTrack(`${bones.get(n).name}.quaternion`, times, quats.get(n))),
  ];
  console.log(`${name}: ${clip.duration.toFixed(2)}s, ${frames} frames (${srcBones.size} source bones)`);
  return new THREE.AnimationClip(name, clip.duration, tracks);
}

const files = readdirSync(ANIMATIONS).filter((f) => f.toLowerCase().endsWith(".fbx")).sort();
const clips = files.map((f) => retarget(`${ANIMATIONS}/${f}`));

/* ---------------------------------------------------------------- assemble */

// Bot (moved by the site) > Rig (feet at FEET_Y) > Mixamo's hips and mesh.
// The mesh keeps Mixamo's bind matrices: they're relative to the rig, which
// moves as a whole.
const rig = new THREE.Group();
rig.name = "Rig";
rig.position.y = FEET_Y;
rig.add(...skin.children);
const bot = new THREE.Group();
bot.name = "Bot";
bot.add(rig);
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
mesh.material = new THREE.MeshStandardMaterial({ name: "Chrome" });
const glb = await new GLTFExporter().parseAsync(scene, { binary: true, animations: clips });

const io = new NodeIO()
  .registerExtensions(ALL_EXTENSIONS)
  .registerDependencies({ "meshopt.encoder": MeshoptEncoder });
await MeshoptEncoder.ready;
const doc = await io.readBinary(new Uint8Array(glb));

// Dark chrome, with the source's normal map for the sculpted detail.
const source = await io.read(SOURCE);
const sourceMaterial = source.getRoot().listMaterials()[0];
const material = copyToDocument(doc, source, [sourceMaterial]).get(sourceMaterial);
material
  .setName("Chrome")
  .setBaseColorTexture(null)
  .setMetallicRoughnessTexture(null)
  .setBaseColorFactor(CHROME.color)
  .setMetallicFactor(CHROME.metallic)
  .setRoughnessFactor(CHROME.roughness);
for (const ext of material.listExtensions()) material.setExtension(ext.extensionName, null);
const clearcoat = doc.createExtension(KHRMaterialsClearcoat);
material.setExtension(
  "KHR_materials_clearcoat",
  clearcoat.createClearcoat().setClearcoatFactor(CHROME.clearcoat).setClearcoatRoughnessFactor(CHROME.clearcoatRoughness),
);
for (const m of doc.getRoot().listMeshes()) for (const p of m.listPrimitives()) p.setMaterial(material);

await doc.transform(
  resample(),
  prune(),
  textureCompress({ encoder: sharp, targetFormat: "webp", quality: 92 }),
  quantize(),
  meshopt({ encoder: MeshoptEncoder, level: "high" }),
);
writeFileSync(OUT, await io.writeBinary(doc));
const v = mesh.geometry.attributes.position.count;
console.log(`${OUT}: ${v} vertices, ${clips.length} clips, ${(statSync(OUT).size / 1024).toFixed(0)} KB`);
