// Wegweiser Deutschland: Akut-Hilfe zuerst (tel:-Links), dann alle Abschnitte
// aus resources.ts vollständig – mit Sticky-Unternavigation.

import { useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { ExternalLink, Phone, PhoneCall, Siren } from "lucide-react";

import { resourceGroups } from "@/data/resources";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { Badge } from "@/components/ui/badge";

/** Akut-Kontakte (aus den Daten von resources.ts / symptoms.ts) */
const EMERGENCY_CONTACTS: {
  label: string;
  number: string;
  tel: string;
  note: string;
}[] = [
  {
    label: "Telefonseelsorge",
    number: "0800 111 0 111",
    tel: "tel:08001110111",
    note: "Kostenfrei, rund um die Uhr, anonym – auch 0800 111 0 222. Chat und Mail möglich.",
  },
  {
    label: "Telefonseelsorge (Alternativnummer)",
    number: "0800 111 0 222",
    tel: "tel:08001110222",
    note: "Gleiche Anlaufstelle, zweite Leitung – wenn die erste besetzt ist.",
  },
  {
    label: "Hilfetelefon",
    number: "116 123",
    tel: "tel:116123",
    note: "Erreichbar Tag und Nacht – ein ganz normaler erster Anlauf.",
  },
  {
    label: "Hilfetelefon Gewalt gegen Frauen",
    number: "116 016",
    tel: "tel:116016",
    note: "Beratung bei häuslicher und sexualisierter Gewalt – mehrsprachig, kostenfrei.",
  },
  {
    label: "Notruf",
    number: "112",
    tel: "tel:112",
    note: "Bei akuter Selbst- oder Fremdgefährdung – oder die nächste Notaufnahme / PIA.",
  },
];

export default function WegweiserView() {
  const reduced = useReducedMotion();
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  const jumpTo = useCallback((id: string) => {
    sectionRefs.current[id]?.scrollIntoView({
      behavior: reduced ? "auto" : "smooth",
      block: "start",
    });
  }, [reduced]);

  return (
    <div className="view-fade min-h-full pb-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <header className="pt-10 pb-8">
          <p className="font-display text-sm uppercase tracking-[0.25em] text-amber/80">
            Wegweiser Deutschland
          </p>
          <h1 className="font-display mt-3 text-3xl sm:text-4xl text-ink">
            Hilfe finden – nah und konkret
          </h1>
          <p className="mt-3 max-w-2xl text-sm sm:text-base text-ink/70 leading-relaxed">
            Verzeichnisse, Fachgesellschaften, Ambulanzen und Abläufe für
            Deutschland: von der ersten Suche bis zum Therapieplatz. Alle
            Angaben stammen aus den Atlas-Daten und führen zu externen
            Angeboten.
          </p>
        </header>

        {/* ── Akut-Hilfe, prominent ─────────────────────────── */}
        <section
          aria-label="Akut-Hilfe"
          className="glass rounded-2xl border-l-4 border-l-[#e2725b] p-6 mb-10"
        >
          <h2 className="font-display text-xl text-ink flex items-center gap-2">
            <Siren className="h-5 w-5 text-[#e98a72]" aria-hidden="true" />
            Wenn es gerade brennt
          </h2>
          <p className="mt-2 text-sm text-ink/70 leading-relaxed">
            Diese Nummern sind rund um die Uhr erreichbar, kostenfrei und
            anonym. Sie brauchen keinen „guten Grund“ – anrufen reicht.
          </p>
          <ul
            role="list"
            className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
          >
            {EMERGENCY_CONTACTS.map((c, idx) => (
              <motion.li
                key={c.number + c.label}
                initial={reduced ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={
                  reduced
                    ? { duration: 0 }
                    : { duration: 0.35, delay: idx * 0.05 }
                }
              >
                <a
                  href={c.tel}
                  className="group block h-full rounded-xl border border-[#e2725b]/30 bg-[#e2725b]/[0.07] p-4 transition-colors hover:border-[#e2725b]/60 hover:bg-[#e2725b]/[0.12] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber/60"
                >
                  <span className="block text-xs uppercase tracking-wider text-ink/55">
                    {c.label}
                  </span>
                  <span className="mt-1 flex items-center gap-2 font-display text-2xl text-[#f0a088]">
                    <PhoneCall
                      className="h-5 w-5 shrink-0"
                      aria-hidden="true"
                    />
                    {c.number}
                  </span>
                  <span className="mt-2 block text-xs leading-relaxed text-ink/60">
                    {c.note}
                  </span>
                </a>
              </motion.li>
            ))}
          </ul>
        </section>

        {/* ── Sticky-Unternavigation ────────────────────────── */}
        <nav
          aria-label="Abschnitte des Wegweisers"
          className="sticky top-3 z-20 mb-8"
        >
          <ul className="glass flex gap-1.5 overflow-x-auto scrollbar-thin rounded-2xl p-1.5">
            {resourceGroups.map((g) => (
              <li key={g.id} className="shrink-0">
                <button
                  type="button"
                  onClick={() => jumpTo(g.id)}
                  className="whitespace-nowrap rounded-xl px-3.5 py-2 text-xs text-ink/70 hover:bg-amber-soft hover:text-amber focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber/60"
                >
                  {g.title}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* ── Alle Abschnitte aus resources.ts ──────────────── */}
        {resourceGroups.map((group, gi) => (
          <section
            key={group.id}
            id={`wegweiser-${group.id}`}
            ref={(el) => {
              sectionRefs.current[group.id] = el;
            }}
            aria-label={group.title}
            className="scroll-mt-24 mb-12"
          >
            <div className="mb-4">
              <p className="font-display text-xs uppercase tracking-[0.25em] text-amber/70">
                Abschnitt {gi + 1} von {resourceGroups.length}
              </p>
              <h2 className="font-display mt-1 text-2xl text-ink">
                {group.title}
              </h2>
              <p className="mt-1 text-sm text-ink/60">{group.subtitle}</p>
            </div>

            <ul
              role="list"
              className="grid gap-4 md:grid-cols-2"
              aria-label={`Einträge: ${group.title}`}
            >
              {group.items.map((item) => (
                <li key={item.name}>
                  <article className="glass h-full rounded-2xl p-5 transition-colors hover:border-amber/25">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="font-display text-base leading-snug text-ink">
                        {item.name}
                      </h3>
                      <Badge
                        variant="outline"
                        className="shrink-0 border-white/15 bg-white/[0.05] text-[10px] text-ink/60"
                      >
                        {item.type}
                      </Badge>
                    </div>
                    <p className="mt-2 text-sm text-ink/75 leading-relaxed">
                      {item.what}
                    </p>
                    {item.note && (
                      <p className="mt-2 text-xs leading-relaxed text-ventral/85 border-l-2 border-ventral/40 pl-3">
                        {item.note}
                      </p>
                    )}
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-flex items-center gap-1.5 text-xs text-amber hover:text-amber/80 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber/60 rounded"
                    >
                      {item.url.startsWith("tel:") ? (
                        <Phone className="h-3.5 w-3.5" aria-hidden="true" />
                      ) : (
                        <ExternalLink
                          className="h-3.5 w-3.5"
                          aria-hidden="true"
                        />
                      )}
                      {item.url.startsWith("tel:")
                        ? item.url.replace("tel:", "")
                        : item.url.replace(/^https?:\/\//, "")}
                      <span className="sr-only">
                        (öffnet in neuem Tab / wählt die Nummer)
                      </span>
                    </a>
                  </article>
                </li>
              ))}
            </ul>
          </section>
        ))}

        <footer className="mt-6 border-t border-white/10 pt-6">
          <p className="text-xs text-ink/45 leading-relaxed max-w-2xl">
            Hinweis: Alle externen Angebote werden in einem neuen Tab geöffnet.
            Die Auflistung ersetzt keine Rechts- oder Medizinberatung; bei
            Unsicherheit hilft die Unabhängige Patientenberatung (UPD,
            01805 111 31) kostenlos und neutral weiter.
          </p>
        </footer>
      </div>
    </div>
  );
}
