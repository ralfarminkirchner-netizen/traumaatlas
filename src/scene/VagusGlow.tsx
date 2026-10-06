// VagusGlow: leuchtende Tube entlang des Vagus-Verlaufs (Hals → Brust → Bauch)
// mit einem langsamen, gleichförmigen Energiepuls. Bei Kaskaden-Station 3
// (Erstarrung) wird das Glühen blass/kalt und stoppt; ab Station 4 warm.

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { vagusPath } from "@/data/body3d";
import { useAtlasState } from "@/state/atlas-store";

const WARM_GLOW = new THREE.Color("#8fd8cf");
const COLD_GLOW = new THREE.Color("#8b93c9");
const PULSE_WARM = new THREE.Color("#d9f2ee");
const PULSE_COLD = new THREE.Color("#aeb6d8");

/** Pulsperiode in Sekunden */
const PULSE_DURATION = 6;

export default function VagusGlow() {
  const { cascadeStep, layer } = useAtlasState();
  const pulseMesh = useRef<THREE.Mesh>(null);
  const pulseT = useRef(0);
  const frozenBlend = useRef(0);

  const curve = useMemo(
    () => new THREE.CatmullRomCurve3(vagusPath.map((p) => new THREE.Vector3(...p))),
    [],
  );
  const tubeGeometry = useMemo(
    () => new THREE.TubeGeometry(curve, 64, 0.008, 8, false),
    [curve],
  );

  const tubeMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        transparent: true,
        opacity: 0.45,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        color: WARM_GLOW,
      }),
    [],
  );
  const pulseMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        transparent: true,
        opacity: 0.9,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        color: PULSE_WARM,
      }),
    [],
  );
  const pulseGeometry = useMemo(() => new THREE.SphereGeometry(0.016, 12, 10), []);
  const scratchColor = useMemo(() => new THREE.Color(), []);

  const storeRef = useRef({ cascadeStep, layer });
  storeRef.current = { cascadeStep, layer };

  useFrame((_, delta) => {
    const { cascadeStep: step, layer: activeLayer } = storeRef.current;
    const frozen = step === 3;

    // Blend 0 = warm/lebendig, 1 = kalt/erstarrt
    const lerp = 1 - Math.exp(-delta * 1.6);
    frozenBlend.current += ((frozen ? 1 : 0) - frozenBlend.current) * lerp;
    const blend = frozenBlend.current;

    // Sichtbarkeit: immer, deutlicher ab Layer 3
    tubeMaterial.opacity = 0.3 + (activeLayer / 3) * 0.35;
    scratchColor.copy(WARM_GLOW).lerp(COLD_GLOW, blend);
    tubeMaterial.color.lerp(scratchColor, lerp);
    pulseMaterial.color.lerp(scratchColor.copy(PULSE_WARM).lerp(PULSE_COLD, blend), lerp);

    // Energiepuls: periodisch, gleichförmig; stoppt bei Erstarrung
    if (!frozen) {
      pulseT.current = (pulseT.current + delta / PULSE_DURATION) % 1;
    }
    const point = curve.getPointAt(pulseT.current);
    pulseMesh.current?.position.copy(point);
    pulseMaterial.opacity = 0.9 * (1 - blend);
    pulseMesh.current?.scale.setScalar(1 - blend * 0.4);
  });

  return (
    <group>
      <mesh geometry={tubeGeometry} material={tubeMaterial} />
      <mesh ref={pulseMesh} geometry={pulseGeometry} material={pulseMaterial} />
    </group>
  );
}
