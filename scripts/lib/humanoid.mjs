import { readFileSync } from "node:fs";
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { FBXLoader } from "three/addons/loaders/FBXLoader.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";
import { mergeVertices } from "three/addons/utils/BufferGeometryUtils.js";

/** The cleaned-up Sketchfab mesh (npm run humanoid:optimize). */
export const STATIC_MESH = "assets/models/humanoid-static.glb";

const arrayBuffer = (buf) => buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);

/**
 * The humanoid as one welded, float geometry in Mixamo's space: feet on
 * y = 0, centred, facing +Z. This is exactly the mesh uploaded to Mixamo
 * (npm run humanoid:mixamo), so Mixamo skeletons line up with it.
 */
export async function loadHumanoidGeometry() {
  await MeshoptDecoder.ready;
  const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
  const gltf = await new Promise((resolve, reject) =>
    loader.parse(arrayBuffer(readFileSync(STATIC_MESH)), "", resolve, reject),
  );
  gltf.scene.updateMatrixWorld(true);
  let mesh;
  gltf.scene.traverse((o) => {
    if (o.isMesh && !mesh) mesh = o;
  });
  // Copy to floats first: the positions are quantised int16, and transforming
  // them in place would clamp everything to ±1.
  const source = mesh.geometry;
  const pos = source.attributes.position;
  const floats = new Float32Array(pos.count * 3);
  for (let i = 0; i < pos.count; i++) floats.set([pos.getX(i), pos.getY(i), pos.getZ(i)], i * 3);
  let geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(floats, 3));
  if (source.index) geometry.setIndex(source.index.clone());
  geometry.applyMatrix4(mesh.matrixWorld);
  // Weld shared corners: one connected surface to skin.
  geometry = mergeVertices(geometry, 1e-3);
  geometry.computeBoundingBox();
  const b = geometry.boundingBox;
  geometry.translate(-(b.min.x + b.max.x) / 2, -b.min.y, -(b.min.z + b.max.z) / 2);
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  return geometry;
}

/** A Mixamo FBX (skeleton and its animation; no mesh needed). */
export function loadFBX(file) {
  const rig = new FBXLoader().parse(arrayBuffer(readFileSync(file)), "");
  rig.updateMatrixWorld(true);
  return rig;
}

/** Mixamo bone name without its "mixamorig" / "mixamorig1:" prefix. */
export const boneKey = (name) => name.replace(/^mixamorig\d*:?/, "");
