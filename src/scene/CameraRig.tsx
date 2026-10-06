// CameraRig: OrbitControls (drei) + choreografierte gsap-Flüge.
//  · focusRegion → Kamera fliegt vor die Region, null → Rückflug
//  · cascadeStep → Kamerapfad durch die 6 Kaskaden-Stationen
//  · subtiler Maus-Parallax (Gruppenversatz, ruht während Orbit & reduced-motion)
// Der Parallax verschiebt die Szenen-Gruppe statt der Kamera – visuell
// identisch, aber sicher mit OrbitControls (keine Kamera-Drift).

import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import gsap from "gsap";
import * as THREE from "three";
import type { ReactNode } from "react";
import { regionAnchors } from "@/data/body3d";
import { useAtlasState } from "@/state/atlas-store";

const HOME_POSITION = new THREE.Vector3(0, 1.35, 3.6);
const HOME_TARGET = new THREE.Vector3(0, 1.05, 0);
const FLIGHT_DURATION = 1.4;

/** Minimal-Schnittstelle der drei-OrbitControls (vermeidet three-stdlib-Import) */
interface ControlsLike {
  target: THREE.Vector3;
  enabled: boolean;
  update: () => void;
  addEventListener?: (type: string, fn: () => void) => void;
  removeEventListener?: (type: string, fn: () => void) => void;
}

/** Kaskaden-Stationen → Kameraposition / Blickziel (Mapping aus atlas-store.ts) */
const CASCADE_KEYFRAMES: ReadonlyArray<{ position: [number, number, number]; target: [number, number, number] }> = [
  { position: [0, 1.6, 3.4], target: [0, 1.58, 0] }, // 0 Wahrnehmung: weit vorne am Kopf
  { position: [0.35, 1.55, 1.7], target: [0, 1.45, 0] }, // 1 Orientierung: Kopf/Hals
  { position: [0, 1.3, 2.0], target: [0, 1.25, 0] }, // 2 Mobilisierung: Brust
  { position: [0, 1.2, 4.6], target: [0, 1.0, 0] }, // 3 Erstarrung: weit/total
  { position: [0.5, 1.0, 2.7], target: [0, 0.95, 0] }, // 4 Entladung: Schultern+Becken
  { position: [0, 0.95, 1.8], target: [0, 0.96, 0.03] }, // 5 Speicherung: Bauch
];

export interface CameraRigProps {
  reducedMotion: boolean;
  children?: ReactNode;
}

export default function CameraRig({ reducedMotion, children }: CameraRigProps) {
  const camera = useThree((s) => s.camera);
  const controls = useThree((s) => s.controls) as ControlsLike | null;
  const { focusRegion, cascadeStep } = useAtlasState();

  const parallaxGroup = useRef<THREE.Group>(null);
  const interacting = useRef(false);
  const parallaxTarget = useRef(new THREE.Vector3());
  const flight = useRef<gsap.core.Timeline | null>(null);

  // Orbit-Interaktion verfolgen (Parallax ruht dann)
  useEffect(() => {
    if (!controls?.addEventListener || !controls.removeEventListener) return;
    const onStart = () => {
      interacting.current = true;
    };
    const onEnd = () => {
      interacting.current = false;
    };
    controls.addEventListener("start", onStart);
    controls.addEventListener("end", onEnd);
    const remove = controls.removeEventListener.bind(controls);
    return () => {
      remove("start", onStart);
      remove("end", onEnd);
    };
  }, [controls]);

  // ── Choreografierte Flüge (gsap) ──
  useEffect(() => {
    if (!controls) return;
    flight.current?.kill();

    let destination: { position: THREE.Vector3; target: THREE.Vector3 };
    const anchor = focusRegion ? regionAnchors.find((r) => r.id === focusRegion) : undefined;

    if (anchor) {
      // Regionsflug: vor die Region, Abstand ~0.9 + radius, leicht seitlich
      const index = regionAnchors.indexOf(anchor);
      const side = index % 2 === 0 ? 1 : -1;
      const distance = 0.9 + anchor.radius;
      destination = {
        position: new THREE.Vector3(
          anchor.position[0] + side * 0.3,
          anchor.position[1] + 0.05,
          anchor.position[2] + distance,
        ),
        target: new THREE.Vector3(...anchor.position),
      };
    } else if (cascadeStep >= 0 && cascadeStep < CASCADE_KEYFRAMES.length) {
      const keyframe = CASCADE_KEYFRAMES[cascadeStep];
      destination = {
        position: new THREE.Vector3(...keyframe.position),
        target: new THREE.Vector3(...keyframe.target),
      };
    } else {
      destination = { position: HOME_POSITION.clone(), target: HOME_TARGET.clone() };
    }

    controls.enabled = false;
    const tl = gsap.timeline({
      defaults: { duration: reducedMotion ? 0 : FLIGHT_DURATION, ease: "power2.inOut" },
      onComplete: () => {
        controls.enabled = true;
      },
    });
    tl.to(camera.position, {
      x: destination.position.x,
      y: destination.position.y,
      z: destination.position.z,
    }, 0);
    tl.to(controls.target, {
      x: destination.target.x,
      y: destination.target.y,
      z: destination.target.z,
      onUpdate: () => controls.update(),
    }, 0);
    flight.current = tl;
    return () => {
      tl.kill();
    };
  }, [focusRegion, cascadeStep, controls, camera, reducedMotion]);

  // ── Subtiler Maus-Parallax (Szenen-Gruppe, max ~0.05) ──
  useFrame((state, delta) => {
    if (!parallaxGroup.current) return;
    if (reducedMotion || interacting.current) return;
    parallaxTarget.current.set(state.pointer.x * 0.05, state.pointer.y * 0.03, 0);
    const lerp = 1 - Math.exp(-delta * 2);
    parallaxGroup.current.position.lerp(parallaxTarget.current, lerp);
  });

  return (
    <>
      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.06}
        target={[HOME_TARGET.x, HOME_TARGET.y, HOME_TARGET.z]}
        minDistance={1.6}
        maxDistance={6}
        maxPolarAngle={1.75}
        enablePan={false}
      />
      <group ref={parallaxGroup}>{children}</group>
    </>
  );
}
