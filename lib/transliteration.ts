/**
 * Ersetzt akademische IPA-Diakritika in arabischen Transliterationen (Makren wie ā/ī/ū,
 * Unterpunkte wie ḥ/ṣ/ḍ/ṭ/ẓ, ʿAyn/Hamza als eigene Modifier-Buchstaben) durch einfache
 * ASCII-Entsprechungen. Analog zur Begründung bei HIJRI_MONATE in lib/hijri.ts: die
 * PDF-Standardschriften (WinAnsi-Kodierung, siehe lib/pdf/WorksheetPdf.tsx - kein registrierter
 * Custom-Font) unterstützen diese Zeichen nicht und stellen sie als zufällige Ersatzzeichen dar
 * (z.B. würde "ṣadaqa jāriya" als "badaqa jriya" gedruckt). Der Generierungs-Prompt weist das
 * Modell zwar bereits an, direkt einfache Transliteration zu verwenden (siehe
 * GENERATION_SYSTEM_PROMPT_BASE) - das hier ist das Sicherheitsnetz, falls es sich trotzdem
 * nicht daran hält: wird auf das geparste Generierungsergebnis angewendet, BEVOR es gespeichert
 * wird, damit Web/PDF/Word/Bearbeiten-Formular immer dieselbe, sicher darstellbare Version sehen.
 */
const DIAKRITIKA_ERSETZUNGEN: [RegExp, string][] = [
  [/ā/g, "a"],
  [/Ā/g, "A"],
  [/ī/g, "i"],
  [/Ī/g, "I"],
  [/ū/g, "u"],
  [/Ū/g, "U"],
  [/ḥ/g, "h"],
  [/Ḥ/g, "H"],
  [/ṣ/g, "s"],
  [/Ṣ/g, "S"],
  [/ḍ/g, "d"],
  [/Ḍ/g, "D"],
  [/ṭ/g, "t"],
  [/Ṭ/g, "T"],
  [/ẓ/g, "z"],
  [/Ẓ/g, "Z"],
  [/ġ/g, "gh"],
  [/Ġ/g, "Gh"],
  [/[ʿʻ]/g, "'"], // Ayn
  [/[ʾʼ]/g, "'"], // Hamza
];

/** Wendet die Ersetzungen auf ALLE String-Werte eines beliebigen JSON-serialisierbaren Objekts
 * an (Umweg über JSON.stringify/parse statt rekursivem Objekt-Walk, damit neue/optionale Felder
 * im WorksheetContent-Typ nicht einzeln nachgepflegt werden müssen). */
export function vereinfacheArabischeTransliteration<T>(wert: T): T {
  let json = JSON.stringify(wert);
  for (const [muster, ersatz] of DIAKRITIKA_ERSETZUNGEN) {
    json = json.replace(muster, ersatz);
  }
  return JSON.parse(json) as T;
}
