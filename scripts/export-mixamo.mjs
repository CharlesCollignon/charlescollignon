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
import { writeFileSync } from "node:fs";
import * as THREE from "three";
import { OBJExporter } from "three/addons/exporters/OBJExporter.js";
import { mergeGeometries, mergeVertices } from "three/addons/utils/BufferGeometryUtils.js";
import { applyTPose, loadRobot } from "./lib/robot.mjs";

const OUT = "assets/models/robot-tpose.obj";

const { root, bot } = await loadRobot();
applyTPose(root, bot, console.log);

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
