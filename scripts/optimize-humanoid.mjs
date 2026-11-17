/**
 * Turns the Sketchfab "Humanoid Model" into a file the site can load.
 *
 *   unzip assets/models/humanoid_model.zip -d assets/models/humanoid-src
 *   node scripts/optimize-humanoid.mjs
 *   (→ public/models/humanoid.glb)
 *
 * The source is a 1M-triangle sculpt in 33 pieces with no rig. This bakes the
 * transforms, merges the pieces, simplifies to ~60k triangles, and scales it
 * to the robot's size (547 units tall, feet at y = -243, centred), wrapped in
 * a "Bot" node so the site's choreography can move it like the robot.
 *
 * "Humanoid Model" by CowboyTruman, CC BY 4.0:
 * https://sketchfab.com/3d-models/humanoid-model-4f56bd97eaa7421a80e12d35ef78d22b
 */
import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import {
  dedup, flatten, join, meshopt, normals, prune, quantize, simplify, weld,
} from "@gltf-transform/functions";
import { MeshoptEncoder, MeshoptSimplifier } from "meshoptimizer";
import { statSync } from "node:fs";

const SRC = "assets/models/humanoid-src/scene.gltf";
const OUT = "public/models/humanoid.glb";
const TARGET_TRIANGLES = 60000;
const ROBOT = { height: 547, feetY: -243 };

await Promise.all([MeshoptEncoder.ready, MeshoptSimplifier.ready]);
const io = new NodeIO()
  .registerExtensions(ALL_EXTENSIONS)
  .registerDependencies({ "meshopt.encoder": MeshoptEncoder });
const doc = await io.read(SRC);
const root = doc.getRoot();

const triangles = () =>
  root.listMeshes().reduce((n, m) => n + m.listPrimitives().reduce((k, p) =>
    k + (p.getIndices()?.getCount() ?? p.getAttribute("POSITION").getCount()) / 3, 0), 0);
const before = triangles();

// One mesh, transforms baked, textures dropped (the site sets the material).
// Per-face normals and UVs would stop corners from welding, which leaves the
// simplifier nothing to collapse: drop them, weld, simplify, then recompute
// smooth normals.
for (const t of root.listTextures()) t.dispose();
for (const mesh of root.listMeshes()) {
  for (const prim of mesh.listPrimitives()) {
    for (const semantic of prim.listSemantics()) if (semantic !== "POSITION") prim.setAttribute(semantic, null);
  }
}
await doc.transform(flatten(), join({ keepNamed: false }), weld(), dedup());
await doc.transform(
  simplify({ simplifier: MeshoptSimplifier, ratio: TARGET_TRIANGLES / before, error: 0.01, lockBorder: false }),
  normals({ overwrite: true }),
  prune(),
);

// Normalise to the robot's size and wrap in a "Bot" node. Measure the raw
// vertices: the source mesh hangs under offset nodes, and those transforms
// are dropped below.
const scene = root.listScenes()[0];
const body = root.listNodes().find((n) => n.getMesh());
const position = body.getMesh().listPrimitives()[0].getAttribute("POSITION");
const b = { min: position.getMin([]), max: position.getMax([]) };
const height = b.max[1] - b.min[1];
const scale = ROBOT.height / height;
for (const child of scene.listChildren()) scene.removeChild(child);
for (const n of root.listNodes()) if (n !== body) n.dispose();
body.setName("Humanoid").setTranslation([0, 0, 0]).setRotation([0, 0, 0, 1]).setScale([1, 1, 1]);
// Bake the normalising transform into the vertices.
const pos = position;
const cx = (b.min[0] + b.max[0]) / 2, cz = (b.min[2] + b.max[2]) / 2;
for (let i = 0; i < pos.getCount(); i++) {
  const [x, y, z] = pos.getElement(i, []);
  pos.setElement(i, [(x - cx) * scale, (y - b.min[1]) * scale + ROBOT.feetY, (z - cz) * scale]);
}
const bot = doc.createNode("Bot").addChild(body);
scene.addChild(bot);
root.listMaterials()[0]?.setName("Humanoid");

await doc.transform(prune(), quantize(), meshopt({ encoder: MeshoptEncoder, level: "high" }));
await io.write(OUT, doc);
console.log(`${OUT}: ${triangles().toFixed(0)} triangles (from ${before}), ${(statSync(OUT).size / 1024).toFixed(0)} KB`);
