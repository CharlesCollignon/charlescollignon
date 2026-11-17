"use client";

import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { createRig, nodeName, type Rig } from "./rig";

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
    led: new THREE.MeshBasicMaterial({ color: "#f4f7ff", toneMapped: false }),
  };
}

type Materials = ReturnType<typeof makeMaterials>;

function materialFor(mesh: THREE.Mesh, m: Materials) {
  const name = mesh.name;
  if (name === nodeName("Head 2")) return m.shell;
  if (name === nodeName("Body")) return m.chassis;
  if (/^(Cube|Hand)/.test(name)) return m.shell;
  // Cylinders, ellipses, plates and the unnamed neck ring: joints and trim.
  return m.chrome;
}

/**
 * Two LED dot matrices on the visor, grouped as "Eyes" so the rig can blink
 * them. Each dot is ray-cast onto the curved face so it sits on the surface.
 */
function buildEyes(head: THREE.Object3D, face: THREE.Mesh, led: THREE.Material) {
  head.updateWorldMatrix(true, true);
  face.geometry.computeBoundingBox();
  // Face bounds in head space.
  const box = face.geometry.boundingBox!.clone().applyMatrix4(face.matrix);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());

  const cols = 6;
  const rows = 3;
  const gap = size.x * 0.034;
  const dot = new THREE.CircleGeometry(gap * 0.34, 12);
  const grid = new THREE.InstancedMesh(dot, led, cols * rows * 2);

  const raycaster = new THREE.Raycaster();
  const headQuat = head.getWorldQuaternion(new THREE.Quaternion());
  const back = new THREE.Vector3(0, 0, -1).applyQuaternion(headQuat);
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const z = new THREE.Vector3(0, 0, 1);
  const one = new THREE.Vector3(1, 1, 1);
  const eyeY = center.y - size.y * 0.02;
  let i = 0;

  for (const side of [-1, 1]) {
    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < rows; r++) {
        const x = side * size.x * 0.2 + (c - (cols - 1) / 2) * gap;
        const y = eyeY + (r - (rows - 1) / 2) * gap;
        const origin = head.localToWorld(new THREE.Vector3(x, y, box.max.z + 50));
        raycaster.set(origin, back);
        const hit = raycaster.intersectObject(face, false)[0];
        if (!hit) continue;
        const local = head.worldToLocal(hit.point.clone());
        const normal = (hit.face?.normal.clone() ?? z.clone())
          .transformDirection(face.matrixWorld)
          .applyQuaternion(headQuat.clone().invert())
          .normalize();
        local.addScaledVector(normal, 0.4);
        q.setFromUnitVectors(z, normal);
        m.compose(local, q, one);
        grid.setMatrixAt(i++, m);
      }
    }
  }
  grid.count = i;

  // Group pivots at the eye line so blinking squashes toward it.
  const eyes = new THREE.Group();
  eyes.name = "Eyes";
  eyes.position.set(0, eyeY, 0);
  grid.position.set(0, -eyeY, 0);
  eyes.add(grid);
  head.add(eyes);
  return () => {
    head.remove(eyes);
    dot.dispose();
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
    const face = scene.getObjectByName(nodeName("Head 2")) as THREE.Mesh | undefined;
    const removeEyes = head && face ? buildEyes(head, face, materials.led) : undefined;
    const rig = createRig(scene, camera);
    rigRef.current = rig;
    return () => {
      rig?.dispose();
      rigRef.current = null;
      removeEyes?.();
    };
  }, [scene, camera, materials]);

  useEffect(
    () => () => Object.values(materials).forEach((mat) => mat.dispose()),
    [materials],
  );

  useFrame((state, dt) => {
    if (!paused) rigRef.current?.update(dt, state.clock.elapsedTime);
  });

  return <primitive object={scene} />;
}

useGLTF.preload(ROBOT_URL, false, true);
