/**
 * Exports the humanoid as a Mixamo-ready OBJ (Mixamo reads FBX or OBJ, not
 * glTF): one mesh, feet on the ground, centred, facing +Z.
 *
 *   node scripts/export-humanoid-mixamo.mjs
 *   (public/models/humanoid.glb -> assets/models/humanoid-mixamo.obj)
 */
import { readFileSync, writeFileSync } from "node:fs";
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";
import { OBJExporter } from "three/addons/exporters/OBJExporter.js";
import { mergeVertices } from "three/addons/utils/BufferGeometryUtils.js";

const SRC = "public/models/humanoid.glb";
const OUT = "assets/models/humanoid-mixamo.obj";

await MeshoptDecoder.ready;
const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
const data = readFileSync(SRC);
const gltf = await new Promise((resolve, reject) =>
  loader.parse(data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength), "", resolve, reject),
);
gltf.scene.updateMatrixWorld(true);

let mesh;
gltf.scene.traverse((o) => {
  if (o.isMesh && !mesh) mesh = o;
});
// Copy to plain floats first: the positions are quantised int16, and
// transforming them in place would clamp everything to ±1.
const geometry = mesh.geometry;
let plain = new THREE.BufferGeometry();
const pos = geometry.attributes.position;
const floats = new Float32Array(pos.count * 3);
for (let i = 0; i < pos.count; i++) floats.set([pos.getX(i), pos.getY(i), pos.getZ(i)], i * 3);
plain.setAttribute("position", new THREE.BufferAttribute(floats, 3));
if (geometry.index) plain.setIndex(geometry.index.clone());
plain.applyMatrix4(mesh.matrixWorld);
// Weld shared corners so Mixamo skins one connected surface (and the file stays small).
plain = mergeVertices(plain, 1e-3);
plain.computeVertexNormals();
plain.computeBoundingBox();
const b = plain.boundingBox;
plain.translate(-(b.min.x + b.max.x) / 2, -b.min.y, -(b.min.z + b.max.z) / 2);

const out = new THREE.Mesh(plain, new THREE.MeshStandardMaterial());
out.name = "Humanoid";
writeFileSync(OUT, new OBJExporter().parse(out));
plain.computeBoundingBox();
const s = plain.boundingBox.getSize(new THREE.Vector3());
console.log(`${OUT}: ${(plain.index.count / 3).toFixed(0)} triangles, ${plain.attributes.position.count} vertices, ${s.x.toFixed(0)} × ${s.y.toFixed(0)} × ${s.z.toFixed(0)}`);
