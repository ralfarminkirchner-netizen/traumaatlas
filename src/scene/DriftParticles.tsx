// DriftParticles: warmer Partikelnebel (Points, BufferGeometry) mit langsamer
// Aufwärtsdrift und Rotation. Bei Kaskaden-Station 4 (Entladung) zusätzlich
// subtile Partikelströme, die aus Schulter- und Beckenregionen nach außen
// driften und zyklisch zurückgesetzt werden.

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useIsMobile } from "@/hooks/use-is-mobile";
import { useAtlasState } from "@/state/atlas-store";

const DRIFT_COUNT_DESKTOP = 600;
const DRIFT_COUNT_MOBILE = 250;
const STREAM_COUNT = 70;
/** Lebensdauer der Entladungs-Partikel in Sekunden */
const STREAM_LIFETIME = 2.8;

/** Quellen der Entladungsströme: Schultern & Becken */
const STREAM_SOURCES: ReadonlyArray<readonly [number, number, number]> = [
  [0, 1.32, 0],
  [0, 0.52, 0],
];

export default function DriftParticles() {
  const isMobile = useIsMobile();
  const { cascadeStep } = useAtlasState();

  const drift = useMemo(() => {
    const count = isMobile ? DRIFT_COUNT_MOBILE : DRIFT_COUNT_DESKTOP;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i += 1) {
      positions[i * 3] = THREE.MathUtils.randFloatSpread(5);
      positions[i * 3 + 1] = THREE.MathUtils.randFloat(0, 2.4);
      positions[i * 3 + 2] = THREE.MathUtils.randFloatSpread(4);
    }
    return { count, positions };
  }, [isMobile]);

  const stream = useMemo(() => {
    const origins = new Float32Array(STREAM_COUNT * 3);
    const dirs = new Float32Array(STREAM_COUNT * 3);
    const ages = new Float32Array(STREAM_COUNT);
    for (let i = 0; i < STREAM_COUNT; i += 1) {
      const source = STREAM_SOURCES[i % STREAM_SOURCES.length];
      origins[i * 3] = source[0] + THREE.MathUtils.randFloatSpread(0.16);
      origins[i * 3 + 1] = source[1] + THREE.MathUtils.randFloatSpread(0.1);
      origins[i * 3 + 2] = source[2] + THREE.MathUtils.randFloatSpread(0.12);
      // überwiegend seitlich/aufwärts entweichende Richtung
      const angle = THREE.MathUtils.randFloat(0, Math.PI * 2);
      dirs[i * 3] = Math.cos(angle) * THREE.MathUtils.randFloat(0.5, 1);
      dirs[i * 3 + 1] = THREE.MathUtils.randFloat(0.05, 0.5);
      dirs[i * 3 + 2] = Math.sin(angle) * THREE.MathUtils.randFloat(0.4, 0.9);
      ages[i] = THREE.MathUtils.randFloat(0, STREAM_LIFETIME);
    }
    return { origins, dirs, ages };
  }, []);

  const driftMaterial = useMemo(
    () =>
      new THREE.PointsMaterial({
        color: "#e2a35c",
        size: 0.014,
        transparent: true,
        opacity: 0.25,
        sizeAttenuation: true,
        depthWrite: false,
      }),
    [],
  );
  const streamMaterial = useMemo(
    () =>
      new THREE.PointsMaterial({
        color: "#7fb8a4",
        size: 0.018,
        transparent: true,
        opacity: 0.35,
        sizeAttenuation: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [],
  );

  const driftPositions = useMemo(
    () => new THREE.BufferAttribute(drift.positions, 3),
    [drift],
  );
  const streamPositions = useMemo(() => {
    const arr = new Float32Array(stream.origins);
    return new THREE.BufferAttribute(arr, 3);
  }, [stream]);

  const driftPoints = useRef<THREE.Points>(null);
  const streamPoints = useRef<THREE.Points>(null);
  const storeRef = useRef({ cascadeStep });
  storeRef.current = { cascadeStep };

  useFrame((_, delta) => {
    const clampedDelta = Math.min(delta, 0.05);

    // ── Nebel: Aufwärtsdrift mit Zurücksetzen am oberen Rand ──
    const arr = driftPositions.array as Float32Array;
    for (let i = 0; i < drift.count; i += 1) {
      arr[i * 3 + 1] += clampedDelta * 0.03;
      if (arr[i * 3 + 1] > 2.4) arr[i * 3 + 1] = 0;
    }
    driftPositions.needsUpdate = true;
    if (driftPoints.current) {
      driftPoints.current.rotation.y += clampedDelta * 0.012;
    }

    // ── Entladungsströme (nur Station 4) ──
    const streaming = storeRef.current.cascadeStep === 4;
    if (streamPoints.current && streamPoints.current.visible !== streaming) {
      streamPoints.current.visible = streaming;
    }
    if (streaming) {
      const sArr = streamPositions.array as Float32Array;
      for (let i = 0; i < STREAM_COUNT; i += 1) {
        stream.ages[i] += clampedDelta;
        if (stream.ages[i] > STREAM_LIFETIME) {
          stream.ages[i] = 0;
        }
        const k = stream.ages[i] / STREAM_LIFETIME;
        sArr[i * 3] = stream.origins[i * 3] + stream.dirs[i * 3] * k * 0.9;
        sArr[i * 3 + 1] = stream.origins[i * 3 + 1] + stream.dirs[i * 3 + 1] * k * 0.7;
        sArr[i * 3 + 2] = stream.origins[i * 3 + 2] + stream.dirs[i * 3 + 2] * k * 0.9;
      }
      streamPositions.needsUpdate = true;
    }
  });

  return (
    <group>
      <points ref={driftPoints} frustumCulled={false}>
        <bufferGeometry>
          <primitive object={driftPositions} attach="attributes-position" />
        </bufferGeometry>
        <primitive object={driftMaterial} attach="material" />
      </points>
      <points ref={streamPoints} visible={false} frustumCulled={false}>
        <bufferGeometry>
          <primitive object={streamPositions} attach="attributes-position" />
        </bufferGeometry>
        <primitive object={streamMaterial} attach="material" />
      </points>
    </group>
  );
}
