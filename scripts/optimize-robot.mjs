/**
 * Turns the raw Spline GLB export into the model the site loads.
 *
 *   node scripts/optimize-robot.mjs
 *   (assets/models/robot.source.glb -> public/models/robot.glb)
 *
 * - keeps only the robot ("Bot" and everything under it), in Spline units
 *   (the export's 0.01 root scale, Spline camera and light are dropped)
 * - keeps every named node, so the rig can still find "Head", "arm", …
 * - welds, dedups, quantizes and meshopt-compresses the geometry
 *   (decoded in the browser by three.js' MeshoptDecoder, no CDN needed)
 */
import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import { dedup, meshopt, prune, quantize, weld } from "@gltf-transform/functions";
import { MeshoptEncoder } from "meshoptimizer";

const SRC = "assets/models/robot.source.glb";
const OUT = "public/models/robot.glb";

await MeshoptEncoder.ready;
const io = new NodeIO()
  .registerExtensions(ALL_EXTENSIONS)
  .registerDependencies({ "meshopt.encoder": MeshoptEncoder });
const doc = await io.read(SRC);
const root = doc.getRoot();

const bot = root.listNodes().find((n) => n.getName() === "Bot");
if (!bot) throw new Error('No "Bot" node in the export');

// Re-parent the robot directly under the scene, then drop everything else.
const scene = root.listScenes()[0];
const parent = bot.getParentNode();
parent?.removeChild(bot);
for (const child of scene.listChildren()) scene.removeChild(child);
scene.addChild(bot);
for (const camera of root.listCameras()) camera.dispose();
for (const ext of root.listExtensionsUsed())
  if (ext.extensionName === "KHR_lights_punctual") ext.dispose();

await doc.transform(
  prune({ keepLeaves: false, keepAttributes: false }),
  dedup(),
  weld(),
  quantize(),
  meshopt({ encoder: MeshoptEncoder, level: "high" }),
);

// Quantization moves the mesh of a node that has children (e.g. "Body") onto
// a new unnamed child. Name it after its parent so the site can find it.
for (const node of root.listNodes()) {
  const parentNode = node.getParentNode();
  if (!node.getName() && node.getMesh() && parentNode?.getName() && !parentNode.getMesh()) {
    node.setName(`${parentNode.getName()} surface`);
  }
}

await io.write(OUT, doc);
const { statSync } = await import("node:fs");
console.log(`${OUT}: ${(statSync(OUT).size / 1024).toFixed(0)} KB (from ${(statSync(SRC).size / 1024).toFixed(0)} KB)`);
