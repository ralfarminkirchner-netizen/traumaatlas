import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { setState, useAtlasState } from "@/state/atlas-store";
import Disclaimer from "@/components/Disclaimer";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

/** Startbühne: Hero über der rotierenden 3D-Szene. */
export default function StartHero() {
  const reduced = useReducedMotion();
  const { view } = useAtlasState();

  const enter = (target: "koerper" | "kaskade") => {
    setState({ view: target, focusRegion: null, cascadeStep: -1, cascadePlaying: false });
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  };

  const fade = (delay: number) =>
    reduced
      ? {}
      : {
          initial: { opacity: 0, y: 18 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] as const },
        };

  return (
    <div className="flex h-full flex-col justify-end gap-6 px-5 pb-10 md:justify-center md:px-14 md:pb-0 lg:px-20">
      {view === "start" && (
        <div className="max-w-2xl">
          <motion.p
            {...fade(0.1)}
            className="mb-4 text-[11px] uppercase tracking-[0.35em] text-amber"
          >
            Trauma · Psychologie · Körper
          </motion.p>
          <motion.h1
            {...fade(0.25)}
            className="font-display text-4xl leading-[1.08] text-ink md:text-6xl"
          >
            Der Körper
            <br />
            ist die <span className="text-amber">Landkarte</span>.
          </motion.h1>
          <motion.p
            {...fade(0.45)}
            className="mt-6 max-w-xl text-[15px] leading-relaxed text-muted-foreground md:text-base"
          >
            Der TRAUMAATLAS macht sichtbar, was Trauma im Nervensystem anstellt – Region für
            Region, Zustand für Zustand. Ein ruhiger, interaktiver Atlas: vom Vagusnerv über das
            Toleranzfenster bis zu 36 Disziplinen und einem persönlichen Programm-Baukasten.
          </motion.p>
          <motion.div {...fade(0.65)} className="mt-8 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => enter("koerper")}
              className="group inline-flex items-center gap-2 rounded-full bg-amber px-5 py-2.5 text-sm font-medium text-primary-foreground transition-transform hover:scale-[1.03] active:scale-[0.98]"
            >
              Körperatlas betreten
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </button>
            <button
              type="button"
              onClick={() => enter("kaskade")}
              className="inline-flex items-center gap-2 rounded-full border border-white/15 px-5 py-2.5 text-sm text-ink transition-colors hover:border-amber/50 hover:text-amber"
            >
              Stresskaskade erleben
            </button>
          </motion.div>
          <motion.div {...fade(0.85)} className="mt-8 max-w-xl">
            <Disclaimer>
              Ein Atlas zum Verstehen und Regulieren – keine Diagnose, keine Therapie. Bei Akutlage:
              Telefonseelsorge 0800 111 0 111, im Notfall 112.
            </Disclaimer>
          </motion.div>
        </div>
      )}
    </div>
  );
}
