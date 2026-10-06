import type { ReactNode } from "react";
import { Info } from "lucide-react";

import { cn } from "@/lib/utils";

interface DisclaimerProps {
  /** Optionaler Ersatz- oder Ergänzungstext */
  children?: ReactNode;
  /** „analysis“ hebt den Hinweis für analysierende Bereiche leicht hervor */
  variant?: "default" | "analysis";
  className?: string;
}

const DEFAULT_TEXT =
  "Dieser Atlas ersetzt keine Diagnose oder Therapie. Er versteht sich als Orientierung – bei akuter Belastung wenden Sie sich bitte an Fachpersonen.";

/** Dezenter, traumasensibler Hinweis ohne Heilsversprechen. */
export default function Disclaimer({ children, variant = "default", className }: DisclaimerProps) {
  const analysis = variant === "analysis";
  return (
    <p
      role="note"
      className={cn(
        "glass-soft flex items-start gap-2.5 rounded-xl px-4 py-3 text-xs leading-relaxed",
        analysis ? "border-amber/30 text-ink/85" : "text-ink/60",
        className,
      )}
    >
      <Info
        aria-hidden="true"
        className={cn("mt-0.5 size-4 shrink-0", analysis ? "text-amber" : "text-ink/45")}
      />
      <span>{children ?? DEFAULT_TEXT}</span>
    </p>
  );
}
