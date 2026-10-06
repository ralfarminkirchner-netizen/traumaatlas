// Symptom-Navigator: Auswahl → Erregungslage, Muster-Verdacht, Körperregionen, passende Übungen.
// Hinweis: Keine Diagnose. Verdachtsanzeigen sind Orientierung, keine Klassifikation.

import { useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Info, MapPin, Sparkles } from "lucide-react";

import { useAtlasState, setState } from "@/state/atlas-store";
import {
  symptomCategories,
  explanations,
  emergencyNote,
  type Symptom,
} from "@/data/symptoms";
import { symptomRegionMap, regionAnchors } from "@/data/body3d";
import { methodSymptomsLocal } from "@/data/navigatorLinks";
import { exercises } from "@/data/exercises";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const ALL_SYMPTOMS: Symptom[] = symptomCategories.flatMap((c) => c.symptoms);

const AROUSAL_LABEL: Record<Symptom["arousal"], string> = {
  hyper: "Hyperarousal (Übererregung)",
  hypo: "Hypoarousal (Untererregung)",
  both: "gemischt / pendelnd",
};

function toggleSymptom(id: string, selected: string[]): void {
  const next = selected.includes(id)
    ? selected.filter((s) => s !== id)
    : [...selected, id];
  setState({ selectedSymptoms: next });
}

/** Vereinigung der Regionen über das Symptom→Region-Mapping, stabil sortiert. */
function regionsForSelection(selected: string[]): string[] {
  const set = new Set<string>();
  for (const sid of selected) {
    const entry = symptomRegionMap.find((m) => m.symptomId === sid);
    if (entry) entry.regionIds.forEach((r) => set.add(r));
  }
  return [...set];
}

function arraysEqual(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every((v, i) => v === b[i]);
}

export default function NavigatorView() {
  const { selectedSymptoms, highlightRegions } = useAtlasState();
  const reduced = useReducedMotion();

  // Auswahl → highlightRegions (nur bei Änderung schreiben, Endlosschleife vermeiden)
  useEffect(() => {
    const next = regionsForSelection(selectedSymptoms);
    if (!arraysEqual(next, highlightRegions)) {
      setState({ highlightRegions: next });
    }
  }, [selectedSymptoms, highlightRegions]);

  const selectedObjects = useMemo(
    () =>
      selectedSymptoms
        .map((id) => ALL_SYMPTOMS.find((s) => s.id === id))
        .filter((s): s is Symptom => Boolean(s)),
    [selectedSymptoms],
  );

  const arousalCounts = useMemo(() => {
    const c = { hyper: 0, hypo: 0, both: 0 };
    selectedObjects.forEach((s) => {
      c[s.arousal] += 1;
    });
    return c;
  }, [selectedObjects]);

  const arousalReading = useMemo(() => {
    const { hyper, hypo, both } = arousalCounts;
    if (selectedObjects.length === 0) return null;
    if (hypo === 0 && both === 0) return explanations.hyper;
    if (hyper === 0 && both === 0) return explanations.hypo;
    return explanations.both;
  }, [arousalCounts, selectedObjects.length]);

  const tagCounts = useMemo(() => {
    const c = { ptbs: 0, kptbs: 0, koerper: 0, beziehung: 0, selbstbild: 0 };
    selectedObjects.forEach((s) => s.tags.forEach((t) => (c[t] += 1)));
    return c;
  }, [selectedObjects]);

  const patternReading = useMemo(() => {
    if (selectedObjects.length === 0) return null;
    const readings: { title: string; body: string }[] = [];
    if (tagCounts.kptbs >= tagCounts.ptbs && tagCounts.kptbs > 0) {
      readings.push(explanations.kptbs);
    } else if (tagCounts.ptbs > 0) {
      readings.push(explanations.ptbs);
    }
    if (tagCounts.koerper > 0) readings.push(explanations.koerper);
    if (tagCounts.beziehung > 0) readings.push(explanations.beziehung);
    if (tagCounts.selbstbild > 0) readings.push(explanations.selbstbild);
    return readings;
  }, [selectedObjects.length, tagCounts]);

  const regionLabels = useMemo(
    () =>
      regionAnchors
        .filter((r) => highlightRegions.includes(r.id))
        .map((r) => r.label),
    [highlightRegions],
  );

  // Passende Übungen: Häufigkeit über die kuratierte Zuordnung zählen
  const suggestedExercises = useMemo(() => {
    const freq = new Map<string, number>();
    for (const sid of selectedSymptoms) {
      for (const [exId, symptomIds] of Object.entries(
        methodSymptomsLocal.exercises,
      )) {
        if (symptomIds.includes(sid)) {
          freq.set(exId, (freq.get(exId) ?? 0) + 1);
        }
      }
    }
    return [...freq.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([id]) => exercises.find((e) => e.id === id))
      .filter((e): e is (typeof exercises)[number] => Boolean(e));
  }, [selectedSymptoms]);

  const summaryText = useMemo(() => {
    if (selectedObjects.length === 0) {
      return "Keine Symptome ausgewählt. Wählen Sie unten Symptome aus, die Sie erkennen – es gibt kein Richtig oder Falsch.";
    }
    const parts = [
      `${selectedObjects.length} ${selectedObjects.length === 1 ? "Symptom" : "Symptome"} ausgewählt.`,
    ];
    if (regionLabels.length > 0) {
      parts.push(`Betroffene Körperregionen: ${regionLabels.join(", ")}.`);
    }
    if (arousalReading) parts.push(arousalReading.title);
    return parts.join(" ");
  }, [selectedObjects.length, regionLabels, arousalReading]);

  return (
    <div className="view-fade min-h-full pb-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <header className="pt-10 pb-8">
          <p className="font-display text-sm uppercase tracking-[0.25em] text-amber/80">
            Symptom-Navigator
          </p>
          <h1 className="font-display mt-3 text-3xl sm:text-4xl text-ink">
            Was Ihr Nervensystem gerade erzählt
          </h1>
          <p className="mt-3 max-w-2xl text-sm sm:text-base text-ink/70 leading-relaxed">
            Wählen Sie Symptome aus, die Sie in sich wiedererkennen – aus einer,
            mehreren oder allen Kategorien. Der Atlas ordnet sie behutsam:
            Erregungslage, mögliche Muster und Körperregionen, dazu passende
            Übungen. Es gibt kein „Richtig“.
          </p>
        </header>

        {/* Keine-Diagnose-Karte – prominent, bernsteine Kante */}
        <section
          aria-label="Wichtiger Hinweis"
          className="glass rounded-2xl border-l-4 border-l-amber p-5 mb-8"
        >
          <div className="flex gap-3">
            <Info className="mt-0.5 h-5 w-5 shrink-0 text-amber" aria-hidden="true" />
            <div>
              <h2 className="font-display text-lg text-amber">
                {emergencyNote.title}: Verdachtsanzeige, keine Diagnose
              </h2>
              <ul className="mt-2 space-y-1 text-sm text-ink/80 leading-relaxed">
                {emergencyNote.lines.map((line) => (
                  <li key={line} className="flex gap-2">
                    <span className="text-amber" aria-hidden="true">
                      –
                    </span>
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
          {/* ── Auswahl ─────────────────────────────── */}
          <section aria-label="Symptome auswählen">
            <Tabs defaultValue={symptomCategories[0].id}>
              <TabsList
                aria-label="Symptomkategorien"
                className="flex h-auto flex-wrap justify-start bg-white/[0.04] border border-white/10 rounded-xl p-1 gap-1"
              >
                {symptomCategories.map((cat) => {
                  const chosen = cat.symptoms.filter((s) =>
                    selectedSymptoms.includes(s.id),
                  ).length;
                  return (
                    <TabsTrigger
                      key={cat.id}
                      value={cat.id}
                      className="rounded-lg px-3 py-1.5 text-xs data-[state=active]:bg-amber-soft data-[state=active]:text-amber text-ink/70"
                    >
                      {cat.title}
                      {chosen > 0 && (
                        <span className="ml-1.5 rounded-full bg-amber/20 px-1.5 text-[10px] text-amber">
                          {chosen}
                        </span>
                      )}
                    </TabsTrigger>
                  );
                })}
              </TabsList>

              {symptomCategories.map((cat) => (
                <TabsContent key={cat.id} value={cat.id} className="mt-5">
                  <p className="text-sm text-ink/60 italic mb-4">{cat.subtitle}</p>
                  <div
                    role="group"
                    aria-label={`Symptome: ${cat.title}`}
                    className="flex flex-wrap gap-2.5"
                  >
                    {cat.symptoms.map((s, idx) => {
                      const checked = selectedSymptoms.includes(s.id);
                      return (
                        <motion.button
                          key={s.id}
                          type="button"
                          role="checkbox"
                          aria-checked={checked}
                          initial={reduced ? false : { opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={
                            reduced
                              ? { duration: 0 }
                              : { duration: 0.3, delay: idx * 0.03 }
                          }
                          onClick={() => toggleSymptom(s.id, selectedSymptoms)}
                          className={[
                            "rounded-xl border px-3.5 py-2.5 text-left text-sm transition-colors",
                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber/60",
                            checked
                              ? "bg-amber-soft border-amber/50 text-amber"
                              : "glass-soft text-ink/80 hover:border-white/20 hover:text-ink",
                          ].join(" ")}
                        >
                          <span className="flex items-start gap-2">
                            <span
                              aria-hidden="true"
                              className={[
                                "mt-0.5 inline-block h-3.5 w-3.5 shrink-0 rounded-[4px] border",
                                checked
                                  ? "border-amber bg-amber/70"
                                  : "border-ink/30",
                              ].join(" ")}
                            />
                            <span>
                              <span className="block leading-snug">{s.label}</span>
                              {s.hint && (
                                <span className="mt-0.5 block text-xs text-ink/50 leading-snug">
                                  {s.hint}
                                </span>
                              )}
                              <span className="mt-1 block text-[10px] uppercase tracking-wider text-ink/40">
                                {AROUSAL_LABEL[s.arousal]}
                              </span>
                            </span>
                          </span>
                        </motion.button>
                      );
                    })}
                  </div>
                </TabsContent>
              ))}
            </Tabs>

            <button
              type="button"
              onClick={() => setState({ selectedSymptoms: [] })}
              disabled={selectedSymptoms.length === 0}
              className="mt-6 text-xs text-ink/50 underline underline-offset-4 hover:text-ink/80 disabled:opacity-40 disabled:no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber/60 rounded"
            >
              Auswahl zurücksetzen
            </button>
          </section>

          {/* ── Lesart / Ergebnis ───────────────────── */}
          <section aria-label="Auswertung der Auswahl" className="space-y-6">
            <div aria-live="polite" className="sr-only">
              {summaryText}
            </div>

            <div className="glass rounded-2xl p-5" aria-hidden="false">
              <h2 className="font-display text-lg text-ink">Ihre Auswahl</h2>
              {selectedObjects.length === 0 ? (
                <p className="mt-2 text-sm text-ink/60 leading-relaxed">
                  Noch keine Symptome gewählt. Beginnen Sie mit dem, was am
                  ehesten zutrifft – Sie können jederzeit alles wieder abwählen.
                </p>
              ) : (
                <>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {selectedObjects.map((s) => (
                      <Badge
                        key={s.id}
                        variant="outline"
                        className="border-amber/30 bg-amber-soft text-amber"
                      >
                        {s.label}
                      </Badge>
                    ))}
                  </div>
                  <Separator className="my-4 bg-white/10" />
                  <p className="text-sm text-ink/80 leading-relaxed" aria-hidden="true">
                    {summaryText}
                  </p>
                </>
              )}
            </div>

            {arousalReading && (
              <motion.article
                initial={reduced ? false : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={reduced ? { duration: 0 } : { duration: 0.4 }}
                className="glass rounded-2xl p-5"
              >
                <h2 className="font-display text-lg text-ink flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-ventral" aria-hidden="true" />
                  {arousalReading.title}
                </h2>
                <p className="mt-2 text-sm text-ink/75 leading-relaxed">
                  {arousalReading.body}
                </p>
              </motion.article>
            )}

            {patternReading && patternReading.length > 0 && (
              <div className="glass rounded-2xl p-5">
                <h2 className="font-display text-lg text-ink">
                  Mögliche Muster – behutsam gelesen
                </h2>
                <p className="mt-1 text-xs text-ink/50">
                  Verdachtsanzeige, keine Diagnose. Nur Fachkräfte können das nach
                  einem ausführlichen Gespräch beurteilen.
                </p>
                <div className="mt-4 space-y-4">
                  {patternReading.map((r) => (
                    <div key={r.title}>
                      <h3 className="text-sm font-medium text-amber">{r.title}</h3>
                      <p className="mt-1 text-sm text-ink/75 leading-relaxed">
                        {r.body}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {regionLabels.length > 0 && (
              <div className="glass-soft rounded-2xl p-5">
                <h2 className="font-display text-base text-ink flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-frost" aria-hidden="true" />
                  Betroffene Körperregionen
                </h2>
                <ul className="mt-3 flex flex-wrap gap-2">
                  {regionLabels.map((label) => (
                    <li
                      key={label}
                      className="rounded-full border border-frost/30 bg-dorsal-soft px-3 py-1 text-xs text-frost"
                    >
                      {label}
                    </li>
                  ))}
                </ul>
                <p className="mt-3 text-xs text-ink/50 leading-relaxed">
                  Diese Regionen leuchten im 3D-Körpermodell auf – dort spürt
                  Ihr Nervensystem die Belastung zuerst.
                </p>
              </div>
            )}

            {suggestedExercises.length > 0 && (
              <div className="glass rounded-2xl p-5">
                <h2 className="font-display text-lg text-ink">
                  Übungen, die zu dieser Auswahl passen
                </h2>
                <p className="mt-1 text-xs text-ink/50">
                  Kuratiert nach Häufigkeit der Zuordnung – beginnen Sie mit der
                  ersten, die sich gut anfühlt, nicht mit der „richtigen“.
                </p>
                <Accordion type="single" collapsible className="mt-4">
                  {suggestedExercises.map((ex) => (
                    <AccordionItem
                      key={ex.id}
                      value={ex.id}
                      className="border-white/10"
                    >
                      <AccordionTrigger className="text-left text-sm text-ink hover:text-amber hover:no-underline">
                        <span className="flex flex-wrap items-center gap-2">
                          {ex.title}
                          <span className="rounded-full bg-white/[0.06] border border-white/10 px-2 py-0.5 text-[10px] text-ink/60">
                            {ex.minutes}
                          </span>
                          <span className="rounded-full bg-ventral-soft border border-ventral/30 px-2 py-0.5 text-[10px] text-ventral">
                            {ex.effectLabel}
                          </span>
                        </span>
                      </AccordionTrigger>
                      <AccordionContent>
                        <p className="text-sm text-ink/70 leading-relaxed">
                          {ex.when}
                        </p>
                        <ol className="mt-3 space-y-2">
                          {ex.steps.map((step, i) => (
                            <li
                              key={i}
                              className="flex gap-2.5 text-sm text-ink/80 leading-relaxed"
                            >
                              <span
                                className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber/15 text-[11px] text-amber"
                                aria-hidden="true"
                              >
                                {i + 1}
                              </span>
                              <span>{step}</span>
                            </li>
                          ))}
                        </ol>
                        {ex.note && (
                          <p className="mt-3 text-xs text-ventral/90 leading-relaxed border-l-2 border-ventral/40 pl-3">
                            {ex.note}
                          </p>
                        )}
                        {ex.caution && (
                          <p className="mt-2 text-xs text-amber/90 leading-relaxed border-l-2 border-amber/40 pl-3">
                            Achtung: {ex.caution}
                          </p>
                        )}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
