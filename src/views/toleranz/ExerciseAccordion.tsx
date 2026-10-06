import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { exercises } from "@/data/exercises";
import type { Exercise } from "@/data/exercises";

interface ExerciseAccordionProps {
  /** exercise-ids (Reihenfolge wird übernommen) */
  ids: string[];
}

/** Kompakte, aufklappbare Übungsliste mit Wirkung, Dauer und Schritten. */
export default function ExerciseAccordion({ ids }: ExerciseAccordionProps) {
  const byId = new Map<string, Exercise>(exercises.map((e) => [e.id, e]));
  const items = ids
    .map((id) => byId.get(id))
    .filter((e): e is Exercise => e !== undefined);

  if (items.length === 0) return null;

  return (
    <Accordion type="single" collapsible className="w-full">
      {items.map((ex) => (
        <AccordionItem key={ex.id} value={ex.id} className="border-white/10">
          <AccordionTrigger className="py-4 text-left text-sm hover:no-underline">
            <span className="flex min-w-0 flex-col gap-1.5">
              <span className="font-medium text-ink">{ex.title}</span>
              <span className="flex flex-wrap items-center gap-2 text-xs text-ink/50">
                <Badge variant="outline" className="border-white/15 text-[10px] text-ink/60">
                  {ex.effectLabel}
                </Badge>
                <span>{ex.minutes}</span>
              </span>
            </span>
          </AccordionTrigger>
          <AccordionContent className="text-sm leading-relaxed text-ink/70">
            <p className="text-xs leading-relaxed text-ink/55">{ex.when}</p>
            <ol className="mt-3 list-decimal space-y-1.5 pl-5 marker:text-amber/70">
              {ex.steps.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ol>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
