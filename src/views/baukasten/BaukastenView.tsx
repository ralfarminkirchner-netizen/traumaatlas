// Programm-Baukasten: Bausteine + Übungen + Verfahren per Drag & Drop (oder Klick)
// auf drei Phasen verteilen. Persistiert in localStorage ("traumaatlas-program"),
// Export als JSON-Download und in die Zwischenablage.

import { useEffect, useMemo, useState } from "react";
import {
  ClipboardCopy,
  Download,
  GripVertical,
  Plus,
  RotateCcw,
  Search,
  Trash2,
} from "lucide-react";

import {
  buildingBlocks,
  blockCategoryLabels,
  type BlockCategory,
} from "@/data/blocks";
import { exercises } from "@/data/exercises";
import { methods, focusLabels, type MethodFocus } from "@/data/methods";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// ── Modell ───────────────────────────────────────────────────
export const PROGRAM_KEY = "traumaatlas-program";

type PhaseId = "stabilisierung" | "konfrontation" | "integration";
type ItemType = "block" | "exercise" | "method";

interface PoolItem {
  id: string;
  type: ItemType;
  title: string;
  subtitle: string;
  meta: string;
  /** bevorzugte Phase (bei Verfahren aus methods.phases, sonst eigene Zuordnung) */
  suggestedPhase: PhaseId;
}

type Program = Record<PhaseId, string[]>;

const PHASES: {
  id: PhaseId;
  label: string;
  subtitle: string;
  color: string;
  hint: string;
}[] = [
  {
    id: "stabilisierung",
    label: "Phase 1 · Stabilisierung",
    subtitle: "Sicherheit zuerst",
    color: "#7fb8a4",
    hint: "Regulation, Ressourcen, Alltag – die Grundlage, bevor Erinnerungen berührt werden.",
  },
  {
    id: "konfrontation",
    label: "Phase 2 · Verarbeitung",
    subtitle: "Dosiert, mit Rückzugsort",
    color: "#e2a35c",
    hint: "Verfahren und Übungen, die das Unverarbeitete dosiert bearbeiten – ideal in Begleitung.",
  },
  {
    id: "integration",
    label: "Phase 3 · Integration",
    subtitle: "Das Leben danach",
    color: "#c9a0a8",
    hint: "Verankern, was geholfen hat: Beziehung, Sinn, Selbstwert, Alltag.",
  },
];

function suggestedPhaseForExercise(id: string): PhaseId {
  if (id === "sicherer-ort" || id === "pendeln" || id === "koerperscan") {
    return "stabilisierung";
  }
  return "integration";
}

const POOL: PoolItem[] = [
  ...buildingBlocks.map((b) => ({
    id: b.id,
    type: "block" as const,
    title: b.title,
    subtitle: blockCategoryLabels[b.category as BlockCategory] ?? b.category,
    meta: `${b.minutes} · ${b.frequency}`,
    suggestedPhase: "stabilisierung" as PhaseId,
  })),
  ...exercises.map((e) => ({
    id: e.id,
    type: "exercise" as const,
    title: e.title,
    subtitle: e.effectLabel,
    meta: `${e.minutes} · ${e.context}`,
    suggestedPhase: suggestedPhaseForExercise(e.id),
  })),
  ...methods.map((m) => ({
    id: m.id,
    type: "method" as const,
    title: m.name,
    subtitle: m.focusShort,
    meta: `${focusLabels[m.focus[0] as MethodFocus] ?? m.focus[0]} · seit ${m.year}`,
    suggestedPhase: (m.phases[0] ?? "stabilisierung") as PhaseId,
  })),
];

const POOL_BY_ID = new Map(POOL.map((p) => [p.id, p]));

const TYPE_LABEL: Record<ItemType, string> = {
  block: "Alltagsbaustein",
  exercise: "Übung",
  method: "Verfahren",
};

const TYPE_STYLE: Record<ItemType, string> = {
  block: "border-frost/30 bg-dorsal-soft text-frost",
  exercise: "border-ventral/30 bg-ventral-soft text-ventral",
  method: "border-amber/30 bg-amber-soft text-amber",
};

const EMPTY_PROGRAM: Program = {
  stabilisierung: [],
  konfrontation: [],
  integration: [],
};

function loadProgram(): Program {
  try {
    const raw = localStorage.getItem(PROGRAM_KEY);
    if (!raw) return EMPTY_PROGRAM;
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return EMPTY_PROGRAM;
    const out: Program = { ...EMPTY_PROGRAM };
    for (const phase of PHASES) {
      const value = (parsed as Record<string, unknown>)[phase.id];
      if (Array.isArray(value)) {
        out[phase.id] = value.filter(
          (v): v is string => typeof v === "string" && POOL_BY_ID.has(v),
        );
      }
    }
    // Duplikate entfernen (jedes Element nur 1×)
    const seen = new Set<string>();
    for (const phase of PHASES) {
      out[phase.id] = out[phase.id].filter((id) => {
        if (seen.has(id)) return false;
        seen.add(id);
        return true;
      });
    }
    return out;
  } catch {
    return EMPTY_PROGRAM;
  }
}

function programToJson(program: Program): string {
  return JSON.stringify(
    {
      app: "TRAUMAATLAS",
      version: 1,
      savedAt: new Date().toISOString(),
      program,
    },
    null,
    2,
  );
}

export default function BaukastenView() {
  const [program, setProgram] = useState<Program>(loadProgram);
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | ItemType>("all");
  const [notice, setNotice] = useState<string | null>(null);

  // Persistieren
  useEffect(() => {
    try {
      localStorage.setItem(PROGRAM_KEY, JSON.stringify(program));
    } catch {
      // Speicher voll / privat – still ignorieren
    }
  }, [program]);

  useEffect(() => {
    if (!notice) return;
    const t = window.setTimeout(() => setNotice(null), 4000);
    return () => window.clearTimeout(t);
  }, [notice]);

  const usedIds = useMemo(() => {
    const s = new Set<string>();
    PHASES.forEach((p) => program[p.id].forEach((id) => s.add(id)));
    return s;
  }, [program]);

  const filteredPool = useMemo(() => {
    const q = query.trim().toLowerCase();
    return POOL.filter((item) => {
      if (typeFilter !== "all" && item.type !== typeFilter) return false;
      if (!q) return true;
      return (
        item.title.toLowerCase().includes(q) ||
        item.subtitle.toLowerCase().includes(q)
      );
    });
  }, [query, typeFilter]);

  const totalCount = PHASES.reduce((n, p) => n + program[p.id].length, 0);

  function addToPhase(phase: PhaseId, id: string) {
    if (usedIds.has(id)) return;
    setProgram((prev) => ({
      ...prev,
      [phase]: [...prev[phase], id],
    }));
  }

  function removeFromPhase(phase: PhaseId, id: string) {
    setProgram((prev) => ({
      ...prev,
      [phase]: prev[phase].filter((x) => x !== id),
    }));
  }

  function resetProgram() {
    setProgram(EMPTY_PROGRAM);
    setNotice("Programm wurde geleert.");
  }

  function exportJson() {
    const blob = new Blob([programToJson(program)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "traumaatlas-programm.json";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    setNotice("JSON wurde heruntergeladen.");
  }

  async function copyToClipboard() {
    const text = programToJson(program);
    try {
      await navigator.clipboard.writeText(text);
      setNotice("Programm in die Zwischenablage kopiert.");
    } catch {
      // Fallback für ältere Kontexte
      try {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.setAttribute("readonly", "true");
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        ta.remove();
        setNotice("Programm in die Zwischenablage kopiert.");
      } catch {
        setNotice("Kopieren nicht möglich – bitte Export verwenden.");
      }
    }
  }

  return (
    <div className="view-fade min-h-full pb-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <header className="pt-10 pb-8">
          <p className="font-display text-sm uppercase tracking-[0.25em] text-amber/80">
            Programm-Baukasten
          </p>
          <h1 className="font-display mt-3 text-3xl sm:text-4xl text-ink">
            Ihr persönlicher Regelplan
          </h1>
          <p className="mt-3 max-w-2xl text-sm sm:text-base text-ink/70 leading-relaxed">
            Ziehen Sie Bausteine, Übungen und Verfahren in die drei Phasen –
            oder klicken Sie auf „+“. Das Programm wird automatisch auf diesem
            Gerät gespeichert. Wenige, zuverlässige Elemente wirken besser als
            viele Pflichten.
          </p>
        </header>

        {/* Pool */}
        <section aria-label="Elemente-Pool" className="glass rounded-2xl p-5">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="font-display text-lg text-ink">Pool</h2>
            <span className="text-xs text-ink/50">
              {POOL.length} Elemente · {usedIds.size} bereits eingeplant
            </span>
            <div className="ml-auto flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search
                  className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink/40"
                  aria-hidden="true"
                />
                <Input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Suchen …"
                  aria-label="Pool durchsuchen"
                  className="glass-soft h-9 w-44 rounded-lg border-white/10 pl-8 text-xs text-ink placeholder:text-ink/40 focus-visible:ring-amber/50"
                />
              </div>
              <Select
                value={typeFilter}
                onValueChange={(v) => setTypeFilter(v as "all" | ItemType)}
                aria-label="Nach Typ filtern"
              >
                <SelectTrigger className="glass-soft h-9 w-40 rounded-lg border-white/10 text-xs text-ink/70 focus:ring-amber/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-white/10 bg-coal text-ink">
                  <SelectItem value="all" className="text-xs focus:bg-amber-soft focus:text-amber">
                    Alle Typen
                  </SelectItem>
                  <SelectItem value="block" className="text-xs focus:bg-amber-soft focus:text-amber">
                    Alltagsbausteine
                  </SelectItem>
                  <SelectItem value="exercise" className="text-xs focus:bg-amber-soft focus:text-amber">
                    Übungen
                  </SelectItem>
                  <SelectItem value="method" className="text-xs focus:bg-amber-soft focus:text-amber">
                    Verfahren
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <ul
            role="list"
            aria-label="Verfügbare Elemente"
            className="mt-4 grid max-h-72 gap-2.5 overflow-y-auto scrollbar-thin pr-1 sm:grid-cols-2 lg:grid-cols-3"
          >
            {filteredPool.map((item) => {
              const used = usedIds.has(item.id);
              return (
                <li
                  key={item.id}
                  draggable={!used}
                  onDragStart={(e) => {
                    e.dataTransfer.setData("text/plain", item.id);
                    e.dataTransfer.effectAllowed = "move";
                  }}
                  className={[
                    "glass-soft flex items-center gap-2.5 rounded-xl border p-3 transition-opacity",
                    used ? "opacity-35" : "hover:border-white/20",
                  ].join(" ")}
                >
                  <GripVertical
                    className="h-4 w-4 shrink-0 text-ink/30"
                    aria-hidden="true"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-ink">{item.title}</p>
                    <p className="truncate text-[11px] text-ink/50">
                      <Badge
                        variant="outline"
                        className={`mr-1.5 px-1.5 py-0 text-[9px] ${TYPE_STYLE[item.type]}`}
                      >
                        {TYPE_LABEL[item.type]}
                      </Badge>
                      {item.subtitle} · {item.meta}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => addToPhase(item.suggestedPhase, item.id)}
                    disabled={used}
                    aria-label={
                      used
                        ? `${item.title} ist bereits eingeplant`
                        : `${item.title} der ${PHASES.find((p) => p.id === item.suggestedPhase)?.label ?? "Phase"} hinzufügen`
                    }
                    className="rounded-lg p-1.5 text-ink/60 hover:bg-amber-soft hover:text-amber focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber/60 disabled:pointer-events-none"
                  >
                    <Plus className="h-4 w-4" aria-hidden="true" />
                  </button>
                </li>
              );
            })}
            {filteredPool.length === 0 && (
              <li className="col-span-full py-6 text-center text-sm text-ink/50">
                Nichts gefunden – Filter oder Suche zurücknehmen.
              </li>
            )}
          </ul>
        </section>

        {/* Phasen */}
        <div
          className="mt-6 grid gap-5 lg:grid-cols-3"
          role="list"
          aria-label="Phasen des Programms"
        >
          {PHASES.map((phase) => {
            const ids = program[phase.id];
            return (
              <section
                key={phase.id}
                role="listitem"
                aria-label={phase.label}
                className="glass rounded-2xl p-4 flex flex-col min-h-[280px]"
                onDragOver={(e) => {
                  if (e.dataTransfer.types.includes("text/plain")) {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = "move";
                  }
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  const id = e.dataTransfer.getData("text/plain");
                  if (POOL_BY_ID.has(id)) addToPhase(phase.id, id);
                }}
              >
                <header
                  className="rounded-xl px-3 py-2"
                  style={{ backgroundColor: `${phase.color}14` }}
                >
                  <h2
                    className="font-display text-base"
                    style={{ color: phase.color }}
                  >
                    {phase.label}
                  </h2>
                  <p className="text-[11px] text-ink/55">
                    {phase.subtitle} · {ids.length}{" "}
                    {ids.length === 1 ? "Element" : "Elemente"}
                  </p>
                </header>
                <p className="mt-2 text-[11px] leading-snug text-ink/45">
                  {phase.hint}
                </p>

                <ul role="list" className="mt-3 flex-1 space-y-2">
                  {ids.map((id) => {
                    const item = POOL_BY_ID.get(id);
                    if (!item) return null;
                    return (
                      <li
                        key={id}
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData("text/plain", id);
                          e.dataTransfer.effectAllowed = "move";
                        }}
                        className="glass-soft group flex items-center gap-2 rounded-lg border border-white/[0.08] px-2.5 py-2"
                      >
                        <GripVertical
                          className="h-3.5 w-3.5 shrink-0 text-ink/25"
                          aria-hidden="true"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs text-ink">
                            {item.title}
                          </p>
                          <p className="text-[10px] text-ink/45">
                            {TYPE_LABEL[item.type]} · {item.meta}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFromPhase(phase.id, id)}
                          aria-label={`${item.title} aus ${phase.label} entfernen`}
                          className="rounded p-1 text-ink/40 opacity-0 transition-opacity hover:text-amber focus:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber/60 group-hover:opacity-100 group-focus-within:opacity-100"
                        >
                          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                        </button>
                      </li>
                    );
                  })}
                  {ids.length === 0 && (
                    <li className="rounded-lg border border-dashed border-white/10 px-3 py-6 text-center text-[11px] text-ink/40">
                      Noch leer – Elemente aus dem Pool hierher ziehen oder mit
                      „+“ hinzufügen. Das ist völlig in Ordnung.
                    </li>
                  )}
                </ul>
              </section>
            );
          })}
        </div>

        {/* Auswertung & Export */}
        <section
          aria-label="Programm-Auswertung und Export"
          className="glass mt-6 rounded-2xl p-5"
        >
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="font-display text-lg text-ink">Ihr Programm</h2>
            <p className="text-xs text-ink/55" aria-live="polite">
              {totalCount === 0
                ? "Noch kein Programm gelegt – beginnen Sie klein, z. B. mit einem einzigen Baustein."
                : `${totalCount} ${totalCount === 1 ? "Element" : "Elemente"} eingeplant: Stabilisierung ${program.stabilisierung.length}, Verarbeitung ${program.konfrontation.length}, Integration ${program.integration.length}.`}
            </p>
            <div className="ml-auto flex flex-wrap gap-2">
              <button
                type="button"
                onClick={copyToClipboard}
                disabled={totalCount === 0}
                className="inline-flex items-center gap-1.5 rounded-xl glass-soft px-3.5 py-2 text-xs text-ink/75 hover:text-ink hover:border-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber/60 disabled:opacity-40"
              >
                <ClipboardCopy className="h-3.5 w-3.5" aria-hidden="true" />
                In Zwischenablage kopieren
              </button>
              <button
                type="button"
                onClick={exportJson}
                disabled={totalCount === 0}
                className="inline-flex items-center gap-1.5 rounded-xl glass-soft px-3.5 py-2 text-xs text-ink/75 hover:text-ink hover:border-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber/60 disabled:opacity-40"
              >
                <Download className="h-3.5 w-3.5" aria-hidden="true" />
                JSON exportieren
              </button>
              <button
                type="button"
                onClick={resetProgram}
                disabled={totalCount === 0}
                className="inline-flex items-center gap-1.5 rounded-xl glass-soft px-3.5 py-2 text-xs text-ink/55 hover:text-amber hover:border-amber/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber/60 disabled:opacity-40"
              >
                <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                Leeren
              </button>
            </div>
          </div>
          {notice && (
            <p
              role="status"
              className="mt-3 rounded-lg border border-ventral/30 bg-ventral-soft px-3 py-2 text-xs text-ventral"
            >
              {notice}
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
