# TRAUMAATLAS

**Der Körper ist die Landkarte** – ein traumasensibler, interaktiver Atlas über Traumafolgen,
Regulation und Verfahren der Traumatherapie. Der Körper selbst ist die Landkarte: ein 3D-Erlebnis
auf anatomischer Grundlage – ruhig, würdevoll, menschlich.

## Inhalte

- **Körperatlas** – 3D-Modell mit 6 Körperregionen, Transparenz-Ebenen (Haut → Muskulatur →
  Organe → Nervensystem), Vagusnerv-Verlauf mit Energiepuls, Raycast-Interaktion
- **Stresskaskade** – 6 choreografierte Stationen als Kamerafahrt durch den Körper
- **Polyvagal-Zonen** – drei Nervensystem-Zustände mit Körpersignalen, Übungen, Verfahren
- **Toleranzfenster** – spielbares Wellenband mit Lichtkugel und Auswertung
- **Symptom-Navigator** – Symptom-Auswahl lässt betroffene Körperregionen aufleuchten
- **Übungs-Lexikon** – 12 Regulation-Übungen mit aufklappbaren Schritt-Anleitungen
- **Stammbaum** – Disziplinen der Psychologie/Traumatherapie als horizontale Jahr-Landschaft
- **Programm-Baukasten** – 3 Phasen, Drag & Drop, localStorage, JSON-Export
- **Wechselwirkungen & Blinde Flecken** – Synergie-Regeln und Lückenanalyse des eigenen Programms
- **Wegweiser Deutschland** – Therapiesuche, Hotlines, Kosten, Abläufe

## Technik

React 19 · TypeScript (strict) · Vite 7 · Tailwind CSS + shadcn/ui · three.js
(@react-three/fiber, drei, postprocessing) · GSAP · framer-motion · Playwright (QA)

```bash
npm install
npm run dev      # Dev-Server (Port via -- --port <N>)
npm run build    # Produktionsbuild
```

## Traumasensibel

- Keine Stroboskope, keine harten Schnitte, nichts Flackerndes
- `prefers-reduced-motion` ersetzt alle Animationen durch statische, vollständig lesbare Zustände
  (SVG-Fallback statt WebGL, kein Auto-Play)
- ARIA auf allen Steuerungen, Tastaturbedienung, Screenreader-Basics
- Akut-Hinweis global sichtbar: Telefonseelsorge 0800 111 0 111 (24 h, kostenfrei), Notfall 112

## Hinweis

Dieser Atlas dient der Orientierung. Er ersetzt keine Diagnose und keine Therapie.
Bei akuter Krise wenden Sie sich an die Telefonseelsorge (0800 111 0 111) oder im Notfall an 112.

## Daten

Kuratierte Inhalte zu Disziplinen, Verfahren, Symptomen, Übungen und dem deutschen Hilfesystem,
basierend auf zwei Vorgänger-Versionen (v1: Kuratierung, v2: Graph-Datenmodell).
