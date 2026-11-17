/**
 * Exports the humanoid as a Mixamo-ready OBJ (Mixamo reads FBX or OBJ, not
 * glTF): one welded mesh, feet on the ground, centred, facing +Z.
 *
 *   npm run humanoid:mixamo
 *   (assets/models/humanoid-static.glb -> assets/models/humanoid-mixamo.obj)
 */
import { writeFileSync } from "node:fs";
import * as THREE from "three";
import { OBJExporter } from "three/addons/exporters/OBJExporter.js";
import { loadHumanoidGeometry } from "./lib/humanoid.mjs";

const OUT = "assets/models/humanoid-mixamo.obj";

const geometry = await loadHumanoidGeometry();
const mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial());
mesh.name = "Humanoid";
writeFileSync(OUT, new OBJExporter().parse(mesh));
const s = geometry.boundingBox.getSize(new THREE.Vector3());
console.log(
  `${OUT}: ${geometry.index.count / 3} triangles, ${geometry.attributes.position.count} vertices, ` +
    `${s.x.toFixed(0)} × ${s.y.toFixed(0)} × ${s.z.toFixed(0)}`,
);
