import { LAYERS, regionAnchors } from "@/data/body3d";
import { setState, useAtlasState } from "@/state/atlas-store";
import Disclaimer from "@/components/Disclaimer";
import { cn } from "@/lib/utils";

/**
 * Körperatlas-Overlay: Transparenz-Stufen (Haut → Muskulatur → Organe → Nervensystem)
 * und Regions-Schnellauswahl – liegt über der persistenten 3D-Szene.
 */
export default function KoerperOverlay() {
  const { layer, focusRegion } = useAtlasState();

  return (
    <div className="flex h-full flex-col justify-between gap-4 px-4 pb-5 pt-4 md:px-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="glass-soft max-w-md rounded-2xl px-4 py-3">
          <h1 className="font-display text-lg text-ink md:text-xl">Der Körperatlas</h1>
          <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
            Fahren Sie über den Körper, wählen Sie eine Region – und sehen Sie, was Hyperarousal,
            Hypoarousal und ventrale Sicherheit jeweils dort anstellen.
          </p>
        </div>
        <Disclaimer className="max-w-xs rounded-2xl px-4 py-3 text-[12px]">
          Orientierung statt Diagnose – die Texte beschreiben typische Muster, keine Befunde.
        </Disclaimer>
      </div>

      <div className="flex flex-col gap-3">
        {/* Regions-Schnellauswahl (tastaturbedienbar, ergänzt die 3D-Raycasts) */}
        <div
          className="flex flex-wrap gap-1.5"
          role="group"
          aria-label="Körperregion auswählen"
        >
          {regionAnchors.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => setState({ focusRegion: focusRegion === r.id ? null : r.id })}
              aria-pressed={focusRegion === r.id}
              className={cn(
                "rounded-full border px-3 py-1.5 text-[12px] transition-colors",
                focusRegion === r.id
                  ? "border-amber/50 bg-amber-soft text-amber"
                  : "border-white/10 bg-abyss/50 text-muted-foreground hover:border-white/25 hover:text-ink",
              )}
            >
              {r.label}
            </button>
          ))}
        </div>

        {/* Transparenz-Stufen */}
        <div className="glass rounded-2xl px-3 py-2.5">
          <div
            className="flex flex-wrap items-center gap-1"
            role="group"
            aria-label="Tiefenschicht des Körpermodells"
          >
            <span className="mr-2 hidden text-[10px] uppercase tracking-[0.2em] text-muted-foreground sm:inline">
              Ebene
            </span>
            {LAYERS.map((l) => (
              <button
                key={l.id}
                type="button"
                onClick={() => setState({ layer: l.id })}
                aria-pressed={layer === l.id}
                title={l.hint}
                className={cn(
                  "rounded-full px-3.5 py-1.5 text-[12px] transition-colors",
                  layer === l.id
                    ? "bg-amber text-primary-foreground"
                    : "text-muted-foreground hover:bg-white/[0.06] hover:text-ink",
                )}
              >
                {l.label}
              </button>
            ))}
            <span className="ml-auto hidden text-[12px] text-muted-foreground md:inline">
              {LAYERS[layer]?.hint}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
