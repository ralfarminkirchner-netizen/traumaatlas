// Disziplinen-Stammbaum: horizontale Jahr-Landschaft (1870er bis heute, Wurzeln links),
// Karten-Konstellationen in Lanes, verbunden mit feinen Linien zu den Eltern (parents).
// Robust: reines Positionieren aus Daten (kein Messen), horizontaler Scroll-Container,
// "Springe zu Jahr"-Select, Prev/Next-Buttons.

import { useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Compass } from "lucide-react";

import { disciplines, groups, type DisciplineNode } from "@/data/disciplines";
import { methods } from "@/data/methods";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

// ── Layout-Konstanten ────────────────────────────────────────
const CARD_W = 232;
const CARD_H = 148;
const GAP_X = 28;
const LANE_GAP = 22;
const TOP = 56;
const PAD_X = 40;
const PRE_W = 430; // Band für die Wurzeln (-400 … 1870)
const MODERN_W = 2400; // Band 1870 … 2020

const YEAR_MIN = -400;
const MODERN_START = 1870;
const YEAR_MAX = 2020;

function xFor(year: number): number {
  if (year < MODERN_START) {
    const f = (year - YEAR_MIN) / (MODERN_START - YEAR_MIN);
    return PAD_X + f * PRE_W;
  }
  const f = Math.min(1, (year - MODERN_START) / (YEAR_MAX - MODERN_START));
  return PAD_X + PRE_W + f * MODERN_W;
}

interface Position {
  x: number;
  y: number;
  lane: number;
}

function formatYear(year: number): string {
  return year < 0 ? `${-year} v. Chr.` : String(year);
}

/** Lanes zuweisen: Karten desselben Jahr-Fensters vertikal versetzt. */
function computeLayout(): { pos: Map<string, Position>; width: number; height: number } {
  const lanes: number[] = [0, 0, 0]; // letztes belegtes X pro Lane
  const sorted = [...disciplines].sort(
    (a, b) => a.year - b.year || a.name.localeCompare(b.name),
  );
  const pos = new Map<string, Position>();
  for (const node of sorted) {
    const x = xFor(node.year);
    let lane = lanes.findIndex((end) => x >= end + GAP_X);
    if (lane === -1) {
      // Überlappung unvermeidbar: Lane mit dem ältesten (weitesten links liegenden) Ende
      lane = lanes.indexOf(Math.min(...lanes));
    }
    lanes[lane] = x + CARD_W;
    pos.set(node.id, { x, y: TOP + lane * (CARD_H + LANE_GAP), lane });
  }
  const width = PAD_X * 2 + PRE_W + MODERN_W + CARD_W;
  const height = TOP + 3 * CARD_H + 2 * LANE_GAP + 24;
  return { pos, width, height };
}

/** Jahres-Marken für die Achse */
const TICKS: number[] = [
  -400, 0, 1000, 1700,
  1880, 1900, 1920, 1940, 1960, 1980, 2000, 2020,
];

const JUMP_TARGETS: { label: string; year: number }[] = [
  { label: "Antike Wurzeln (−400)", year: -400 },
  { label: "Aufklärung (1700)", year: 1700 },
  { label: "Gründung der Psychologie (1879)", year: 1879 },
  { label: "Psychoanalyse & Schulen (1895–1930)", year: 1900 },
  { label: "Verhaltenstherapie & Humanismus (1950er)", year: 1950 },
  { label: "KVT & Kognitionswissenschaft (1960er)", year: 1960 },
  { label: "Neurowissenschaften & Bindung (1980er)", year: 1980 },
  { label: "Trauma-Verfahren reifen (1990er)", year: 1995 },
  { label: "Neueste Verfahren (2000–2016)", year: 2010 },
];

export default function StammbaumView() {
  const reduced = useReducedMotion();
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { pos, width, height } = useMemo(() => computeLayout(), []);

  const selected: DisciplineNode | undefined = disciplines.find(
    (d) => d.id === selectedId,
  );
  const selectedMethod = selected
    ? methods.find((m) => m.id === selected.id)
    : undefined;

  const scrollToYear = (year: number) => {
    const el = scrollRef.current;
    if (!el) return;
    const x = xFor(year) - el.clientWidth / 2 + CARD_W / 2;
    el.scrollTo({ left: Math.max(0, x), behavior: reduced ? "auto" : "smooth" });
  };

  const scrollBy = (dir: 1 | -1) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({
      left: dir * el.clientWidth * 0.8,
      behavior: reduced ? "auto" : "smooth",
    });
  };

  // Kanten: parent → child als sanfte Kubiken
  const edges = useMemo(() => {
    const lines: { d: string; key: string; hot: boolean }[] = [];
    for (const node of disciplines) {
      const to = pos.get(node.id);
      if (!to) continue;
      for (const parentId of node.parents) {
        const from = pos.get(parentId);
        if (!from) continue;
        const x1 = from.x + CARD_W;
        const y1 = from.y + CARD_H / 2;
        const x2 = to.x;
        const y2 = to.y + CARD_H / 2;
        const dx = Math.max(40, (x2 - x1) * 0.45);
        const hot = selectedId === node.id || selectedId === parentId;
        lines.push({
          key: `${parentId}→${node.id}`,
          hot,
          d: `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`,
        });
      }
    }
    return lines;
  }, [pos, selectedId]);

  return (
    <div className="view-fade min-h-full pb-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <header className="pt-10 pb-6">
          <p className="font-display text-sm uppercase tracking-[0.25em] text-amber/80">
            Disziplinen-Stammbaum
          </p>
          <h1 className="font-display mt-3 text-3xl sm:text-4xl text-ink">
            Woraus Traumatherapie gewachsen ist
          </h1>
          <p className="mt-3 max-w-2xl text-sm sm:text-base text-ink/70 leading-relaxed">
            {disciplines.length} Disziplinen, Schulen und Verfahren von der
            Antike bis heute – als Jahr-Landschaft von links (alt) nach rechts
            (heute). Feine Linien zeigen, aus welchen Ideen etwas Neues
            hervorging. Tippen Sie eine Karte an für Details.
          </p>
        </header>

        {/* Steuerung */}
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="glass-soft rounded-xl px-1.5 py-1">
            <button
              type="button"
              onClick={() => scrollBy(-1)}
              aria-label="Nach links blättern (ältere Jahre)"
              className="rounded-lg p-2 text-ink/70 hover:bg-white/[0.06] hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber/60"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => scrollBy(1)}
              aria-label="Nach rechts blättern (jüngere Jahre)"
              className="rounded-lg p-2 text-ink/70 hover:bg-white/[0.06] hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber/60"
            >
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          <Select
            onValueChange={(v) => scrollToYear(Number(v))}
            aria-label="Springe zu einer Epoche"
          >
            <SelectTrigger className="glass-soft w-[280px] rounded-xl border-white/10 text-ink/80 focus:ring-amber/50">
              <SelectValue placeholder="Springe zu Epoche …" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-white/10 bg-coal text-ink">
              {JUMP_TARGETS.map((t) => (
                <SelectItem
                  key={t.label}
                  value={String(t.year)}
                  className="text-sm focus:bg-amber-soft focus:text-amber"
                >
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div
            className="ml-auto hidden md:flex items-center gap-3 text-[11px] text-ink/50"
            aria-hidden="true"
          >
            {(Object.keys(groups) as (keyof typeof groups)[]).map((g) => (
              <span key={g} className="inline-flex items-center gap-1.5">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: groups[g].color }}
                />
                {groups[g].label}
              </span>
            ))}
          </div>
        </div>

        {/* Zeitleiste */}
        <div
          ref={scrollRef}
          role="region"
          aria-label="Zeitleiste der Disziplinen, horizontal scrollbar"
          tabIndex={0}
          className="glass rounded-2xl overflow-x-auto overflow-y-hidden scrollbar-thin focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber/60"
        >
          <div
            className="relative"
            style={{ width, height }}
          >
            {/* Jahres-Achse */}
            <div
              className="absolute left-0 right-0 top-0 h-px bg-white/10"
              style={{ top: TOP - 14 }}
              aria-hidden="true"
            />
            {TICKS.map((y) => (
              <span
                key={y}
                aria-hidden="true"
                className="absolute top-4 -translate-x-1/2 text-[10px] uppercase tracking-wider text-ink/40 whitespace-nowrap"
                style={{ left: xFor(y) }}
              >
                {formatYear(y)}
              </span>
            ))}

            {/* Verbindungslinien */}
            <svg
              width={width}
              height={height}
              className="absolute left-0 top-0"
              aria-hidden="true"
            >
              {edges.map((e) => (
                <path
                  key={e.key}
                  d={e.d}
                  fill="none"
                  stroke={e.hot ? "rgba(226,163,92,0.55)" : "rgba(255,255,255,0.09)"}
                  strokeWidth={e.hot ? 1.6 : 1}
                />
              ))}
            </svg>

            {/* Karten */}
            {disciplines.map((node, idx) => {
              const p = pos.get(node.id);
              if (!p) return null;
              const g = groups[node.group];
              const active = selectedId === node.id;
              return (
                <motion.button
                  key={node.id}
                  type="button"
                  onClick={() => setSelectedId(active ? null : node.id)}
                  aria-pressed={active}
                  aria-label={`${node.name}, ${formatYear(node.year)}${node.founder ? `, ${node.founder}` : ""}`}
                  initial={reduced ? false : { opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={
                    reduced
                      ? { duration: 0 }
                      : { duration: 0.35, delay: Math.min(0.5, idx * 0.015) }
                  }
                  className={[
                    "absolute rounded-xl border p-3.5 text-left transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber/60",
                    active
                      ? "bg-white/[0.08] border-amber/50"
                      : "glass-soft hover:bg-white/[0.06]",
                  ].join(" ")}
                  style={{ left: p.x, top: p.y, width: CARD_W, height: CARD_H }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                      style={{
                        color: g.color,
                        backgroundColor: `${g.color}1f`,
                        border: `1px solid ${g.color}55`,
                      }}
                    >
                      {g.label}
                    </span>
                    <span className="font-display text-xs text-ink/50">
                      {formatYear(node.year)}
                    </span>
                  </div>
                  <h2 className="font-display mt-2 text-[15px] leading-snug text-ink line-clamp-2">
                    {node.name}
                  </h2>
                  <p className="mt-1 text-[11px] text-ink/50 line-clamp-1">
                    {node.founder ?? ""}
                  </p>
                  <p className="mt-1.5 text-[11px] leading-snug text-ink/60 line-clamp-2">
                    {node.summary}
                  </p>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Detail-Panel */}
        {selected ? (
          <motion.section
            initial={reduced ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={reduced ? { duration: 0 } : { duration: 0.35 }}
            aria-label={`Details zu ${selected.name}`}
            className="glass mt-6 rounded-2xl p-6"
          >
            <div className="flex flex-wrap items-center gap-3">
              <Compass className="h-5 w-5 text-amber" aria-hidden="true" />
              <h2 className="font-display text-xl text-ink">{selected.name}</h2>
              <Badge
                variant="outline"
                className="border-white/15 bg-white/[0.05] text-ink/60"
              >
                {groups[selected.group].label} · {formatYear(selected.year)}
              </Badge>
            </div>
            <dl className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-[11px] uppercase tracking-wider text-ink/40">
                  Begründer:in / Schlüsselfiguren
                </dt>
                <dd className="mt-1 text-sm text-ink/85">
                  {selected.founder ?? "–"}
                  {selected.keyFigures && selected.keyFigures !== selected.founder && (
                    <span className="block text-xs text-ink/50 mt-0.5">
                      {selected.keyFigures}
                    </span>
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-[11px] uppercase tracking-wider text-ink/40">
                  Hervorgegangen aus
                </dt>
                <dd className="mt-1 text-sm text-ink/85">
                  {selected.parents.length > 0
                    ? selected.parents
                        .map(
                          (pid) =>
                            disciplines.find((d) => d.id === pid)?.name ?? pid,
                        )
                        .join(", ")
                    : "Wurzel (keine Eltern im Atlas)"}
                </dd>
              </div>
            </dl>
            <p className="mt-4 text-sm leading-relaxed text-ink/80">
              {selected.summary}
            </p>
            {selectedMethod && (
              <p className="mt-4 rounded-xl border-l-2 border-ventral/50 bg-ventral-soft p-4 text-sm leading-relaxed text-ventral/95">
                Verfahrens-Bezug: <strong>{selectedMethod.name}</strong> –{" "}
                {selectedMethod.focusShort}. {selectedMethod.forWhom}
              </p>
            )}
            <p className="mt-3 text-[11px] text-ink/40">
              Auch im Methoden-Lexikon des Atlas vertreten, sofern es ein
              eigenes Verfahren ist (siehe Wechsel- und Baukasten-Ansicht).
            </p>
          </motion.section>
        ) : (
          <p className="mt-6 text-sm text-ink/45 italic">
            Tippen Sie eine Karte in der Landschaft an, um Gründer:in, Jahr und
            Kernaussage zu sehen.
          </p>
        )}
      </div>
    </div>
  );
}
