/**
 * Shared helpers for the robot build scripts (export-mixamo, bake-animations).
 */
import { readFileSync } from "node:fs";
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

export const SOURCE_GLB = "assets/models/robot.source.glb";

/** Load the source robot; returns a root group holding only "Bot". */
export async function loadRobot() {
  const data = readFileSync(SOURCE_GLB);
  const gltf = await new Promise((resolve, reject) =>
    new GLTFLoader().parse(
      data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength),
      "",
      resolve,
      reject,
    ),
  );
  const bot = gltf.scene.getObjectByName("Bot");
  if (!bot) throw new Error('No "Bot" node');
  bot.removeFromParent();
  const root = new THREE.Group();
  root.add(bot);
  root.updateMatrixWorld(true);
  return { root, bot };
}

/** All nodes for a Spline name, including loader-made duplicates ("arm", "arm_1"). */
export function named(root, name) {
  const re = new RegExp(`^${THREE.PropertyBinding.sanitizeNodeName(name)}(_\\d+)?$`);
  const out = [];
  root.traverse((o) => re.test(o.name) && out.push(o));
  return out;
}

const world = (o) => o.getWorldPosition(new THREE.Vector3());

/**
 * The T-pose the Mixamo rig is built from: each upper arm rotated about its
 * local Z until shoulder→elbow is horizontal and outward; elbows straight.
 */
export function applyTPose(root, bot, log = () => {}) {
  root.updateMatrixWorld(true);
  const elbows = named(root, "elbow");
  const forearms = named(root, "forearm");
  for (const [i, arm] of named(root, "arm").entries()) {
    const elbow = elbows[i];
    const restZ = arm.rotation.z;
    let best = { angle: 0, score: Infinity };
    for (let a = -3.2; a <= 3.2; a += 0.002) {
      arm.rotation.z = restZ + a;
      root.updateMatrixWorld(true);
      const dir = world(elbow).sub(world(arm)).normalize();
      const outward = Math.sign(world(arm).x - world(bot).x);
      const score = Math.abs(dir.y) + Math.abs(dir.z) * 0.5 + (Math.sign(dir.x) === outward ? 0 : 10);
      if (score < best.score) best = { angle: a, score };
    }
    arm.rotation.z = restZ + best.angle;
    if (forearms[i]) forearms[i].rotation.x = 0;
    if (elbow) elbow.rotation.y = 0;
    log(`arm ${i}: +${best.angle.toFixed(3)} rad about Z`);
  }
  root.updateMatrixWorld(true);
}
