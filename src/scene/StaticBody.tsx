// StaticBody: statischer SVG-Fallback ohne WebGL bzw. bei reduzierter
// Bewegung. Nutzt die Silhouetten-Pfade aus nervous.ts; hover/focus/highlight
// färben die Regionen weich ein. Jede Region ist per Tastatur (Enter/Leer)
// auswählbar.

import { useState } from "react";
import { bodyRegions } from "@/data/nervous";
import type { NervousStateId } from "@/data/nervous";
import { setState, useAtlasState } from "@/state/atlas-store";

const STATE_COLORS: Record<NervousStateId | "both", string> = {
  ventral: "#7fb8a4",
  sympathikus: "#e2a35c",
  dorsal: "#8b93c9",
  both: "#d9b08c",
};

const HIGHLIGHT_COLOR = "#e2a35c";

function fillFor(
  regionId: string,
  hover: string | null,
  focus: string | null,
  highlights: string[],
): { fill: string; opacity: number } {
  if (focus === regionId) return { fill: STATE_COLORS.ventral, opacity: 0.95 };
  if (highlights.includes(regionId)) return { fill: HIGHLIGHT_COLOR, opacity: 0.85 };
  if (hover === regionId) return { fill: HIGHLIGHT_COLOR, opacity: 0.8 };
  if (focus !== null && highlights.length === 0) return { fill: STATE_COLORS.both, opacity: 0.22 };
  return { fill: STATE_COLORS.both, opacity: 0.45 };
}

export default function StaticBody() {
  const { hoverRegion, focusRegion, highlightRegions } = useAtlasState();
  const [localHover, setLocalHover] = useState<string | null>(null);
  const hover = localHover ?? hoverRegion;

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-4 p-6">
      <svg
        viewBox="0 0 200 520"
        role="img"
        aria-label="Statische Körperansicht mit sechs wählbaren Körperregionen"
        className="h-full max-h-[70vh] w-auto"
      >
        {bodyRegions.map((region) => {
          const { fill, opacity } = fillFor(region.id, hover, focusRegion, highlightRegions);
          return (
            <g key={region.id}>
              <path
                d={region.d}
                fill={fill}
                opacity={opacity}
                stroke="rgba(242,235,226,0.25)"
                strokeWidth={1}
                className="cursor-pointer transition-[fill,opacity] duration-300"
                onMouseEnter={() => setLocalHover(region.id)}
                onMouseLeave={() => setLocalHover(null)}
                onClick={() =>
                  setState({ focusRegion: focusRegion === region.id ? null : region.id })
                }
              />
              {/* Tastatur-fähige Schaltfläche über der Region */}
              <g
                role="button"
                tabIndex={0}
                aria-label={`${region.label}: ${region.signals[0] ?? ""}`}
                onFocus={() => setLocalHover(region.id)}
                onBlur={() => setLocalHover(null)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setState({ focusRegion: region.id });
                  }
                }}
              >
                <rect x="0" y="0" width="1" height="1" fill="none" pointerEvents="all" />
                <title>{region.label}</title>
              </g>
            </g>
          );
        })}
      </svg>
      <p className="text-xs tracking-wide text-ink/50">
        Statische Körperansicht (reduzierte Bewegung)
      </p>
    </div>
  );
}
