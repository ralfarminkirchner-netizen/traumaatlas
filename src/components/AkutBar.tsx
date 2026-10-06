import { Phone } from "lucide-react";

import { cn } from "@/lib/utils";

interface AkutBarProps {
  className?: string;
}

/**
 * Globaler Hinweis auf akute Hilfe. Bewusst KEIN role="alert"
 * (kein Interrupt), sondern ein ruhiges, ständig verfügbares <aside>.
 * Ohne Fixed-Position – die App-Shell positioniert die Leiste.
 */
export default function AkutBar({ className }: AkutBarProps) {
  return (
    <aside
      aria-label="Akute Hilfe"
      className={cn(
        "glass flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border-l-2 border-l-amber px-4 py-2.5 text-sm",
        className,
      )}
    >
      <span className="flex items-center gap-2 font-medium text-amber">
        <Phone aria-hidden="true" className="size-4" />
        Akut?
      </span>
      <a
        href="tel:08001110111"
        className="underline decoration-amber/60 underline-offset-4 transition-colors hover:text-amber"
      >
        Telefonseelsorge 0800&nbsp;111&nbsp;0&nbsp;111
      </a>
      <span className="text-ink/55">kostenfrei, 24&nbsp;h</span>
      <span aria-hidden="true" className="text-white/20">
        ·
      </span>
      <span>
        Notfall&nbsp;
        <a
          href="tel:112"
          className="underline decoration-amber/60 underline-offset-4 transition-colors hover:text-amber"
        >
          112
        </a>
      </span>
    </aside>
  );
}
