import { Canvas, useFrame } from "@react-three/fiber";
import { useRef, Suspense } from "react";
import * as THREE from "three";

function GlassOrb() {
  const mesh = useRef<THREE.Mesh>(null);
  useFrame((state, delta) => {
    if (!mesh.current) return;
    mesh.current.rotation.x += delta * 0.12;
    mesh.current.rotation.y += delta * 0.18;
    const t = state.clock.elapsedTime;
    mesh.current.position.y = Math.sin(t * 0.6) * 0.12;
  });
  return (
    <mesh ref={mesh} scale={1.6}>
      <icosahedronGeometry args={[1, 6]} />
      <meshPhysicalMaterial
        color="#141414"
        metalness={0.9}
        roughness={0.15}
        clearcoat={1}
        clearcoatRoughness={0.05}
        transmission={0.35}
        thickness={1.2}
        ior={1.5}
        reflectivity={0.9}
        emissive="#3a1d00"
        emissiveIntensity={0.15}
      />
    </mesh>
  );
}

function AmberRing() {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((_, d) => { if (ref.current) ref.current.rotation.z += d * 0.08; });
  return (
    <mesh ref={ref} position={[0, 0, -0.5]}>
      <torusGeometry args={[2.4, 0.015, 16, 200]} />
      <meshBasicMaterial color="#f5a524" transparent opacity={0.55} />
    </mesh>
  );
}

export default function Hero3D() {
  return (
    <Canvas
      dpr={[1, 1.8]}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      camera={{ position: [0, 0, 5], fov: 40 }}
      style={{ width: "100%", height: "100%" }}
    >
      <color attach="background" args={[0x000000]} />
      <fog attach="fog" args={[0x000000, 5, 12]} />
      <ambientLight intensity={0.35} />
      <directionalLight position={[3, 4, 5]} intensity={2.2} color="#ffb865" />
      <directionalLight position={[-4, -2, -2]} intensity={0.8} color="#3d6bff" />
      <pointLight position={[0, 0, 3]} intensity={1.2} color="#f5a524" />
      <Suspense fallback={null}>
        <GlassOrb />
        <AmberRing />
      </Suspense>
    </Canvas>
  );
}
