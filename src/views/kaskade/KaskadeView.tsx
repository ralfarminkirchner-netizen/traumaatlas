import { useEffect } from "react";
import { Pause, Play, SkipBack, SkipForward } from "lucide-react";

import Disclaimer from "@/components/Disclaimer";
import SectionHeading from "@/components/SectionHeading";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { nervousStates, stressCascade } from "@/data/nervous";
import { useIsMobile } from "@/hooks/use-is-mobile";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { getState, setState, useAtlasState } from "@/state/atlas-store";
import { cn } from "@/lib/utils";

const STEP_COUNT = stressCascade.length;
const LAST_STEP = STEP_COUNT - 1;

function clampStep(step: number): number {
  return Math.max(0, Math.min(LAST_STEP, step));
}

/**
 * Die choreografierte Stresskaskade: 6 Stationen, synchron mit der 3D-Szene
 * (Szene reagiert auf cascadeStep / cascadePlaying aus dem Atlas-Store).
 */
export default function KaskadeView() {
  const { cascadeStep, cascadePlaying } = useAtlasState();
  const reduced = useReducedMotion();
  const mobile = useIsMobile();

  const stepIndex = clampStep(cascadeStep);
  const step = stressCascade[stepIndex];
  const nervous = nervousStates.find((s) => s.id === step.nervous) ?? nervousStates[0];

  // Beim Betreten an Station 1 starten; beim Verlassen die Szene sauber zurücksetzen
  useEffect(() => {
    setState({ cascadeStep: 0 });
    return () => {
      setState({ cascadeStep: -1, cascadePlaying: false });
    };
  }, []);

  // Traumasensibel: bei reduzierter Bewegung kein Auto-Play erzwingen
  useEffect(() => {
    if (reduced && getState().cascadePlaying) {
      setState({ cascadePlaying: false });
    }
  }, [reduced]);

  // Auto-Advance: 9 s pro Station (6 s mobil), nach Station 6 stoppt die Wiedergabe
  useEffect(() => {
    if (!cascadePlaying || reduced) return;
    if (stepIndex >= LAST_STEP) {
      setState({ cascadePlaying: false });
      return;
    }
    const duration = mobile ? 6000 : 9000;
    const timer = window.setTimeout(() => {
      setState({ cascadeStep: clampStep(getState().cascadeStep + 1) });
    }, duration);
    return () => window.clearTimeout(timer);
  }, [cascadePlaying, stepIndex, reduced, mobile]);

  // Tastatur: ←/→ Station wechseln, Leertaste Play/Pause.
  // Globaler Listener ist unkritisch, da er nur existiert, solange der View aktiv ist.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable)
      ) {
        return;
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        setState({ cascadeStep: clampStep(getState().cascadeStep + 1) });
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        setState({ cascadeStep: clampStep(getState().cascadeStep - 1) });
      } else if (event.key === " ") {
        event.preventDefault();
        const current = getState();
        setState({ cascadePlaying: !current.cascadePlaying });
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const goTo = (index: number) => setState({ cascadeStep: clampStep(index) });
  const togglePlaying = () => setState({ cascadePlaying: !cascadePlaying });

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-8 sm:px-8 sm:py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <SectionHeading
          eyebrow="Stresskaskade"
          title="Wie der Körper Alarm schlägt – und was danach im Körper bleibt"
          lead="Sechs Stationen von der ersten unbewussten Gefahlenprüfung bis zur Speicherung als Körpergedächtnis. Die Körperansicht rechts folgt jeder Station."
        />
        {reduced ? (
          <p className="glass-soft max-w-xs rounded-xl px-4 py-3 text-xs leading-relaxed text-ink/60">
            Automatische Wiedergabe ist deaktiviert, weil in Ihrem System reduzierte Bewegung
            eingestellt ist. Sie können die Stationen weiterhin manuell durchlaufen.
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-10">
        {/* Overlay-Karte der aktiven Station */}
        <article
          aria-live="polite"
          className="glass pointer-events-auto w-full max-w-xl rounded-2xl p-6 sm:p-8"
        >
          <p
            className="text-[11px] font-medium uppercase tracking-[0.28em]"
            style={{ color: step.color }}
          >
            Station {stepIndex + 1} von {STEP_COUNT}
          </p>
          <h3 className="font-display mt-2 text-2xl leading-snug text-ink sm:text-3xl">
            {step.title}
          </h3>
          <p className="mt-1.5 text-xs text-ink/50">{step.time}</p>
          <p className="mt-4 text-sm leading-relaxed text-ink/75">{step.body}</p>
          <p
            className="mt-6 inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-medium"
            style={{
              color: nervous.color,
              borderColor: nervous.color,
              backgroundColor: nervous.soft,
            }}
          >
            <span
              aria-hidden="true"
              className="size-2 rounded-full"
              style={{ backgroundColor: nervous.color }}
            />
            Nervensystem: {nervous.name}
          </p>
        </article>

        {/* Fortschrittsrail mit Stationspunkten und Steuerung */}
        <nav
          aria-label="Stationen der Stresskaskade"
          className="glass pointer-events-auto w-full rounded-2xl p-4 sm:p-5 lg:w-[22rem] lg:shrink-0"
        >
          <ol className="flex flex-col gap-1">
            {stressCascade.map((station, index) => {
              const active = index === stepIndex;
              const visited = index < stepIndex;
              return (
                <li key={station.id}>
                  <button
                    type="button"
                    onClick={() => goTo(index)}
                    aria-current={active ? "step" : undefined}
                    aria-label={`Station ${index + 1}: ${station.title}`}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors",
                      active ? "bg-white/[0.06]" : "hover:bg-white/[0.04]",
                    )}
                  >
                    <span
                      aria-hidden="true"
                      className={cn(
                        "size-2.5 shrink-0 rounded-full transition-opacity",
                        active ? "opacity-100 ring-2 ring-white/25 ring-offset-2 ring-offset-transparent" : "",
                      )}
                      style={{
                        backgroundColor: station.color,
                        opacity: active ? 1 : visited ? 0.65 : 0.28,
                      }}
                    />
                    <span className="w-6 text-[11px] tabular-nums text-ink/40">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span
                      className={cn(
                        "min-w-0 flex-1 truncate text-sm",
                        active ? "text-ink" : "text-ink/60",
                      )}
                    >
                      {station.title}
                    </span>
                    <span className="hidden text-[11px] text-ink/40 sm:inline">{station.time}</span>
                  </button>
                </li>
              );
            })}
          </ol>

          <div className="mt-4 px-1">
            <Progress
              value={((stepIndex + 1) / STEP_COUNT) * 100}
              aria-label={`Fortschritt: Station ${stepIndex + 1} von ${STEP_COUNT}`}
              className="h-1"
            />
          </div>

          <div className="mt-4 flex items-center justify-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => goTo(stepIndex - 1)}
              disabled={stepIndex === 0}
              aria-label="Vorherige Station"
              aria-keyshortcuts="ArrowLeft"
            >
              <SkipBack aria-hidden="true" />
            </Button>
            <Button
              onClick={togglePlaying}
              aria-pressed={cascadePlaying}
              aria-label={cascadePlaying ? "Wiedergabe pausieren" : "Wiedergabe starten"}
              aria-keyshortcuts="Space"
              className="min-w-32"
            >
              {cascadePlaying ? (
                <>
                  <Pause aria-hidden="true" /> Pause
                </>
              ) : (
                <>
                  <Play aria-hidden="true" /> Abspielen
                </>
              )}
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => goTo(stepIndex + 1)}
              disabled={stepIndex === LAST_STEP}
              aria-label="Nächste Station"
              aria-keyshortcuts="ArrowRight"
            >
              <SkipForward aria-hidden="true" />
            </Button>
          </div>

          <p className="mt-3 text-center text-[11px] text-ink/40">
            Tastatur: ← → wechselt die Station, Leertaste startet oder pausiert.
          </p>
        </nav>
      </div>

      <Disclaimer className="max-w-2xl" />
    </div>
  );
}
