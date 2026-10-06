// Prozedurale, würdevolle stehende Figur (Füße y=0, Kopf y≈1.8, Blick +z).
// Vier Layer-Gruppen (Haut/Muskulatur/Organe/Nerven) mit weichem Crossfade
// über framerate-unabhängigen Lerp. Alle Materials werden geteilt (useMemo).

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/** Opacity-Ziele je Layer-Stufe (0 Haut, 1 Muskulatur, 2 Organe, 3 Nerven) */
const SKIN_TARGET = [1, 0.5, 0.2, 0.07] as const;
const MUSCLE_TARGET = [0, 0.75, 0.85, 1] as const;
const ORGAN_TARGET = [0, 0, 0.9, 1] as const;
const NERVE_TARGET = [0, 0, 0, 1] as const;

export interface BodyModelProps {
  /** aktive Transparenz-Stufe aus dem Store */
  layer: number;
  /** true → langsame Start-Rotation (360° in ~90 s) */
  autoRotate: boolean;
  /** true → Atembewegung stoppt (Erstarrung / reduced-motion) */
  frozen: boolean;
}

/** Torso-Silhouette als Lathe-Profil (Radius über der Höhe) */
function buildTorsoGeometry(): THREE.LatheGeometry {
  const profile: Array<[number, number]> = [
    [0.085, 0.84],
    [0.125, 0.9],
    [0.145, 0.99],
    [0.142, 1.08],
    [0.15, 1.18],
    [0.158, 1.28],
    [0.168, 1.38],
    [0.15, 1.46],
    [0.08, 1.5],
  ];
  const points = profile.map(([r, y]) => new THREE.Vector2(r, y));
  return new THREE.LatheGeometry(points, 28);
}

export default function BodyModel({ layer, autoRotate, frozen }: BodyModelProps) {
  const rootRef = useRef<THREE.Group>(null);
  const breathRef = useRef<THREE.Group>(null);
  const breathPhase = useRef(0);
  const opacity = useRef({ skin: 1, muscle: 0, organ: 0, nerve: 0 });

  const materials = useMemo(
    () => ({
      skin: new THREE.MeshPhysicalMaterial({
        color: "#d9b08c",
        roughness: 0.55,
        transmission: 0,
        transparent: true,
        opacity: 1,
        sheen: 0.5,
        sheenRoughness: 0.6,
        sheenColor: new THREE.Color("#f2d4b2"),
        depthWrite: false,
      }),
      muscle: new THREE.MeshStandardMaterial({
        color: "#8a3b32",
        roughness: 0.85,
        transparent: true,
        opacity: 0,
      }),
      organHeart: new THREE.MeshStandardMaterial({
        color: "#7a2e2e",
        roughness: 0.3,
        metalness: 0.1,
        transparent: true,
        opacity: 0,
      }),
      organMagen: new THREE.MeshStandardMaterial({
        color: "#c98a7e",
        roughness: 0.6,
        transparent: true,
        opacity: 0,
      }),
      organDiaphragm: new THREE.MeshStandardMaterial({
        color: "#b0715f",
        roughness: 0.8,
        transparent: true,
        opacity: 0,
      }),
      nerve: new THREE.MeshStandardMaterial({
        color: "#8fd8cf",
        emissive: "#2e5c55",
        emissiveIntensity: 0.9,
        roughness: 0.4,
        transparent: true,
        opacity: 0,
      }),
    }),
    [],
  );

  const geometries = useMemo(
    () => ({
      torso: buildTorsoGeometry(),
      head: new THREE.SphereGeometry(0.105, 28, 22),
      neck: new THREE.CapsuleGeometry(0.042, 0.09, 6, 14),
      arm: new THREE.CapsuleGeometry(0.048, 0.52, 6, 14),
      leg: new THREE.CapsuleGeometry(0.075, 0.72, 6, 14),
      pelvis: new THREE.SphereGeometry(0.13, 22, 16),
      muscleMasseter: new THREE.SphereGeometry(0.035, 14, 12),
      muscleTrapezius: new THREE.SphereGeometry(0.09, 16, 12),
      organHeart: new THREE.SphereGeometry(0.055, 20, 16),
      organMagen: new THREE.SphereGeometry(0.06, 20, 16),
      diaphragm: new THREE.CylinderGeometry(0.135, 0.135, 0.018, 28),
      hpa: new THREE.OctahedronGeometry(0.028, 0),
      solarplexus: new THREE.SphereGeometry(0.035, 14, 12),
    }),
    [],
  );

  useFrame((_, delta) => {
    // ── Atembewegung (Amplitude < 2 %, gestoppt bei Erstarrung) ──
    if (!frozen) {
      breathPhase.current += delta * 0.9;
      const s = 1 + Math.sin(breathPhase.current) * 0.012;
      breathRef.current?.scale.set(s, 1, s);
    }

    // ── Langsame Start-Rotation (~360° in 90 s) ──
    if (autoRotate && rootRef.current) {
      rootRef.current.rotation.y += delta * ((Math.PI * 2) / 90);
    }

    // ── Layer-Crossfade (weicher Lerp, framerate-unabhängig) ──
    const lerp = 1 - Math.exp(-delta * 4);
    const li = Math.min(3, Math.max(0, layer));
    const o = opacity.current;
    o.skin += (SKIN_TARGET[li] - o.skin) * lerp;
    o.muscle += (MUSCLE_TARGET[li] - o.muscle) * lerp;
    o.organ += (ORGAN_TARGET[li] - o.organ) * lerp;
    o.nerve += (NERVE_TARGET[li] - o.nerve) * lerp;

    materials.skin.opacity = o.skin;
    materials.muscle.opacity = o.muscle;
    materials.organHeart.opacity = o.organ;
    materials.organMagen.opacity = o.organ;
    materials.organDiaphragm.opacity = o.organ * 0.9;
    materials.nerve.opacity = o.nerve;
  });

  return (
    <group ref={rootRef}>
      <group ref={breathRef}>
        {/* ── Haut ── */}
        <mesh geometry={geometries.torso} material={materials.skin} />
        <mesh geometry={geometries.pelvis} material={materials.skin} position={[0, 0.9, 0]} scale={[1, 0.75, 0.9]} />
        <mesh geometry={geometries.head} material={materials.skin} position={[0, 1.63, 0]} scale={[0.92, 1.1, 0.98]} />
        <mesh geometry={geometries.neck} material={materials.skin} position={[0, 1.51, 0]} />
        <mesh geometry={geometries.arm} material={materials.skin} position={[-0.3, 1.16, 0]} rotation={[0, 0, 0.08]} />
        <mesh geometry={geometries.arm} material={materials.skin} position={[0.3, 1.16, 0]} rotation={[0, 0, -0.08]} />
        <mesh geometry={geometries.leg} material={materials.skin} position={[-0.09, 0.45, 0]} />
        <mesh geometry={geometries.leg} material={materials.skin} position={[0.09, 0.45, 0]} />

        {/* ── Muskulatur ── */}
        <mesh geometry={geometries.torso} material={materials.muscle} scale={[0.96, 0.99, 0.96]} />
        <mesh geometry={geometries.arm} material={materials.muscle} position={[-0.29, 1.16, 0]} scale={[0.92, 0.98, 0.92]} />
        <mesh geometry={geometries.arm} material={materials.muscle} position={[0.29, 1.16, 0]} scale={[0.92, 0.98, 0.92]} />
        <mesh geometry={geometries.leg} material={materials.muscle} position={[-0.088, 0.45, 0]} scale={[0.94, 0.99, 0.94]} />
        <mesh geometry={geometries.leg} material={materials.muscle} position={[0.088, 0.45, 0]} scale={[0.94, 0.99, 0.94]} />
        <mesh geometry={geometries.muscleMasseter} material={materials.muscle} position={[-0.082, 1.57, 0.045]} />
        <mesh geometry={geometries.muscleMasseter} material={materials.muscle} position={[0.082, 1.57, 0.045]} />
        <mesh geometry={geometries.muscleTrapezius} material={materials.muscle} position={[0, 1.37, -0.045]} scale={[1.7, 0.55, 0.8]} />

        {/* ── Organe ── */}
        <mesh geometry={geometries.organHeart} material={materials.organHeart} position={[-0.06, 1.24, 0.06]} scale={[0.9, 1.1, 0.9]} />
        <mesh geometry={geometries.organMagen} material={materials.organMagen} position={[0.06, 0.92, 0.05]} scale={[1, 0.85, 0.9]} />
        <mesh geometry={geometries.diaphragm} material={materials.organDiaphragm} position={[0, 1.0, 0]} scale={[1, 1, 0.62]} />

        {/* ── Nerven (Vagus selbst rendert VagusGlow) ── */}
        <mesh geometry={geometries.hpa} material={materials.nerve} position={[0.1, 1.66, -0.02]} />
        <mesh geometry={geometries.solarplexus} material={materials.nerve} position={[0, 1.03, 0.09]} />
      </group>
    </group>
  );
}
