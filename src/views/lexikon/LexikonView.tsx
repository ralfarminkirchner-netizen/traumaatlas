// Übungs-Lexikon: alle Übungen aus exercises.ts als Karten-Raster mit Suche,
// Filter und Detail-Dialog. Sanfte 3D-Flip-Anmutung via framer-motion (reduced-motion aus).

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Clock, Search, X } from "lucide-react";

import { exercises, type Exercise, type ExerciseEffect } from "@/data/exercises";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const EFFECT_STYLE: Record<
  ExerciseEffect,
  { badge: string; dot: string; label: string }
> = {
  hyper: {
    badge: "border-amber/30 bg-amber-soft text-amber",
    dot: "bg-amber",
    label: "Beruhigt Übererregung",
  },
  hypo: {
    badge: "border-dorsal/40 bg-dorsal-soft text-dorsal",
    dot: "bg-dorsal",
    label: "Aktiviert bei Untererregung",
  },
  both: {
    badge: "border-ventral/30 bg-ventral-soft text-ventral",
    dot: "bg-ventral",
    label: "Gleicht aus",
  },
};

export default function LexikonView() {
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const reduced = useReducedMotion();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return exercises;
    return exercises.filter((e) => e.title.toLowerCase().includes(q));
  }, [query]);

  const openExercise: Exercise | undefined = exercises.find(
    (e) => e.id === openId,
  );

  return (
    <div className="view-fade min-h-full pb-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <header className="pt-10 pb-8">
          <p className="font-display text-sm uppercase tracking-[0.25em] text-amber/80">
            Übungs-Lexikon
          </p>
          <h1 className="font-display mt-3 text-3xl sm:text-4xl text-ink">
            Werkzeuge für Ihr Nervensystem
          </h1>
          <p className="mt-3 max-w-2xl text-sm sm:text-base text-ink/70 leading-relaxed">
            {exercises.length} Übungen – von der schnellen Hilfe in der Krise
            bis zum täglichen Ritual. Keine Übung ist Pflicht: Probieren Sie
            sanft, lassen Sie liegen, was nicht passt.
          </p>
        </header>

        <div className="relative mb-8 max-w-md">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40"
            aria-hidden="true"
          />
          <Input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Übung suchen …"
            aria-label="Übung nach Titel suchen"
            className="glass-soft rounded-xl border-white/10 pl-9 text-ink placeholder:text-ink/40 focus-visible:ring-amber/50"
          />
        </div>

        <p aria-live="polite" className="sr-only">
          {filtered.length === exercises.length
            ? `${filtered.length} Übungen werden angezeigt.`
            : `${filtered.length} von ${exercises.length} Übungen passen zur Suche.`}
        </p>

        {filtered.length === 0 ? (
          <div className="glass-soft rounded-2xl p-8 text-center">
            <p className="text-sm text-ink/60">
              Keine Übung passt zu „{query}“. Vielleicht ein anderes Wort
              versuchen – oder direkt die Liste durchsehen.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setQuery("")}
              className="mt-4 border-white/15 text-ink/70 hover:text-ink hover:bg-white/[0.06]"
            >
              Suche zurücksetzen
            </Button>
          </div>
        ) : (
          <ul
            role="list"
            className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
            aria-label="Übungen"
          >
            {filtered.map((ex, idx) => {
              const style = EFFECT_STYLE[ex.effect];
              return (
                <li key={ex.id}>
                  <motion.button
                    type="button"
                    onClick={() => setOpenId(ex.id)}
                    aria-haspopup="dialog"
                    aria-label={`${ex.title} im Detail öffnen`}
                    initial={reduced ? false : { opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={
                      reduced ? undefined : { rotateY: 5, scale: 1.015 }
                    }
                    transition={
                      reduced
                        ? { duration: 0 }
                        : { duration: 0.5, delay: idx * 0.04 }
                    }
                    style={{ transformPerspective: 900, transformStyle: "preserve-3d" }}
                    className={[
                      "glass group h-full w-full rounded-2xl p-5 text-left transition-colors",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber/60",
                      "hover:border-amber/30",
                    ].join(" ")}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <h2 className="font-display text-lg leading-snug text-ink group-hover:text-amber transition-colors">
                        {ex.title}
                      </h2>
                      <Badge
                        variant="outline"
                        className={`shrink-0 ${style.badge}`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${style.dot}`}
                          aria-hidden="true"
                        />
                        {style.label}
                      </Badge>
                    </div>
                    <p className="mt-2 line-clamp-3 text-sm text-ink/65 leading-relaxed">
                      {ex.when}
                    </p>
                    <div className="mt-4 flex items-center gap-3 text-xs text-ink/50">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                        {ex.minutes}
                      </span>
                      <span className="rounded-full bg-white/[0.05] border border-white/10 px-2 py-0.5">
                        {ex.context}
                      </span>
                    </div>
                  </motion.button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Detail-Dialog mit Flip-Einstieg */}
      <AnimatePresence>
        {openExercise && (
          <Dialog
            open
            onOpenChange={(open) => {
              if (!open) setOpenId(null);
            }}
          >
            <DialogContent
              className="glass max-w-2xl rounded-2xl border-white/10 text-ink sm:max-h-[85vh] overflow-y-auto scrollbar-thin"
              aria-describedby="lexikon-detail-desc"
            >
              <motion.div
                initial={reduced ? false : { rotateY: 35, opacity: 0 }}
                animate={{ rotateY: 0, opacity: 1 }}
                exit={reduced ? undefined : { rotateY: 25, opacity: 0 }}
                transition={
                  reduced
                    ? { duration: 0 }
                    : { duration: 0.5, ease: [0.22, 1, 0.36, 1] }
                }
                style={{ transformPerspective: 1200 }}
              >
                <DialogHeader>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge
                      variant="outline"
                      className={EFFECT_STYLE[openExercise.effect].badge}
                    >
                      {openExercise.effectLabel}
                    </Badge>
                    <Badge
                      variant="outline"
                      className="border-white/15 bg-white/[0.05] text-ink/60"
                    >
                      <Clock className="h-3 w-3" aria-hidden="true" />
                      {openExercise.minutes}
                    </Badge>
                    <Badge
                      variant="outline"
                      className="border-white/15 bg-white/[0.05] text-ink/60"
                    >
                      Kontext: {openExercise.context}
                    </Badge>
                  </div>
                  <DialogTitle className="font-display text-2xl text-ink mt-2">
                    {openExercise.title}
                  </DialogTitle>
                  <DialogDescription
                    id="lexikon-detail-desc"
                    className="text-sm text-ink/70 leading-relaxed"
                  >
                    {openExercise.when}
                  </DialogDescription>
                </DialogHeader>

                <div className="mt-6 space-y-6">
                  <section aria-label="Wirkung">
                    <h3 className="font-display text-sm uppercase tracking-[0.2em] text-amber/80">
                      Was es bewirkt
                    </h3>
                    <p className="mt-2 text-sm text-ink/80 leading-relaxed">
                      {openExercise.goal}
                    </p>
                  </section>

                  <section aria-label="Schritte">
                    <h3 className="font-display text-sm uppercase tracking-[0.2em] text-amber/80">
                      Schritt für Schritt
                    </h3>
                    <ol className="mt-3 space-y-3">
                      {openExercise.steps.map((step, i) => (
                        <li
                          key={i}
                          className="flex gap-3 text-sm text-ink/85 leading-relaxed"
                        >
                          <span
                            className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber/15 text-xs text-amber"
                            aria-hidden="true"
                          >
                            {i + 1}
                          </span>
                          <span>{step}</span>
                        </li>
                      ))}
                    </ol>
                  </section>

                  {openExercise.note && (
                    <p className="rounded-xl border-l-2 border-ventral/50 bg-ventral-soft p-4 text-sm text-ventral/95 leading-relaxed">
                      {openExercise.note}
                    </p>
                  )}
                  {openExercise.caution && (
                    <p className="rounded-xl border-l-2 border-amber/50 bg-amber-soft p-4 text-sm text-amber/95 leading-relaxed">
                      Achtung: {openExercise.caution}
                    </p>
                  )}

                  <div className="flex justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setOpenId(null)}
                      aria-label="Detail schließen"
                      className="border-white/15 text-ink/70 hover:text-ink hover:bg-white/[0.06]"
                    >
                      <X className="mr-1.5 h-4 w-4" aria-hidden="true" />
                      Schließen
                    </Button>
                  </div>
                </div>
              </motion.div>
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>
    </div>
  );
}
