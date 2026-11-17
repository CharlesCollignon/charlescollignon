import { readFileSync } from "node:fs";
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { FBXLoader } from "three/addons/loaders/FBXLoader.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

/** The Sketchfab download, as is. */
export const SOURCE = "assets/models/character.source.glb";
/** The scene's unit: the character's height. */
export const HEIGHT = 547;

const arrayBuffer = (buf) => buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);

/**
 * The character's geometry in Mixamo's space: HEIGHT units tall, feet on
 * y = 0, centred, facing +Z, with its normals, UVs and tangents. This is the
 * mesh uploaded to Mixamo (npm run character:mixamo), so Mixamo skeletons
 * line up with it.
 */
export async function loadCharacterGeometry() {
  const loader = new GLTFLoader();
  // Geometry only: textures can't be decoded in Node and are copied later.
  loader.register(() => ({ name: "no-textures", loadTexture: () => Promise.resolve(null) }));
  const gltf = await new Promise((resolve, reject) =>
    loader.parse(arrayBuffer(readFileSync(SOURCE)), "", resolve, reject),
  );
  gltf.scene.updateMatrixWorld(true);
  const parts = [];
  gltf.scene.traverse((o) => {
    if (!o.isMesh) return;
    const g = new THREE.BufferGeometry();
    for (const name of ["position", "normal", "uv", "tangent"]) {
      if (o.geometry.attributes[name]) g.setAttribute(name, o.geometry.attributes[name].clone());
    }
    if (o.geometry.index) g.setIndex(o.geometry.index.clone());
    parts.push(g.applyMatrix4(o.matrixWorld));
  });
  const geometry = parts.length > 1 ? mergeGeometries(parts) : parts[0];
  geometry.computeBoundingBox();
  const b = geometry.boundingBox;
  const scale = HEIGHT / (b.max.y - b.min.y);
  geometry.translate(-(b.min.x + b.max.x) / 2, -b.min.y, -(b.min.z + b.max.z) / 2).scale(scale, scale, scale);
  geometry.computeBoundingBox();
  return geometry;
}

/** A Mixamo FBX (skeleton and its animation). */
export function loadFBX(file) {
  const rig = new FBXLoader().parse(arrayBuffer(readFileSync(file)), "");
  rig.updateMatrixWorld(true);
  return rig;
}

/** Mixamo bone name without its "mixamorig" / "mixamorig1:" prefix. */
export const boneKey = (name) => name.replace(/^mixamorig\d*:?/, "");
