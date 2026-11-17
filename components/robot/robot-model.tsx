"use client";

import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { createRig, nodeName, type Rig } from "./rig";
import { EYE_COLS, EYE_ROWS } from "./face";
import { loadClips } from "./clips";

export const ROBOT_URL = "/models/robot.glb";

/**
 * The exported model has no materials (Spline only exports colours on paid
 * plans), so the look is rebuilt here from part names: a glossy black shell,
 * a satin black chassis and polished chrome joints. The LED eyes were a
 * Spline material effect, so they're rebuilt as emissive dot grids.
 */
function makeMaterials() {
  return {
    // Piano black: a dark non-metal under a sharp clear coat, so only the
    // studio lights show up as crisp reflections.
    shell: new THREE.MeshPhysicalMaterial({
      color: "#040405",
      metalness: 0,
      roughness: 0.35,
      clearcoat: 1,
      clearcoatRoughness: 0.06,
      envMapIntensity: 0.7,
    }),
    chassis: new THREE.MeshPhysicalMaterial({
      color: "#09090b",
      metalness: 0.25,
      roughness: 0.55,
      clearcoat: 0.6,
      clearcoatRoughness: 0.25,
      envMapIntensity: 0.55,
    }),
    // Joints and trim: dark polished steel rather than mirror chrome.
    chrome: new THREE.MeshPhysicalMaterial({
      color: "#5b5f68",
      metalness: 1,
      roughness: 0.28,
      envMapIntensity: 0.9,
    }),
    // Colours come per dot from the rig (instanceColor); white keeps them true.
    led: new THREE.MeshBasicMaterial({ color: "#ffffff", toneMapped: false }),
  };
}

type Materials = ReturnType<typeof makeMaterials>;

function materialFor(mesh: THREE.Mesh, m: Materials) {
  const name = mesh.name;
  if (name === nodeName("Head 2")) return m.shell;
  // The chest shell (named "Body surface" by scripts/optimize-robot.mjs).
  if (name.startsWith(nodeName("Body"))) return m.chassis;
  if (/^(Cube|Hand)/.test(name)) return m.shell;
  // Cylinders, ellipses, plates and the unnamed neck ring: joints and trim.
  return m.chrome;
}

/** Project a point on a mesh surface: cast from in front, along the parent's -z. */
function onSurface(
  parent: THREE.Object3D,
  mesh: THREE.Mesh,
  x: number,
  y: number,
  frontZ: number,
) {
  const raycaster = new THREE.Raycaster();
  const quat = parent.getWorldQuaternion(new THREE.Quaternion());
  const back = new THREE.Vector3(0, 0, -1).applyQuaternion(quat);
  raycaster.set(parent.localToWorld(new THREE.Vector3(x, y, frontZ + 50)), back);
  const hit = raycaster.intersectObject(mesh, false)[0];
  if (!hit) return { point: new THREE.Vector3(x, y, frontZ), normal: new THREE.Vector3(0, 0, 1) };
  const normal = (hit.face?.normal.clone() ?? new THREE.Vector3(0, 0, 1))
    .transformDirection(mesh.matrixWorld)
    .applyQuaternion(quat.clone().invert())
    .normalize();
  return { point: parent.worldToLocal(hit.point.clone()), normal };
}

/** The largest mesh in a node's subtree (a part's main surface, not its trim). */
function meshOf(obj: THREE.Object3D | undefined) {
  let found: THREE.Mesh | undefined;
  let best = -1;
  const size = new THREE.Vector3();
  obj?.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (!mesh.isMesh) return;
    mesh.geometry.computeBoundingBox();
    mesh.geometry.boundingBox!.clone().applyMatrix4(mesh.matrixWorld).getSize(size);
    const volume = size.x * size.y * size.z;
    if (volume > best) {
      best = volume;
      found = mesh;
    }
  });
  return found;
}

/** Bounds of a child mesh in its parent's space. */
function boundsIn(mesh: THREE.Mesh, parent: THREE.Object3D) {
  parent.updateWorldMatrix(true, true);
  mesh.geometry.computeBoundingBox();
  const toParent = new THREE.Matrix4()
    .copy(parent.matrixWorld)
    .invert()
    .multiply(mesh.matrixWorld);
  const box = mesh.geometry.boundingBox!.clone().applyMatrix4(toParent);
  return { box, size: box.getSize(new THREE.Vector3()), center: box.getCenter(new THREE.Vector3()) };
}

/**
 * The LED face: two 7×5 dot matrices on the visor (see face.ts). Each dot is
 * ray-cast onto the curved surface; the rig drives their colours.
 */
function buildEyes(head: THREE.Object3D, face: THREE.Mesh, led: THREE.Material) {
  const { box, size, center } = boundsIn(face, head);

  const gap = size.x * 0.035;
  const dot = new THREE.CircleGeometry(gap * 0.4, 12);
  const grid = new THREE.InstancedMesh(dot, led, EYE_COLS * EYE_ROWS * 2);
  grid.name = "Eyes";
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const z = new THREE.Vector3(0, 0, 1);
  const one = new THREE.Vector3(1, 1, 1);
  const eyeY = center.y - size.y * 0.02;
  const off = new THREE.Color(0.08, 0.09, 0.1);

  // Index = side * 35 + row * 7 + col; side 0 is the viewer's left eye, row 0 the top.
  for (let side = 0; side < 2; side++) {
    for (let row = 0; row < EYE_ROWS; row++) {
      for (let col = 0; col < EYE_COLS; col++) {
        const x = (side === 0 ? -1 : 1) * size.x * 0.21 + (col - (EYE_COLS - 1) / 2) * gap;
        const y = eyeY - (row - (EYE_ROWS - 1) / 2) * gap;
        const { point, normal } = onSurface(head, face, x, y, box.max.z);
        point.addScaledVector(normal, 0.4);
        q.setFromUnitVectors(z, normal);
        const i = side * EYE_COLS * EYE_ROWS + row * EYE_COLS + col;
        grid.setMatrixAt(i, m.compose(point, q, one));
        grid.setColorAt(i, off);
      }
    }
  }
  head.add(grid);
  return {
    grid,
    dispose: () => {
      head.remove(grid);
      dot.dispose();
    },
  };
}

/**
 * A glowing "CC" monogram over a core ring on the chest, drawn on a canvas in
 * the site's font. The rig pulses its opacity like a heartbeat.
 */
function buildEmblem(top: THREE.Object3D, body: THREE.Mesh) {
  const { box, size, center } = boundsIn(body, top);

  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 512;
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;

  const draw = () => {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const font =
      getComputedStyle(document.body).getPropertyValue("--font-figtree").trim() || "system-ui";
    ctx.clearRect(0, 0, 512, 512);
    ctx.strokeStyle = "#fff";
    ctx.fillStyle = "#fff";
    ctx.globalAlpha = 0.95;
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.arc(256, 256, 226, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 0.35;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(256, 256, 196, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.font = `600 190px ${font}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    (ctx as CanvasRenderingContext2D & { letterSpacing?: string }).letterSpacing = "-10px";
    ctx.fillText("CC", 251, 268);
    texture.needsUpdate = true;
  };
  draw();
  document.fonts?.ready.then(draw);

  const material = new THREE.MeshBasicMaterial({
    map: texture,
    color: new THREE.Color(1.5, 1.6, 1.85),
    transparent: true,
    depthWrite: false,
    toneMapped: false,
  });
  const diameter = size.x * 0.24;
  const plane = new THREE.Mesh(new THREE.PlaneGeometry(diameter, diameter), material);
  plane.name = "Emblem";
  const { point, normal } = onSurface(top, body, center.x, center.y + size.y * 0.2, box.max.z);
  plane.position.copy(point.addScaledVector(normal, 0.6));
  plane.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal);
  top.add(plane);

  return {
    material,
    dispose: () => {
      top.remove(plane);
      plane.geometry.dispose();
      material.dispose();
      texture.dispose();
    },
  };
}

export function RobotModel({ paused }: { paused: boolean }) {
  const { scene } = useGLTF(ROBOT_URL, false, true);
  const camera = useThree((s) => s.camera);
  const materials = useMemo(() => makeMaterials(), []);

  const rigRef = useRef<Rig | null>(null);

  // Before the first frame: dress the model, add the eyes, attach the rig.
  useLayoutEffect(() => {
    scene.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) {
        const mesh = o as THREE.Mesh;
        mesh.material = materialFor(mesh, materials);
        mesh.frustumCulled = false;
      }
    });
    const head = scene.getObjectByName(nodeName("Head"));
    const face = meshOf(scene.getObjectByName(nodeName("Head 2")));
    const top = scene.getObjectByName(nodeName("Top part"));
    const body = meshOf(scene.getObjectByName(nodeName("Body")));
    // Decorations are optional: a failure here must never take the robot down.
    const attempt = <T,>(build: () => T) => {
      try {
        return build();
      } catch (error) {
        console.warn("Robot: decoration skipped", error);
        return undefined;
      }
    };
    const eyes = head && face ? attempt(() => buildEyes(head, face, materials.led)) : undefined;
    const emblem = top && body ? attempt(() => buildEmblem(top, body)) : undefined;
    const rig = createRig(scene, camera, { eyes: eyes?.grid, emblem: emblem?.material });
    rigRef.current = rig;
    // Motion capture streams in after the robot appears; until then (or if it
    // fails) the rig animates procedurally.
    let cancelled = false;
    loadClips(scene)
      .then((set) => {
        if (!cancelled) rig?.setClips(set);
      })
      .catch((error) => console.warn("Robot: motion clips unavailable", error));
    // Development-only handle for tuning poses from the console.
    if (process.env.NODE_ENV === "development") {
      (window as unknown as { __robot: unknown }).__robot = { scene, rig };
    }
    return () => {
      cancelled = true;
      rig?.dispose();
      rigRef.current = null;
      eyes?.dispose();
      emblem?.dispose();
    };
  }, [scene, camera, materials]);

  useEffect(
    () => () => Object.values(materials).forEach((mat) => mat.dispose()),
    [materials],
  );

  useFrame((state, dt) => {
    if (paused) return;
    if (process.env.NODE_ENV === "development" && (window as unknown as { __robotFreeze?: boolean }).__robotFreeze) return;
    rigRef.current?.update(dt, state.clock.elapsedTime);
  });

  return <primitive object={scene} />;
}

useGLTF.preload(ROBOT_URL, false, true);
