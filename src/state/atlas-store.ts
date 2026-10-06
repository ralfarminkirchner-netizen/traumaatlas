// Zentraler UI-Store für TRAUMAATLAS (ohne externe State-Lib, useSyncExternalStore).
// Eine Quelle der Wahrheit: Views schreiben, 3D-Szene liest – und umgekehrt.

import { useSyncExternalStore } from "react";

export type ViewId =
  | "start"
  | "koerper"
  | "polyvagal"
  | "kaskade"
  | "toleranz"
  | "navigator"
  | "lexikon"
  | "stammbaum"
  | "baukasten"
  | "wechsel"
  | "wegweiser";

export interface AtlasState {
  view: ViewId;
  /** Transparenz-Stufe 0=Haut 1=Muskulatur 2=Organe 3=Nervensystem */
  layer: number;
  /** gehoverte Region (Tooltip) */
  hoverRegion: string | null;
  /** fokussierte Region (Kamera fliegt hin, Panel öffnet sich) */
  focusRegion: string | null;
  /** Regionen, die im Navigator aufleuchten */
  highlightRegions: string[];
  /** aktuelle Stresskaskaden-Station 0..5, -1 = inaktiv */
  cascadeStep: number;
  cascadePlaying: boolean;
  /** Erregungswert -1..1 (negativ = Hypo, 0 = Fenster, positiv = Hyper) */
  arousal: number;
  /** ausgewählte Symptom-ids im Navigator */
  selectedSymptoms: string[];
}

const initial: AtlasState = {
  view: "start",
  layer: 0,
  hoverRegion: null,
  focusRegion: null,
  highlightRegions: [],
  cascadeStep: -1,
  cascadePlaying: false,
  arousal: 0,
  selectedSymptoms: [],
};

type Listener = () => void;

let state: AtlasState = initial;
const listeners = new Set<Listener>();

export function getState(): AtlasState {
  return state;
}

export function subscribe(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function setState(partial: Partial<AtlasState>): void {
  state = { ...state, ...partial };
  listeners.forEach((fn) => fn());
}

export function useAtlasState(): AtlasState {
  return useSyncExternalStore(subscribe, getState, getState);
}

// ── Abgeleitete Helfer ─────────────────────────────────────────
export function isSceneView(view: ViewId): boolean {
  // Views, in denen das persistente 3D-Modell sichtbar bleibt
  return ["start", "koerper", "polyvagal", "kaskade", "toleranz", "navigator"].includes(view);
}

/** Kaskaden-Stationen → Szenen-Verhalten (von der 3D-Szene ausgewertet):
 *  0 wahrnehmung: ruhig, neutral; Kamera weit vorne am Kopf
 *  1 orientierung: Kopf-/Halsregion warm pulsieren (Startle)
 *  2 mobilisierung: warme Puls über Brust/Schultern/Becken, Partikel aktiver
 *  3 erstarrung: Bewegung stoppt, bläuliches Einfrieren (Frost) breitet sich aus
 *  4 entladung: Partikelströme entweichen aus Schultern/Becken, Frost löst sich
 *  5 speicherung: alles wird still, leicht bernsteines Nachglühen im Bauchraum
 */
