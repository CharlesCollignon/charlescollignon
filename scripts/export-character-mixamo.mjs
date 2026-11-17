/**
 * Exports the character as a Mixamo upload (Mixamo reads FBX or OBJ, not
 * glTF): one mesh with its UVs, HEIGHT units tall, feet on y = 0, centred,
 * facing +Z.
 *
 *   npm run character:mixamo
 *   (assets/models/character.source.glb -> assets/models/character-mixamo.obj)
 */
import { writeFileSync } from "node:fs";
import * as THREE from "three";
import { OBJExporter } from "three/addons/exporters/OBJExporter.js";
import { loadCharacterGeometry } from "./lib/character.mjs";

const OUT = "assets/models/character-mixamo.obj";

const geometry = await loadCharacterGeometry();
geometry.deleteAttribute("tangent");
const mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial());
mesh.name = "Character";
writeFileSync(OUT, new OBJExporter().parse(mesh));
const s = geometry.boundingBox.getSize(new THREE.Vector3());
console.log(`${OUT}: ${geometry.attributes.position.count} vertices, ${s.x.toFixed(0)} × ${s.y.toFixed(0)} × ${s.z.toFixed(0)}`);
