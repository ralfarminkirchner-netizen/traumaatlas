// BodyScene: Einstieg in die 3D-Szene. Wrapper (vignette) mit Canvas
// (WebGL2 + reduced-motion → StaticBody-Fallback), Licht/Fog, Bloom und
// DOM-Overlays (Tooltip folgt der Maus, RegionPanel bei Fokus).

import { useEffect, useMemo, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import { AnimatePresence, motion, useMotionValue, useSpring } from "framer-motion";
import * as THREE from "three";
import type { PointerEvent as ReactPointerEvent, RefObject } from "react";
import BodyModel from "./BodyModel";
import CameraRig from "./CameraRig";
import DriftParticles from "./DriftParticles";
import RegionLayer from "./RegionLayer";
import RegionPanel from "./RegionPanel";
import StaticBody from "./StaticBody";
import VagusGlow from "./VagusGlow";
import { bodyRegions } from "@/data/nervous";
import { setState, useAtlasState } from "@/state/atlas-store";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

/** WebGL2-Verfügbarkeit prüfen (einmalig) */
function detectWebGL2(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return canvas.getContext("webgl2") !== null;
  } catch {
    return false;
  }
}

/** Kleine .glass-Karte, folgt der Maus sanft per framer-motion-Spring */
function RegionTooltip({ containerRef }: { containerRef: RefObject<HTMLDivElement | null> }) {
  const { hoverRegion, focusRegion } = useAtlasState();
  const region = bodyRegions.find((r) => r.id === hoverRegion) ?? null;
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 260, damping: 28, mass: 0.6 });
  const springY = useSpring(y, { stiffness: 260, damping: 28, mass: 0.6 });

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;
    const onMove = (e: MouseEvent) => {
      const rect = node.getBoundingClientRect();
      x.set(e.clientX - rect.left);
      y.set(e.clientY - rect.top);
    };
    node.addEventListener("mousemove", onMove);
    return () => node.removeEventListener("mousemove", onMove);
  }, [containerRef, x, y]);

  return (
    <motion.div
      aria-hidden
      style={{ x: springX, y: springY }}
      className="pointer-events-none absolute left-0 top-0 z-30"
    >
      <AnimatePresence>
        {region && focusRegion !== region.id && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="glass -translate-x-1/2 -translate-y-[135%] whitespace-nowrap rounded-xl px-3 py-2"
          >
            <p className="font-display text-sm text-ink">{region.label}</p>
            <p className="text-xs text-ink/60">{region.signals[0]}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function BodyScene() {
  const reducedMotion = useReducedMotion();
  const { view, layer, cascadeStep } = useAtlasState();
  const containerRef = useRef<HTMLDivElement>(null);

  const hasWebGL2 = useMemo(() => detectWebGL2(), []);
  const useFallback = reducedMotion || !hasWebGL2;

  const autoRotate = view === "start" && cascadeStep < 0 && !reducedMotion;
  const frozen = cascadeStep === 3 || reducedMotion;

  const onPointerMissed = (event: ReactPointerEvent | MouseEvent) => {
    if (event.type === "click") {
      setState({ focusRegion: null });
    }
  };

  return (
    <div ref={containerRef} className="vignette relative h-full w-full overflow-hidden">
      {useFallback ? (
        <StaticBody />
      ) : (
        <Canvas
          dpr={[1, 1.75]}
          camera={{ fov: 40, position: [0, 1.35, 3.6] }}
          gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping }}
          onPointerMissed={onPointerMissed}
        >
          <color attach="background" args={["#0e0b08"]} />
          <fog attach="fog" args={["#0e0b08", 4, 9]} />

          {/* Warmes 3-Punkt-Licht */}
          <ambientLight intensity={0.18} />
          <directionalLight position={[1.5, 2.6, 2.5]} intensity={1.15} color="#f0c896" />
          <directionalLight position={[-2.2, 1.2, 1.6]} intensity={0.35} color="#6f7fa0" />
          <directionalLight position={[0, 2.2, -2.6]} intensity={0.8} color="#e2a35c" />

          <CameraRig reducedMotion={reducedMotion}>
            <BodyModel layer={layer} autoRotate={autoRotate} frozen={frozen} />
            <RegionLayer />
            <VagusGlow />
            <DriftParticles />
          </CameraRig>

          <EffectComposer>
            <Bloom luminanceThreshold={0.75} intensity={0.35} mipmapBlur />
          </EffectComposer>
        </Canvas>
      )}

      {/* DOM-Overlays */}
      {!useFallback && <RegionTooltip containerRef={containerRef} />}
      <RegionPanel />
    </div>
  );
}
