// Wechselwirkungen & Blinde Flecken: wertet das im Baukasten gespeicherte
// Programm aus (localStorage "traumaatlas-program") – Synergien, Reihenfolgen,
// Dosierungen, Vorsichten, Blinde Flecken und Selbsthilfe-Grenzen.

import { useCallback, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  CheckCircle2,
  EyeOff,
  HeartHandshake,
  LifeBuoy,
  PackageOpen,
} from "lucide-react";

import {
  synergyRules,
  blindSpots,
  selfHelpLimits,
  buildingBlocks,
  type SynergyRule,
  type BlindSpot,
} from "@/data/blocks";
import { exercises } from "@/data/exercises";
import { methods } from "@/data/methods";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { Badge } from "@/components/ui/badge";
import { PROGRAM_KEY } from "@/views/baukasten/BaukastenView";

const DEMO_PROGRAM = [
  "sicherer-ort",
  "koerperscan",
  "sos-54321",
  "abend",
  "bewegung-gehen",
  "co-regulation",
  "pendeln",
  "tfcbt",
];

const METHOD_IDS = new Set(methods.map((m) => m.id));

/** id → Anzeigename (Bausteine, Übungen, Verfahren) */
function nameOf(id: string): string {
  return (
    buildingBlocks.find((b) => b.id === id)?.title ??
    exercises.find((e) => e.id === id)?.title ??
    methods.find((m) => m.id === id)?.name ??
    id
  );
}

type RuleKind = SynergyRule["kind"];

const KIND_STYLE: Record<
  RuleKind,
  { label: string; card: string; icon: typeof CheckCircle2 }
> = {
  synergy: {
    label: "Synergie",
    card: "border-ventral/40 bg-ventral-soft",
    icon: CheckCircle2,
  },
  order: {
    label: "Reihenfolge",
    card: "border-amber/40 bg-amber-soft",
    icon: HeartHandshake,
  },
  dose: {
    label: "Dosierung",
    card: "border-amber/25 bg-amber-soft/60",
    icon: AlertTriangle,
  },
  caution: {
    label: "Vorsicht",
    card: "border-[#e2725b]/40 bg-[#e2725b]/10",
    icon: AlertTriangle,
  },
};

const SEVERITY_STYLE: Record<
  BlindSpot["severity"],
  { label: string; card: string; badge: string }
> = {
  hinweis: {
    label: "Hinweis",
    card: "border-frost/30",
    badge: "border-frost/30 bg-dorsal-soft text-frost",
  },
  wichtig: {
    label: "Wichtig",
    card: "border-amber/40",
    badge: "border-amber/30 bg-amber-soft text-amber",
  },
  dringend: {
    label: "Dringend",
    card: "border-[#e2725b]/50",
    badge: "border-[#e2725b]/40 bg-[#e2725b]/10 text-[#e98a72]",
  },
};

function loadProgram(): string[] {
  try {
    const raw = localStorage.getItem(PROGRAM_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return [];
    const prog = (parsed as Record<string, unknown>).program;
    if (typeof prog !== "object" || prog === null) return [];
    const out: string[] = [];
    for (const value of Object.values(prog)) {
      if (Array.isArray(value)) {
        value.forEach((v) => {
          if (typeof v === "string") out.push(v);
        });
      }
    }
    return [...new Set(out)];
  } catch {
    return [];
  }
}

export default function WechselView() {
  const reduced = useReducedMotion();
  const [program, setProgram] = useState<string[] | null>(() => loadProgram());

  const hasTraumaMethod = useMemo(
    () => (program ?? []).some((id) => METHOD_IDS.has(id)),
    [program],
  );

  const matchedRules = useMemo(
    () =>
      synergyRules.filter((r) => {
        try {
          return r.when(program ?? []);
        } catch {
          return false;
        }
      }),
    [program],
  );

  const matchedSpots = useMemo(
    () =>
      blindSpots.filter((b) => {
        try {
          return b.check(program ?? [], hasTraumaMethod);
        } catch {
          return false;
        }
      }),
    [program, hasTraumaMethod],
  );

  const loadDemo = useCallback(() => {
    try {
      localStorage.setItem(
        PROGRAM_KEY,
        JSON.stringify({
          app: "TRAUMAATLAS",
          version: 1,
          savedAt: new Date().toISOString(),
          program: {
            stabilisierung: [
              "sicherer-ort",
              "koerperscan",
              "sos-54321",
              "abend",
              "bewegung-gehen",
              "co-regulation",
            ],
            konfrontation: ["pendeln", "tfcbt"],
            integration: [],
          },
        }),
      );
    } catch {
      // Speicher nicht verfügbar – Demo nur im State anzeigen
    }
    setProgram([...DEMO_PROGRAM]);
  }, []);

  return (
    <div className="view-fade min-h-full pb-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <header className="pt-10 pb-8">
          <p className="font-display text-sm uppercase tracking-[0.25em] text-amber/80">
            Wechselwirkungen &amp; Blinde Flecken
          </p>
          <h1 className="font-display mt-3 text-3xl sm:text-4xl text-ink">
            Wie gut sprechen Ihre Bausteine miteinander?
          </h1>
          <p className="mt-3 max-w-2xl text-sm sm:text-base text-ink/70 leading-relaxed">
            Diese Ansicht liest Ihr gespeichertes Programm aus dem Baukasten
            und prüft es: Welche Elemente verstärken sich, welche Reihenfolge
            ist klug, wo fehlt Dosierung – und was Selbsthilfe grundsätzlich
            nicht leisten kann.
          </p>
        </header>

        {program === null ? (
          <p className="text-sm text-ink/50">Programm wird gelesen …</p>
        ) : program.length === 0 ? (
          <section
            aria-label="Kein Programm vorhanden"
            className="glass rounded-2xl p-8 text-center"
          >
            <PackageOpen
              className="mx-auto h-8 w-8 text-ink/40"
              aria-hidden="true"
            />
            <h2 className="font-display mt-4 text-xl text-ink">
              Noch kein Programm gelegt
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-ink/65 leading-relaxed">
              Legen Sie zuerst im Baukasten ein Programm aus Bausteinen, Übungen
              und Verfahren an – diese Ansicht wertet es dann automatisch aus.
            </p>
            <button
              type="button"
              onClick={loadDemo}
              className="mt-5 inline-flex items-center gap-2 rounded-xl border border-amber/40 bg-amber-soft px-4 py-2 text-sm text-amber hover:bg-amber-soft/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber/60"
            >
              <LifeBuoy className="h-4 w-4" aria-hidden="true" />
              Beispielprogramm laden und auswerten
            </button>
          </section>
        ) : (
          <>
            {/* Programm-Übersicht */}
            <section
              aria-label="Eingeplante Elemente"
              className="glass-soft rounded-2xl p-4 mb-8"
            >
              <h2 className="text-xs uppercase tracking-wider text-ink/45">
                Ausgewertetes Programm ({program.length}{" "}
                {program.length === 1 ? "Element" : "Elemente"})
              </h2>
              <ul className="mt-2 flex flex-wrap gap-1.5" aria-label="Elemente im Programm">
                {program.map((id) => (
                  <li
                    key={id}
                    className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] text-ink/70"
                  >
                    {nameOf(id)}
                  </li>
                ))}
              </ul>
            </section>

            {/* Synergie-Regeln */}
            <section aria-label="Wechselwirkungs-Regeln">
              <h2 className="font-display text-xl text-ink">
                Wechselwirkungen ({matchedRules.length})
              </h2>
              {matchedRules.length === 0 ? (
                <p className="mt-3 text-sm text-ink/55 leading-relaxed glass-soft rounded-xl p-4">
                  Keine Regel trifft aktuell zu – das ist kein Fehler. Sobald
                  sich z. B. eine körperliche Übung und ein kognitives Verfahren
                  im Programm begegnen, weisen wir hier auf ihre Verbindung hin.
                </p>
              ) : (
                <ul role="list" className="mt-4 grid gap-4 md:grid-cols-2">
                  {matchedRules.map((rule, idx) => {
                    const style = KIND_STYLE[rule.kind];
                    const Icon = style.icon;
                    return (
                      <motion.li
                        key={rule.id}
                        initial={reduced ? false : { opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={
                          reduced
                            ? { duration: 0 }
                            : { duration: 0.4, delay: idx * 0.05 }
                        }
                        className={`glass rounded-2xl border p-5 ${style.card}`}
                      >
                        <div className="flex items-center gap-2">
                          <Icon
                            className="h-4 w-4 shrink-0"
                            aria-hidden="true"
                          />
                          <Badge
                            variant="outline"
                            className="border-white/15 bg-white/[0.05] text-ink/60"
                          >
                            {style.label}
                          </Badge>
                        </div>
                        <h3 className="font-display mt-3 text-lg text-ink">
                          {rule.title}
                        </h3>
                        <p className="mt-2 text-sm text-ink/75 leading-relaxed">
                          {rule.reason}
                        </p>
                        {rule.related.length > 0 && (
                          <ul
                            role="list"
                            aria-label="Betroffene Elemente"
                            className="mt-3 flex flex-wrap gap-1.5"
                          >
                            {rule.related.map((id) => (
                              <li
                                key={id}
                                className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-0.5 text-[11px] text-ink/65"
                              >
                                {nameOf(id)}
                              </li>
                            ))}
                          </ul>
                        )}
                      </motion.li>
                    );
                  })}
                </ul>
              )}
            </section>

            {/* Blinde Flecken */}
            <section aria-label="Blinde Flecken" className="mt-10">
              <h2 className="font-display text-xl text-ink flex items-center gap-2">
                <EyeOff className="h-5 w-5 text-amber" aria-hidden="true" />
                Blinde Flecken ({matchedSpots.length})
              </h2>
              <p className="mt-1 text-sm text-ink/55">
                Was im Programm (noch) fehlt oder problematisch sein könnte –
                formuliert als Einladung, nicht als Mängelliste.
              </p>
              <ul role="list" className="mt-4 grid gap-4 md:grid-cols-2">
                {matchedSpots.map((spot) => {
                  const style = SEVERITY_STYLE[spot.severity];
                  return (
                    <li
                      key={spot.id}
                      className={`glass rounded-2xl border p-5 ${style.card}`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <Badge
                          variant="outline"
                          className={style.badge}
                        >
                          {style.label}
                        </Badge>
                      </div>
                      <h3 className="font-display mt-3 text-lg text-ink">
                        {spot.title}
                      </h3>
                      <p className="mt-2 text-sm text-ink/75 leading-relaxed">
                        {spot.body}
                      </p>
                      <p className="mt-3 rounded-lg bg-white/[0.04] border border-white/10 p-3 text-sm text-ventral/90 leading-relaxed">
                        Nächster Schritt: {spot.nextStep}
                      </p>
                    </li>
                  );
                })}
              </ul>
            </section>
          </>
        )}

        {/* Selbsthilfe-Grenzen – immer sichtbar */}
        <section
          aria-label="Selbsthilfe-Grenzen"
          className="glass mt-12 rounded-2xl border-l-4 border-l-[#e2725b] p-6"
        >
          <h2 className="font-display text-xl text-ink flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-[#e98a72]" aria-hidden="true" />
            {selfHelpLimits.title}
          </h2>
          <p className="mt-3 text-sm text-ink/80 leading-relaxed">
            {selfHelpLimits.body}
          </p>
          <p className="mt-3 rounded-lg border border-ventral/30 bg-ventral-soft p-3 text-sm text-ventral/95 leading-relaxed">
            {selfHelpLimits.nextStep}
          </p>
          <p className="mt-3 text-xs text-ink/50">
            Die vollständige Übersicht aller Anlaufstellen finden Sie in der
            Wegweiser-Ansicht dieses Atlas (Telefonseelsorge, 116117,
            DeGPT-Verzeichnis, Spezialambulanzen).
          </p>
        </section>
      </div>
    </div>
  );
}
