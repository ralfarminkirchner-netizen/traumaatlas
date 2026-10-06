/* Interaktions-Test: Baukasten, Wechsel, Kaskade, reduced-motion, mobil */
import { chromium } from "playwright";

const BASE = "http://localhost:5199/";
const errors = [];
const browser = await chromium.launch();

// ── Desktop-Interaktionen ──
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
page.on("pageerror", (e) => errors.push("[desktop pageerror] " + e.message));
page.on("console", (m) => m.type() === "error" && errors.push("[desktop console] " + m.text()));
await page.goto(BASE, { waitUntil: "networkidle" });

// Baukasten: zwei Elemente per Klick hinzufügen
await page.getByRole("button", { name: /^Programm-Baukasten$/ }).click();
await page.waitForTimeout(800);
await page.getByRole("button", { name: /hinzufügen/i }).first().click();
await page.waitForTimeout(500);
const stored = await page.evaluate(() => localStorage.getItem("traumaatlas-program"));
console.log("localStorage nach Add:", stored ? stored.slice(0, 140) : "LEER");

// Export: Download-Button
const dl = page.waitForEvent("download", { timeout: 5000 }).catch(() => null);
await page.getByRole("button", { name: /json exportieren/i }).click();
const download = await dl;
console.log("JSON-Export-Download:", download ? await download.suggestedFilename() : "keiner ausgelöst");

// Wechsel: Beispielprogramm auswerten
await page.getByRole("button", { name: /^Wechselwirkungen$/ }).click();
await page.waitForTimeout(600);
await page.getByRole("button", { name: /Beispielprogramm laden/i }).click();
await page.waitForTimeout(800);
const synergyCards = await page.getByText(/Synergie|Reihenfolge|Dosierung|Achtung/i).count();
console.log("Regel-Karten sichtbar:", synergyCards);
await page.screenshot({ path: "qa/14-wechsel-ausgewertet.png" });

// Kaskade: Play startet Auto-Advance
await page.getByRole("button", { name: /^Stresskaskade$/ }).click();
await page.waitForTimeout(600);
await page.getByRole("button", { name: /wiedergabe starten/i }).click();
await page.waitForTimeout(2500);
await page.screenshot({ path: "qa/15-kaskade-playing.png" });
console.log("Kaskade-Play geklickt, Screenshot 15 gespeichert");
await page.close();

// ── reduced-motion ──
const ctx2 = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
const p2 = await ctx2.newPage();
p2.on("pageerror", (e) => errors.push("[rm pageerror] " + e.message));
await p2.goto(BASE, { waitUntil: "networkidle" });
await p2.waitForTimeout(1500);
await p2.screenshot({ path: "qa/16-reduced-motion.png" });
const hasCanvas = await p2.locator("canvas").count();
console.log("reduced-motion: Canvas-Elemente =", hasCanvas, "(0 erwartet → SVG-Fallback)");
await p2.close();

// ── mobil ──
const ctx3 = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
const p3 = await ctx3.newPage();
p3.on("pageerror", (e) => errors.push("[mobile pageerror] " + e.message));
await p3.goto(BASE, { waitUntil: "networkidle" });
await p3.waitForTimeout(1500);
await p3.screenshot({ path: "qa/17-mobil-start.png" });
await p3.getByRole("button", { name: /menü öffnen/i }).click();
await p3.waitForTimeout(400);
await p3.screenshot({ path: "qa/18-mobil-menue.png" });
await p3.close();

await browser.close();
console.log(`\n=== ${errors.length} Fehler ===`);
errors.forEach((e) => console.log(e));
process.exit(errors.length ? 1 : 0);
