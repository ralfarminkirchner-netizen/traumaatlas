import Disclaimer from "@/components/Disclaimer";
import SectionHeading from "@/components/SectionHeading";
import { Slider } from "@/components/ui/slider";
import { windowOfTolerance } from "@/data/nervous";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { setState, useAtlasState } from "@/state/atlas-store";
import ExerciseAccordion from "./ExerciseAccordion";

type ZoneId = "hypo" | "mid" | "hyper";

interface ZoneInfo {
  id: ZoneId;
  label: string;
  color: string;
  /** Text aus windowOfTolerance (low/mid/high) */
  dataText: string;
  /** Eigener erklärender Satz */
  sentence: string;
  exercises: string[];
}

const ZONES: ZoneInfo[] = [
  {
    id: "hypo",
    label: "Hypoarousal",
    color: "#8b93c9",
    dataText: windowOfTolerance.low,
    sentence:
      "Ihr System liegt unter dem Fenster: Erstarrung, Taubheit und Rückzug sind eine Notbremse – eine Überlebensstrategie, keine Schwäche. Sanfte Aktivierung hilft, schrittweise zurück in den Körper zu kommen.",
    exercises: ["aktivieren", "pendeln", "sos-orientieren"],
  },
  {
    id: "mid",
    label: "Toleranzfenster",
    color: "#7fb8a4",
    dataText: windowOfTolerance.mid,
    sentence:
      "Sie sind im Fenster: Fühlen, Denken und Handeln sind gleichzeitig möglich, und Sie bleiben mit sich verbunden. Von hier aus lassen sich Belastungen dosiert ansehen und neue Sicherheit üben.",
    exercises: ["koerperscan", "sicherer-ort"],
  },
  {
    id: "hyper",
    label: "Hyperarousal",
    color: "#e2a35c",
    dataText: windowOfTolerance.high,
    sentence:
      "Ihr System liegt über dem Fenster: Alarm, Unruhe und Überflutung. Sie müssen das nicht ertragen – Erdung und langes Ausatmen führen den Körper behutsam zurück in die Mitte.",
    exercises: ["sos-54321", "sos-ausatmen"],
  },
];

function zoneOf(value: number): ZoneInfo {
  if (value < -33) return ZONES[0];
  if (value > 33) return ZONES[2];
  return ZONES[1];
}

/** Toleranzfenster: spielbarer Erregungskorridor mit Lichtkugel und passenden Übungen. */
export default function ToleranzView() {
  const { arousal } = useAtlasState();
  const reduced = useReducedMotion();

  const value = Math.round(arousal * 100);
  const zone = zoneOf(value);
  const ballPosition = (value + 100) / 2;

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-8 sm:px-8 sm:py-10">
      <SectionHeading
        eyebrow="Regulation"
        title={windowOfTolerance.title}
        lead={windowOfTolerance.body}
      />

      <div className="glass pointer-events-auto rounded-2xl p-6 sm:p-8">
        <div className="flex items-end justify-between gap-4 text-[11px] uppercase tracking-[0.18em]">
          <span style={{ color: ZONES[0].color }}>Hypo · Erstarrung</span>
          <span className="text-center text-ink/60">Fenster</span>
          <span style={{ color: ZONES[2].color }}>Hyper · Alarm</span>
        </div>

        {/* Korridor-Band mit Lichtkugel */}
        <div
          aria-hidden="true"
          className="relative mt-3 h-16 overflow-hidden rounded-2xl border border-white/10"
          style={{
            background:
              "linear-gradient(90deg, rgba(139,147,201,0.42), rgba(127,184,164,0.30) 38%, rgba(127,184,164,0.30) 62%, rgba(226,163,92,0.42))",
          }}
        >
          <span className="absolute inset-y-3 left-1/3 w-px bg-white/15" />
          <span className="absolute inset-y-3 left-2/3 w-px bg-white/15" />
          <span
            className="absolute top-1/2 size-5 -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{
              left: `${ballPosition}%`,
              backgroundColor: zone.color,
              boxShadow: `0 0 18px 6px ${zone.color}59, 0 0 44px 12px ${zone.color}2e`,
              transition: reduced
                ? "none"
                : "left 0.25s ease, background-color 0.25s ease, box-shadow 0.25s ease",
            }}
          />
        </div>

        <div className="mt-6">
          <Slider
            min={-100}
            max={100}
            step={1}
            value={[value]}
            onValueChange={(v) => setState({ arousal: (v[0] ?? 0) / 100 })}
            aria-label="Erregung im Toleranzfenster"
            aria-valuetext={`${zone.label}: ${zone.dataText}`}
          />
          <div className="mt-2 flex justify-between text-[11px] text-ink/40">
            <span>-100 · Untererregung</span>
            <span>0 · Mitte</span>
            <span>+100 · Übererregung</span>
          </div>
        </div>

        <p className="mt-4 text-xs leading-relaxed text-ink/55">
          Bewegen Sie den Regler, wie es sich gerade anfühlt – es gibt keinen richtigen Wert.
          Die Körperansicht folgt Ihrer Einschätzung.
        </p>
      </div>

      {/* Auswertung zur aktuellen Zone */}
      <section
        aria-live="polite"
        aria-label="Auswertung"
        className="glass pointer-events-auto overflow-hidden rounded-2xl"
        style={{ borderLeftWidth: 3, borderLeftColor: zone.color }}
      >
        <div className="p-6 sm:p-8">
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="font-display text-2xl text-ink">{zone.label}</h3>
            <span
              className="rounded-full border px-3 py-1 text-[11px] font-medium"
              style={{ color: zone.color, borderColor: zone.color, backgroundColor: `${zone.color}22` }}
            >
              {zone.dataText}
            </span>
          </div>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-ink/70">{zone.sentence}</p>

          <h4 className="mt-6 text-xs font-medium uppercase tracking-[0.22em] text-ink/50">
            Übungen, die jetzt passen
          </h4>
          <div className="mt-1 max-w-3xl">
            <ExerciseAccordion ids={zone.exercises} />
          </div>
        </div>
      </section>

      <Disclaimer className="max-w-2xl" />
    </div>
  );
}
