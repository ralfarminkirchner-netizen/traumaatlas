// RegionPanel: Fokus-Panel (.glass) mit Belastungs-Texten, Signalen und
// aufklappbaren Übungen. Enthält zusätzlich eine per Tastatur erreichbare
// Regionenliste (sr-only, wird beim Fokus sichtbar) – die 3D-Embleme selbst
// sind nur per Maus/Touch erreichbar.

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { regionAnchors } from "@/data/body3d";
import { bodyRegions } from "@/data/nervous";
import { exercises } from "@/data/exercises";
import { setState, useAtlasState } from "@/state/atlas-store";

const LOAD_SECTIONS = [
  { key: "loadHyper" as const, label: "Hyperarousal · Sympathikus", chip: "#e2a35c" },
  { key: "loadHypo" as const, label: "Hypoarousal · dorsaler Vagus", chip: "#8b93c9" },
  { key: "loadVentral" as const, label: "Ventral · Sicherheit", chip: "#7fb8a4" },
];

/** Tastatur-zugängliche Regionenauswahl (unsichtbar, bei Fokus sichtbar) */
function RegionQuickNav() {
  return (
    <nav
      aria-label="Körperregionen"
      className="sr-only focus-within:not-sr-only focus-within:absolute focus-within:bottom-4 focus-within:left-4 focus-within:z-30 focus-within:rounded-xl focus-within:border focus-within:border-white/10 focus-within:bg-white/[0.045] focus-within:p-3 focus-within:backdrop-blur-xl"
    >
      <ul className="flex flex-wrap gap-2">
        {regionAnchors.map((anchor) => (
          <li key={anchor.id}>
            <button
              type="button"
              className="rounded-md border border-white/15 px-3 py-1.5 text-sm text-ink hover:border-amber/60"
              onClick={() => setState({ focusRegion: anchor.id })}
            >
              {anchor.label}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export default function RegionPanel() {
  const { focusRegion } = useAtlasState();
  const anchor = regionAnchors.find((r) => r.id === focusRegion) ?? null;
  const region = anchor ? bodyRegions.find((r) => r.id === anchor.id) : null;
  const regionExercises = anchor
    ? anchor.exercises
        .map((id) => exercises.find((ex) => ex.id === id))
        .filter((ex) => ex !== undefined)
    : [];

  return (
    <>
      <RegionQuickNav />
      <AnimatePresence>
        {anchor && region && (
          <motion.aside
            key={anchor.id}
            role="dialog"
            aria-label={`Region ${anchor.label}`}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
            className="glass absolute bottom-4 right-4 z-20 w-[min(22rem,calc(100%-2rem))] max-h-[70%] overflow-y-auto scrollbar-thin rounded-2xl p-5 text-ink"
          >
            <div className="flex items-start justify-between gap-3">
              <h3 className="font-display text-xl">{anchor.label}</h3>
              <button
                type="button"
                aria-label="Region schließen"
                onClick={() => setState({ focusRegion: null })}
                className="rounded-md p-1.5 text-ink/60 transition-colors hover:text-ink focus-visible:outline-amber"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </div>

            {/* Belastungs-Profile */}
            <div className="mt-4 space-y-3">
              {LOAD_SECTIONS.map((section) => (
                <section key={section.key} className="glass-soft rounded-xl p-3">
                  <p className="flex items-center gap-2 text-[0.68rem] uppercase tracking-[0.14em] text-ink/55">
                    <span
                      aria-hidden
                      className="inline-block h-2 w-2 rounded-full"
                      style={{ backgroundColor: section.chip }}
                    />
                    {section.label}
                  </p>
                  <p className="mt-1.5 text-sm leading-relaxed text-ink/85">{anchor[section.key]}</p>
                </section>
              ))}
            </div>

            {/* Signale */}
            <section className="mt-4">
              <h4 className="text-[0.68rem] uppercase tracking-[0.14em] text-ink/55">Körpersignale</h4>
              <ul className="mt-1.5 list-inside list-disc space-y-1 text-sm text-ink/85">
                {region.signals.map((signal) => (
                  <li key={signal}>{signal}</li>
                ))}
              </ul>
            </section>

            {/* Übungen */}
            {regionExercises.length > 0 && (
              <section className="mt-4">
                <h4 className="text-[0.68rem] uppercase tracking-[0.14em] text-ink/55">Passende Übungen</h4>
                <Accordion type="single" collapsible className="mt-1">
                  {regionExercises.map((ex) => (
                    <AccordionItem key={ex.id} value={ex.id} className="border-white/10">
                      <AccordionTrigger className="text-sm text-ink hover:no-underline hover:text-amber">
                        {ex.title}
                      </AccordionTrigger>
                      <AccordionContent className="text-sm text-ink/80">
                        <p className="text-ink/60">{ex.when}</p>
                        <ol className="mt-2 list-inside list-decimal space-y-1.5">
                          {ex.steps.map((step, i) => (
                            <li key={i}>{step}</li>
                          ))}
                        </ol>
                        <p className="mt-2">
                          <span className="text-ventral">Wirkung:</span> {ex.goal}
                        </p>
                        <p className="mt-1 text-ink/55">
                          Dauer: {ex.minutes} · {ex.effectLabel}
                        </p>
                        {ex.caution && (
                          <p className="mt-2 rounded-md border border-dorsal/40 bg-dorsal/10 p-2 text-xs text-ink/75">
                            Achtung: {ex.caution}
                          </p>
                        )}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </section>
            )}
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}
