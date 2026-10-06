import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { getState, setState, useAtlasState, type ViewId } from "@/state/atlas-store";
import { cn } from "@/lib/utils";

export interface NavEntry {
  id: ViewId;
  label: string;
  group: string;
}

export const NAV_ENTRIES: NavEntry[] = [
  { id: "start", label: "Start", group: "Grundlage" },
  { id: "koerper", label: "Körperatlas", group: "Körper" },
  { id: "kaskade", label: "Stresskaskade", group: "Körper" },
  { id: "polyvagal", label: "Polyvagal-Zonen", group: "Körper" },
  { id: "toleranz", label: "Toleranzfenster", group: "Körper" },
  { id: "navigator", label: "Symptom-Navigator", group: "Körper" },
  { id: "lexikon", label: "Übungs-Lexikon", group: "Wissen" },
  { id: "stammbaum", label: "Stammbaum", group: "Wissen" },
  { id: "baukasten", label: "Programm-Baukasten", group: "Selbsthilfe" },
  { id: "wechsel", label: "Wechselwirkungen", group: "Selbsthilfe" },
  { id: "wegweiser", label: "Wegweiser", group: "Hilfe" },
];

/** Zentrale View-Wechsel-Logik inkl. sauberem Zurücksetzen von View-Zuständen. */
export function switchView(next: ViewId): void {
  const { view, highlightRegions, arousal } = getState();
  const patch: Partial<ReturnType<typeof useAtlasState>> = { view: next };
  if (view === "navigator" && next !== "navigator") {
    patch.highlightRegions = [];
    patch.selectedSymptoms = [];
  }
  if ((view === "polyvagal" || view === "toleranz") && next !== view) {
    if (arousal !== 0) patch.arousal = 0;
  }
  if (next === "koerper" || next === "navigator") {
    patch.focusRegion = null;
  }
  if (highlightRegions.length && next !== "navigator") {
    patch.highlightRegions = [];
  }
  setState(patch);
  window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
}

function Wordmark() {
  return (
    <button
      type="button"
      onClick={() => switchView("start")}
      className="flex items-baseline gap-2 group"
      aria-label="TRAUMAATLAS – zur Startseite"
    >
      <span className="font-display text-xl md:text-2xl tracking-wide text-ink group-hover:text-amber transition-colors">
        TRAUMA<span className="text-amber">ATLAS</span>
      </span>
      <span className="hidden whitespace-nowrap text-[11px] uppercase tracking-[0.2em] text-muted-foreground xl:inline">
        Der Körper als Landkarte
      </span>
    </button>
  );
}

export default function AtlasNav() {
  const { view } = useAtlasState();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const groups = [...new Set(NAV_ENTRIES.map((e) => e.group))];

  const go = (id: ViewId) => {
    setOpen(false);
    switchView(id);
  };

  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b border-white/[0.06] backdrop-blur-xl transition-colors",
        scrolled ? "bg-abyss/80" : "bg-abyss/40",
      )}
    >
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-4 md:px-6">
        <Wordmark />

        {/* Desktop-Navigation */}
        <nav aria-label="Hauptnavigation" className="hidden lg:block">
          <ul className="flex items-center gap-1">
            {NAV_ENTRIES.filter((e) => e.id !== "start").map((entry) => (
              <li key={entry.id}>
                <button
                  type="button"
                  onClick={() => go(entry.id)}
                  aria-current={view === entry.id ? "page" : undefined}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-[13px] transition-colors",
                    view === entry.id
                      ? "bg-amber-soft text-amber"
                      : "text-muted-foreground hover:text-ink hover:bg-white/[0.04]",
                  )}
                >
                  {entry.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Mobil-Toggle */}
        <button
          type="button"
          className="lg:hidden rounded-lg p-2 text-muted-foreground hover:text-ink hover:bg-white/[0.05]"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? "Menü schließen" : "Menü öffnen"}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobil-Menü */}
      <AnimatePresence>
        {open && (
          <motion.nav
            id="mobile-nav"
            aria-label="Hauptnavigation mobil"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="overflow-hidden border-t border-white/[0.06] bg-abyss/95 lg:hidden"
          >
            <div className="space-y-3 px-4 py-4">
              {groups.map((group) => (
                <div key={group}>
                  <p className="mb-1 text-[10px] uppercase tracking-[0.25em] text-muted-foreground/70">
                    {group}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {NAV_ENTRIES.filter((e) => e.group === group).map((entry) => (
                      <button
                        key={entry.id}
                        type="button"
                        onClick={() => go(entry.id)}
                        aria-current={view === entry.id ? "page" : undefined}
                        className={cn(
                          "rounded-full border px-3 py-1.5 text-[13px] transition-colors",
                          view === entry.id
                            ? "border-amber/40 bg-amber-soft text-amber"
                            : "border-white/10 text-muted-foreground hover:text-ink",
                        )}
                      >
                        {entry.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
