// Interaktive Regionen: unsichtbare Hit-Spheres (Raycast) + leuchtende,
// additive Embleme. Alle Zustände kommen aus dem Store und werden in einem
// einzigen useFrame sanft gelerpft (60-fps-freundlich, kein Flackern).

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import { regionAnchors } from "@/data/body3d";
import { bodyRegions } from "@/data/nervous";
import { setState, useAtlasState } from "@/state/atlas-store";

const WARM = new THREE.Color("#e2a35c");
const FROST = new THREE.Color("#9fb4d8");
const NEUTRAL_WARM = new THREE.Color("#d9b08c");

/** Grundfarbe je Region (nach dominantem Nervensystem-Zustand) */
function baseColorFor(regionId: string): THREE.Color {
  const region = bodyRegions.find((r) => r.id === regionId);
  switch (region?.state) {
    case "ventral":
      return new THREE.Color("#7fb8a4");
    case "sympathikus":
      return new THREE.Color("#e2a35c");
    case "dorsal":
      return new THREE.Color("#8b93c9");
    default:
      return NEUTRAL_WARM;
  }
}

interface RegionEntry {
  id: string;
  radius: number;
  material: THREE.MeshBasicMaterial;
  mesh: THREE.Mesh | null;
  baseColor: THREE.Color;
  current: number;
  currentScale: number;
}

function RegionEmblem({ entry }: { entry: RegionEntry }) {
  return (
    <mesh
      ref={(m: THREE.Mesh | null) => {
        entry.mesh = m;
      }}
    >
      <sphereGeometry args={[entry.radius, 20, 16]} />
      <primitive object={entry.material} attach="material" />
    </mesh>
  );
}

export default function RegionLayer() {
  const { hoverRegion, focusRegion, highlightRegions, arousal } = useAtlasState();

  const entries = useMemo<RegionEntry[]>(
    () =>
      regionAnchors.map((anchor) => ({
        id: anchor.id,
        radius: Math.max(anchor.radius * 0.8, 0.035),
        material: new THREE.MeshBasicMaterial({
          transparent: true,
          opacity: 0.25,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          color: baseColorFor(anchor.id),
        }),
        mesh: null,
        baseColor: baseColorFor(anchor.id),
        current: 0.25,
        currentScale: 1,
      })),
    [],
  );

  // Mutable Spiegel der Store-Werte für den useFrame-Loop (ohne Re-Render)
  const storeRef = useRef({ hoverRegion, focusRegion, highlightRegions, arousal });
  storeRef.current = { hoverRegion, focusRegion, highlightRegions, arousal };

  const scratchColor = useMemo(() => new THREE.Color(), []);

  useFrame((state, delta) => {
    const { hoverRegion: hover, focusRegion: focus, highlightRegions: highlights, arousal: ar } =
      storeRef.current;
    const lerp = 1 - Math.exp(-delta * 6);
    const t = state.clock.elapsedTime;

    const warmAll = THREE.MathUtils.clamp((ar - 0.35) / 0.65, 0, 1);
    const coldAll = THREE.MathUtils.clamp((-ar - 0.35) / 0.65, 0, 1);

    for (const entry of entries) {
      const isHover = entry.id === hover;
      const isFocus = entry.id === focus;
      const hasFocus = focus !== null;
      const isHighlighted = highlights.includes(entry.id);

      // Zielintensität
      let target = 0.25;
      if (isFocus) target = 0.95;
      else if (isHover) target = 0.8;
      else if (isHighlighted) target = 0.55 + 0.25 * Math.sin(t * 1.6);
      else if (hasFocus) target = 0.15;

      // Arousal-Modulation (warm pulsieren / frost einfrieren), sanft auf alle
      if (warmAll > 0) {
        target *= 1 + warmAll * 0.4 * (0.5 + 0.5 * Math.sin(t * 2.2));
      }
      if (coldAll > 0) {
        target *= 1 - coldAll * 0.35;
      }

      entry.current += (target - entry.current) * lerp;
      entry.material.opacity = THREE.MathUtils.clamp(entry.current, 0.05, 1);

      // Farbe: Base → warm (Hyper) / frost (Hypo)
      scratchColor.copy(entry.baseColor);
      if (warmAll > 0) scratchColor.lerp(WARM, warmAll * (0.55 + 0.25 * Math.sin(t * 2.2)));
      if (coldAll > 0) scratchColor.lerp(FROST, coldAll * 0.7);
      if (isHighlighted) scratchColor.lerp(WARM, 0.6);
      entry.material.color.lerp(scratchColor, lerp);

      // Skalierung: bei Hypoarousal „einfrieren" (leicht zusammenziehen)
      const scaleTarget = coldAll > 0 ? 1 - coldAll * 0.08 : 1;
      entry.currentScale += (scaleTarget - entry.currentScale) * lerp;
      entry.mesh?.scale.setScalar(entry.currentScale);
    }
  });

  const setCursor = (cursor: string) => {
    document.body.style.cursor = cursor;
  };

  return (
    <group>
      {regionAnchors.map((anchor, i) => {
        const entry = entries[i];
        const hitRadius = Math.max(anchor.radius * 2.2, 0.16);
        return (
          <group key={anchor.id} position={anchor.position}>
            <mesh
              onPointerOver={(e: ThreeEvent<PointerEvent>) => {
                e.stopPropagation();
                setState({ hoverRegion: anchor.id });
                setCursor("pointer");
              }}
              onPointerOut={(e: ThreeEvent<PointerEvent>) => {
                e.stopPropagation();
                setState({ hoverRegion: null });
                setCursor("");
              }}
              onClick={(e: ThreeEvent<MouseEvent>) => {
                e.stopPropagation();
                setState({ focusRegion: anchor.id });
              }}
            >
              <sphereGeometry args={[hitRadius, 10, 10]} />
              <meshBasicMaterial transparent opacity={0} depthWrite={false} colorWrite={false} />
            </mesh>
            <RegionEmblem entry={entry} />
          </group>
        );
      })}
    </group>
  );
}
