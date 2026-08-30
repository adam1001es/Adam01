import { WorksheetContent } from "./types";

/** Sammelt alle bildGeneriertId-Referenzen aus einem Arbeitsblatt-Inhalt (Aufgaben +
 * Bildergeschichte-Schritte) - genutzt von den PDF-/Word-Export-Routen, um die zugehörigen
 * Bilddaten vorab in einem Rutsch aus der DB zu laden (react-pdf/docx können in Node nicht
 * selbst nachladen, brauchen die Bytes vorab aufgelöst). */
export function sammleBildGeneriertIds(content: WorksheetContent): string[] {
  const ids = new Set<string>();
  for (const aufgabe of content.aufgaben) {
    if (aufgabe.bildGeneriertId) ids.add(aufgabe.bildGeneriertId);
    for (const schritt of aufgabe.bildergeschichteSchritte ?? []) {
      if (schritt.bildGeneriertId) ids.add(schritt.bildGeneriertId);
    }
  }
  return [...ids];
}
