// Reine Modell-ID-Konstanten, bewusst OHNE Import des Anthropic-SDK selbst (siehe lib/anthropic.ts)
// - das SDK (@anthropic-ai/sdk) zieht beim bloßen Importieren node:fs/node:path (mit "node:"-
// Präfix, von Next.js' Standard-Webpack-Konfiguration nicht gepollyfillt) ein und darf deshalb
// niemals transitiv in einem Client-Component-Bundle landen (z.B. components/LandingPage.tsx, das
// über lib/quota.ts -> lib/usageLog.ts -> lib/pricing.ts sonst indirekt lib/anthropic.ts einziehen
// würde). lib/pricing.ts importiert die Modellnamen daher aus dieser Datei statt aus
// lib/anthropic.ts. lib/anthropic.ts re-exportiert dieselben Konstanten, damit bestehende Imports
// von dort unverändert weiterfunktionieren.
export const GENERATION_MODEL = "claude-opus-5";
// Die Prüfung ist eine Gegenkontrolle des bereits von Opus generierten Inhalts, kein
// Kernstück der Qualität - ein günstigeres Modell senkt die Kosten hier um ca. 60%, ohne dass
// die eigentliche Arbeitsblatt-Qualität (die hängt an GENERATION_MODEL) darunter leidet.
export const VERIFICATION_MODEL = "claude-sonnet-5";
// Kurze, günstige Themenideen-Vorschläge (siehe app/api/thema-ideen) sind kein Kernstück der
// Arbeitsblatt-Qualität - dieselbe Kostenlogik wie bei VERIFICATION_MODEL, eigener Name für
// bessere Lesbarkeit an den Aufrufstellen und falls die Modelle künftig auseinanderlaufen sollen.
export const IDEEN_MODEL = "claude-sonnet-5";
// Prüfungs-Modus A (lib/pruefungZusammenstellen.ts): wählt/gewichtet nur aus bereits
// generierten, bereits geprüften Aufgaben aus statt neue Inhalte zu formulieren - dieselbe
// Kostenlogik wie VERIFICATION_MODEL/IDEEN_MODEL, eigener Name für Lesbarkeit.
export const PRUEFUNG_ZUSAMMENSTELLEN_MODEL = "claude-sonnet-5";
