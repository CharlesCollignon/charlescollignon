"use client";

import { useRef, useMemo, useEffect, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useTheme } from "next-themes";
import * as THREE from "three";

// Seeded random number generator for stable initialization
function seededRandom(seed: number) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function ParticleField({ scrollY }: { scrollY: number }) {
  const { theme } = useTheme();
  const pointsRef = useRef<THREE.Points>(null);
  const { mouse, viewport } = useThree();

  const particleCount = 150;

  const { positions, velocities } = useMemo(() => {
    const positions = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      const seed = i * 3;
      positions[i * 3] = (seededRandom(seed) - 0.5) * 20;
      positions[i * 3 + 1] = (seededRandom(seed + 1) - 0.5) * 20;
      positions[i * 3 + 2] = (seededRandom(seed + 2) - 0.5) * 10;

      velocities[i * 3] = (seededRandom(seed + 100) - 0.5) * 0.01;
      velocities[i * 3 + 1] = (seededRandom(seed + 101) - 0.5) * 0.01;
      velocities[i * 3 + 2] = (seededRandom(seed + 102) - 0.5) * 0.005;
    }

    return { positions, velocities };
  }, [particleCount]);

  useFrame(() => {
    if (!pointsRef.current) return;

    const positionsArray = pointsRef.current.geometry.attributes.position
      .array as Float32Array;

    // Mouse parallax effect
    const mouseX = mouse.x * viewport.width * 0.5;
    const mouseY = mouse.y * viewport.height * 0.5;

    // Scroll effect - move particles based on scroll
    const scrollEffect = scrollY * 0.003;

    for (let i = 0; i < particleCount; i++) {
      // Add slow drift
      positionsArray[i * 3] += velocities[i * 3];
      positionsArray[i * 3 + 1] += velocities[i * 3 + 1];
      positionsArray[i * 3 + 2] += velocities[i * 3 + 2];

      // Boundary wrapping
      if (positionsArray[i * 3] > 10) positionsArray[i * 3] = -10;
      if (positionsArray[i * 3] < -10) positionsArray[i * 3] = 10;
      if (positionsArray[i * 3 + 1] > 10) positionsArray[i * 3 + 1] = -10;
      if (positionsArray[i * 3 + 1] < -10) positionsArray[i * 3 + 1] = 10;
    }

    pointsRef.current.geometry.attributes.position.needsUpdate = true;

    // Rotate entire field based on mouse and scroll
    pointsRef.current.rotation.y = mouseX * 0.03 + scrollEffect;
    pointsRef.current.rotation.x = -mouseY * 0.03 + scrollEffect * 0.5;
  });

  const color = theme === "dark" ? "#ffffff" : "#000000";

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particleCount}
          array={positions}
          itemSize={3}
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        color={color}
        size={0.05}
        sizeAttenuation
        transparent
        opacity={0.6}
      />
    </points>
  );
}

function FloatingShapes({ scrollY }: { scrollY: number }) {
  const { theme } = useTheme();
  const groupRef = useRef<THREE.Group>(null);
  const { mouse, viewport } = useThree();

  useFrame((state) => {
    if (!groupRef.current) return;

    const t = state.clock.getElapsedTime();

    // Mouse parallax effect
    const mouseX = mouse.x * viewport.width * 0.3;
    const mouseY = mouse.y * viewport.height * 0.3;

    // Scroll effect
    const scrollEffect = scrollY * 0.002;
    const scrollWave = Math.sin(scrollY * 0.001) * 0.5;

    groupRef.current.rotation.y =
      Math.sin(t * 0.1) * 0.1 + mouseX * 0.05 + scrollEffect;
    groupRef.current.rotation.x =
      Math.cos(t * 0.1) * 0.1 - mouseY * 0.05 + scrollWave;

    // Animate children with scroll influence
    groupRef.current.children.forEach((child, i) => {
      const baseY = (child.userData.baseY as number) || 0;
      const scrollOffset = Math.sin(scrollY * 0.001 + i) * 2;

      child.position.y = Math.sin(t * 0.5 + i * 2) * 0.3 + baseY + scrollOffset;

      // Z position changes with scroll - shapes move closer/farther
      const baseZ = (child.userData.baseZ as number) || 0;
      const scrollZOffset = Math.cos(scrollY * 0.002 + i * 0.5) * 2;
      child.position.z = baseZ + scrollZOffset;

      child.rotation.x = t * 0.2 + i + scrollEffect;
      child.rotation.z = t * 0.1 + i + scrollWave;
    });
  });

  const color = theme === "dark" ? "#ffffff" : "#000000";

  return (
    <group ref={groupRef}>
      {/* Torus */}
      <mesh position={[-4, 2, -3]} userData={{ baseY: 2, baseZ: -3 }}>
        <torusGeometry args={[0.6, 0.2, 16, 32]} />
        <meshBasicMaterial color={color} wireframe opacity={0.3} transparent />
      </mesh>

      {/* Octahedron */}
      <mesh position={[4, -1, -4]} userData={{ baseY: -1, baseZ: -4 }}>
        <octahedronGeometry args={[0.8]} />
        <meshBasicMaterial color={color} wireframe opacity={0.25} transparent />
      </mesh>

      {/* Icosahedron */}
      <mesh position={[-3, -2, -2]} userData={{ baseY: -2, baseZ: -2 }}>
        <icosahedronGeometry args={[0.5]} />
        <meshBasicMaterial color={color} wireframe opacity={0.2} transparent />
      </mesh>

      {/* Dodecahedron */}
      <mesh position={[3, 1.5, -5]} userData={{ baseY: 1.5, baseZ: -5 }}>
        <dodecahedronGeometry args={[0.7]} />
        <meshBasicMaterial color={color} wireframe opacity={0.2} transparent />
      </mesh>

      {/* Ring */}
      <mesh position={[0, 3, -6]} userData={{ baseY: 3, baseZ: -6 }}>
        <ringGeometry args={[0.5, 0.8, 32]} />
        <meshBasicMaterial
          color={color}
          wireframe
          opacity={0.15}
          transparent
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}

export function Scene3D() {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="fixed inset-0 -z-10">
      <Canvas
        camera={{ position: [0, 0, 8], fov: 50 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 5, 5]} intensity={0.3} />
        <ParticleField scrollY={scrollY} />
        <FloatingShapes scrollY={scrollY} />
      </Canvas>
    </div>
  );
}
