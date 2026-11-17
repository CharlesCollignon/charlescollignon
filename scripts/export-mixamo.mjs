/**
 * Exports the robot as a Mixamo-ready OBJ: one merged mesh, in a T-pose,
 * feet on the ground, facing +Z.
 *
 *   node scripts/export-mixamo.mjs
 *   (assets/models/robot.source.glb -> assets/models/robot-tpose.obj)
 *
 * The site never loads this file. Mixamo only uses it to build a skeleton;
 * the animations it produces are retargeted onto the original, multi-part
 * robot at runtime, so materials, the LED face and the emblem are kept.
 */
import { readFileSync, writeFileSync } from "node:fs";
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { OBJExporter } from "three/addons/exporters/OBJExporter.js";
import { mergeGeometries, mergeVertices } from "three/addons/utils/BufferGeometryUtils.js";

const SRC = "assets/models/robot.source.glb";
const OUT = "assets/models/robot-tpose.obj";

const data = readFileSync(SRC);
const gltf = await new Promise((resolve, reject) =>
  new GLTFLoader().parse(
    data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength),
    "",
    resolve,
    reject,
  ),
);
const scene = gltf.scene;
const bot = scene.getObjectByName("Bot");
if (!bot) throw new Error('No "Bot" node');
// Work in Spline units around the robot alone.
bot.removeFromParent();
const root = new THREE.Group();
root.add(bot);
root.updateMatrixWorld(true);

const named = (name) => {
  const re = new RegExp(`^${THREE.PropertyBinding.sanitizeNodeName(name)}(_\\d+)?$`);
  const out = [];
  root.traverse((o) => re.test(o.name) && out.push(o));
  return out;
};

/* T-pose: rotate each upper arm (about its local Z) until the shoulder→elbow
   direction is horizontal and pointing outward, then straighten the elbow. */
const world = (o) => o.getWorldPosition(new THREE.Vector3());
for (const [i, arm] of named("arm").entries()) {
  const elbow = named("elbow")[i];
  const forearm = named("forearm")[i];
  const restZ = arm.rotation.z;
  let best = { angle: 0, score: Infinity };
  for (let a = -3.2; a <= 3.2; a += 0.002) {
    arm.rotation.z = restZ + a;
    root.updateMatrixWorld(true);
    const dir = world(elbow).sub(world(arm)).normalize();
    const outward = Math.sign(world(arm).x - world(bot).x);
    // Horizontal (y ≈ 0), pointing away from the body, little forward lean.
    const score = Math.abs(dir.y) + Math.abs(dir.z) * 0.5 + (Math.sign(dir.x) === outward ? 0 : 10);
    if (score < best.score) best = { angle: a, score };
  }
  arm.rotation.z = restZ + best.angle;
  if (forearm) forearm.rotation.x = 0;
  if (elbow) elbow.rotation.y = 0;
  console.log(`arm ${i}: +${best.angle.toFixed(3)} rad about Z`);
}
root.updateMatrixWorld(true);

/* Merge every part into one mesh (positions and normals only). */
const parts = [];
root.traverse((o) => {
  if (!o.isMesh) return;
  const g = o.geometry.clone();
  for (const key of Object.keys(g.attributes)) if (key !== "position" && key !== "normal") g.deleteAttribute(key);
  if (!g.attributes.normal) g.computeVertexNormals();
  const flat = g.index ? g.toNonIndexed() : g;
  flat.applyMatrix4(o.matrixWorld);
  // Mirrored instances (negative scale) flip the winding; flip it back.
  if (o.matrixWorld.determinant() < 0) {
    const pos = flat.attributes.position;
    for (let v = 0; v < pos.count; v += 3) {
      for (const attr of [flat.attributes.position, flat.attributes.normal]) {
        const ax = attr.getX(v + 1), ay = attr.getY(v + 1), az = attr.getZ(v + 1);
        attr.setXYZ(v + 1, attr.getX(v + 2), attr.getY(v + 2), attr.getZ(v + 2));
        attr.setXYZ(v + 2, ax, ay, az);
      }
    }
  }
  parts.push(flat);
});
// Weld shared corners so the file stays small enough to upload comfortably.
const merged = mergeVertices(mergeGeometries(parts), 1e-3);
merged.computeBoundingBox();
const box = merged.boundingBox;
// Feet on the ground, centred on X/Z.
merged.translate(-(box.min.x + box.max.x) / 2, -box.min.y, -(box.min.z + box.max.z) / 2);
merged.computeBoundingBox();

const mesh = new THREE.Mesh(merged, new THREE.MeshStandardMaterial());
mesh.name = "Robot";
writeFileSync(OUT, new OBJExporter().parse(mesh));

const size = merged.boundingBox.getSize(new THREE.Vector3());
console.log(
  `${OUT}: ${(merged.index ? merged.index.count / 3 : merged.attributes.position.count / 3).toFixed(0)} triangles, ` +
    `${size.x.toFixed(0)} × ${size.y.toFixed(0)} × ${size.z.toFixed(0)} (w × h × d)`,
);
