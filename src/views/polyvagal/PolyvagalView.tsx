import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import Disclaimer from "@/components/Disclaimer";
import SectionHeading from "@/components/SectionHeading";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { methods } from "@/data/methods";
import { nervousStates } from "@/data/nervous";
import type { NervousStateId } from "@/data/nervous";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { setState } from "@/state/atlas-store";
import ExerciseAccordion from "./ExerciseAccordion";

/** Szenen-Anker: Der gewählte Zustand treibt die 3D-Regionen (arousal -1..1). */
const AROUSAL_BY_STATE: Record<NervousStateId, number> = {
  ventral: 0,
  sympathikus: 0.7,
  dorsal: -0.7,
};

function firstSentence(text: string): string {
  const cut = text.indexOf(". ");
  return cut === -1 ? text : text.slice(0, cut + 1);
}

/** Die drei Zustände des autonomen Nervensystems nach dem Polyvagal-Konzept. */
export default function PolyvagalView() {
  const reduced = useReducedMotion();
  const [selectedId, setSelectedId] = useState<NervousStateId>("ventral");
  const selected =
    nervousStates.find((s) => s.id === selectedId) ?? nervousStates[0];

  const selectState = (id: string) => {
    const next = id as NervousStateId;
    setSelectedId(next);
    setState({ arousal: AROUSAL_BY_STATE[next] });
  };

  const card = (
    <div
      className="glass overflow-hidden rounded-2xl"
      style={{ borderColor: selected.color, borderLeftWidth: 3 }}
    >
      <div className="p-6 sm:p-8" style={{ backgroundColor: selected.soft }}>
        <div className="flex flex-wrap items-center gap-3">
          <h3 className="font-display text-2xl leading-snug text-ink sm:text-3xl">
            {selected.name}
          </h3>
          <Badge
            variant="outline"
            className="border-current text-[11px]"
            style={{ color: selected.color, borderColor: selected.color }}
          >
            {selected.short}
          </Badge>
        </div>
        <p className="mt-4 max-w-3xl text-sm leading-relaxed text-ink/75">
          {selected.description}
        </p>
        <p className="mt-3 text-sm italic leading-relaxed text-ink/60">
          Fühlt sich an wie: {selected.feelsLike}
        </p>
      </div>

      <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-2">
        <section aria-labelledby={`pv-signals-${selected.id}`}>
          <h4
            id={`pv-signals-${selected.id}`}
            className="text-xs font-medium uppercase tracking-[0.22em] text-ink/50"
          >
            Körpersignale
          </h4>
          <ul className="mt-3 space-y-2">
            {selected.bodySignals.map((signal) => (
              <li key={signal} className="flex items-start gap-2.5 text-sm text-ink/75">
                <span
                  aria-hidden="true"
                  className="mt-[7px] size-1.5 shrink-0 rounded-full"
                  style={{ backgroundColor: selected.color }}
                />
                {signal}
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby={`pv-exercises-${selected.id}`}>
          <h4
            id={`pv-exercises-${selected.id}`}
            className="text-xs font-medium uppercase tracking-[0.22em] text-ink/50"
          >
            Übungen für diesen Zustand
          </h4>
          <div className="mt-1">
            <ExerciseAccordion ids={selected.exercises} />
          </div>
        </section>
      </div>

      <section
        aria-labelledby={`pv-methods-${selected.id}`}
        className="border-t border-white/[0.07] p-6 sm:p-8"
      >
        <h4
          id={`pv-methods-${selected.id}`}
          className="text-xs font-medium uppercase tracking-[0.22em] text-ink/50"
        >
          Verfahren, die hier ansetzen
        </h4>
        <ul className="mt-4 grid gap-3 lg:grid-cols-2">
          {selected.methods.map((methodId) => {
            const method = methods.find((m) => m.id === methodId);
            if (!method) return null;
            return (
              <li key={method.id} className="glass-soft rounded-xl px-4 py-3">
                <p className="text-sm font-medium text-ink">{method.name}</p>
                <p className="mt-1 text-xs leading-relaxed text-ink/55">
                  {firstSentence(method.what)}
                </p>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-8 sm:px-8 sm:py-10">
      <SectionHeading
        eyebrow="Polyvagal-Konzept"
        title="Drei Zustände eines Nervensystems, das Sicherheit sucht"
        lead="Nach Stephen Porges wechselt das autonome Nervensystem zwischen drei Ebenen – nicht willentlich, sondern über eine stille, unbewusste Gefahlenprüfung („Neurozeption“). Kein Zustand ist falsch: Jeder war einmal eine Überlebensstrategie."
      />

      <Tabs value={selectedId} onValueChange={selectState} className="w-full">
        <TabsList
          aria-label="Nervensystem-Zustand wählen"
          className="grid h-auto w-full grid-cols-1 gap-1 sm:grid-cols-3"
        >
          {nervousStates.map((s) => (
            <TabsTrigger
              key={s.id}
              value={s.id}
              className="flex-col items-start gap-0.5 rounded-md px-3 py-2.5 text-left data-[state=active]:bg-white/[0.07]"
            >
              <span className="flex w-full items-center gap-2 text-sm font-medium">
                <span
                  aria-hidden="true"
                  className="size-2 shrink-0 rounded-full"
                  style={{ backgroundColor: s.color }}
                />
                {s.name}
              </span>
              <span className="pl-4 text-[11px] text-ink/50">{s.short}</span>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {reduced ? (
        <div key={selected.id}>{card}</div>
      ) : (
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={selected.id}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -14 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            {card}
          </motion.div>
        </AnimatePresence>
      )}

      <Disclaimer className="max-w-2xl" />
    </div>
  );
}
