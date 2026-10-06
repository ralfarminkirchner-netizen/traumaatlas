/* Playwright-Smoke-Test für TRAUMAATLAS: alle Views durchklicken,
   Konsolenfehler sammeln, Screenshots anfertigen, Ladezeit stoppen. */
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const BASE = "http://localhost:5199/";
const OUT = new URL("./qa/", import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });

const NAV = [
  ["koerper", "Körperatlas"],
  ["kaskade", "Stresskaskade"],
  ["polyvagal", "Polyvagal-Zonen"],
  ["toleranz", "Toleranzfenster"],
  ["navigator", "Symptom-Navigator"],
  ["lexikon", "Übungs-Lexikon"],
  ["stammbaum", "Stammbaum"],
  ["baukasten", "Programm-Baukasten"],
  ["wechsel", "Wechselwirkungen"],
  ["wegweiser", "Wegweiser"],
];

const errors = [];
const warnings = [];

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

page.on("console", (msg) => {
  if (msg.type() === "error") errors.push(`[console] ${msg.text()}`);
  if (msg.type() === "warning") warnings.push(`[console] ${msg.text()}`);
});
page.on("pageerror", (err) => errors.push(`[pageerror] ${err.message}`));
page.on("requestfailed", (req) =>
  errors.push(`[requestfailed] ${req.url()} – ${req.failure()?.errorText}`),
);

// Ladezeit Startseite
const t0 = Date.now();
await page.goto(BASE, { waitUntil: "networkidle" });
const loadMs = Date.now() - t0;
await page.waitForTimeout(2500); // Szene aufbauen lassen
await page.screenshot({ path: `${OUT}01-start.png` });
console.log(`Ladezeit (networkidle): ${loadMs} ms`);

// Interaktion Start: CTA-Klick in den Körperatlas
await page.getByRole("button", { name: /Körperatlas betreten/i }).click();
await page.waitForTimeout(1800);
await page.screenshot({ path: `${OUT}02-koerper.png` });

// Region per Schnellauswahl fokussieren (Overlay-Gruppe, nicht das Panel)
await page
  .getByRole("group", { name: "Körperregion auswählen" })
  .getByRole("button", { name: "Brustkorb & Herz" })
  .click();
await page.waitForTimeout(2000);
await page.screenshot({ path: `${OUT}03-koerper-region.png` });
const panelVisible = await page
  .getByRole("dialog")
  .first()
  .isVisible()
  .catch(() => false);
console.log(`Regions-Panel sichtbar: ${panelVisible}`);

// Zurück über Navigation durch alle Views
for (let i = 0; i < NAV.length; i++) {
  const [id, label] = NAV[i];
  await page.getByRole("button", { name: new RegExp(`^${label}$`) }).first().click();
  await page.waitForTimeout(id === "kaskade" ? 2500 : 1500);
  await page.screenshot({ path: `${OUT}${String(i + 4).padStart(2, "0")}-${id}.png` });
}

// Kaskade: Play starten
await page.getByRole("button", { name: /abspielen|play/i }).first().click().catch(() => {});
await page.waitForTimeout(1500);

// Baukasten: Programm per Klick aufbauen (erste Pool-Elemente)
// Wechsel: Demo-Programm auswerten lassen
await browser.close();

console.log(`\n=== ${errors.length} Fehler ===`);
errors.forEach((e) => console.log(e));
console.log(`=== ${warnings.length} Warnungen ===`);
warnings.slice(0, 10).forEach((w) => console.log(w));
process.exit(errors.length ? 1 : 0);
