import { prisma } from "./prisma";
import { legeWissensEntwurfAn } from "./wissensbasis";
import { THEMENBEREICH_KEYS, ThemenbereichKey } from "./curriculum";
import { WorksheetContent } from "./types";

/**
 * Sammelt Kandidaten für die Wissensbasis aus bereits bestehenden Arbeitsblättern (siehe
 * lib/wissensbasis.ts) - bewusst NUR aus dem eigenen Konto des Admins UND aus geteilten
 * Community-Arbeitsblättern (geteilt=true ist ein bewusster Opt-in der jeweiligen Lehrkraft),
 * NICHT aus privaten Arbeitsblättern fremder Konten. Legt für jeden Fund einen "entwurf" an
 * (siehe legeWissensEntwurfAn) - nie direkt "geprueft", das bleibt immer ein manueller
 * Admin-Schritt.
 */

function normalisiereBezeichnung(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, "");
}

async function holeQuellArbeitsblaetter(adminUserId: string) {
  return prisma.worksheet.findMany({
    where: { OR: [{ userId: adminUserId }, { geteilt: true }] },
    select: { id: true, themenbereich: true, contentJson: true },
  });
}

export interface ZitatMiningErgebnis {
  neueEntwuerfe: number;
  uebersprungeneDuplikate: number;
  durchsuchteArbeitsblaetter: number;
}

interface ZitatKandidat {
  bezeichnung: string;
  text?: string;
  anzahl: number;
  worksheetIds: string[];
  themenbereich: string;
}

/**
 * Durchsucht `quellen[]` (siehe WorksheetContentSchema) aller Quell-Arbeitsblätter, dedupliziert
 * gegen bereits bestehende WissensEintrag-Zitate (grob normalisierter Bezeichnungs-Vergleich) und
 * legt für Zitate, die in MINDESTENS ZWEI unterschiedlichen Arbeitsblättern identisch auftauchen
 * (Konsistenz-Signal - ein einmaliges Zitat ist kein verlässliches Anzeichen für Richtigkeit),
 * einen neuen Entwurf an.
 */
export async function sammleZitatKandidaten(adminUserId: string): Promise<ZitatMiningErgebnis> {
  const worksheets = await holeQuellArbeitsblaetter(adminUserId);
  const bestehende = await prisma.wissensEintrag.findMany({
    where: { typ: "zitat" },
    select: { inhalt: true },
  });
  const bestehendeBezeichnungen = new Set(
    bestehende
      .map((e) => {
        try {
          return normalisiereBezeichnung(JSON.parse(e.inhalt).bezeichnung ?? "");
        } catch {
          return "";
        }
      })
      .filter(Boolean),
  );

  const kandidaten = new Map<string, ZitatKandidat>();
  let durchsucht = 0;

  for (const w of worksheets) {
    let content: WorksheetContent;
    try {
      content = JSON.parse(w.contentJson);
    } catch {
      continue;
    }
    durchsucht++;
    for (const q of content.quellen ?? []) {
      if (!q.bezeichnung) continue;
      const key = normalisiereBezeichnung(q.bezeichnung);
      if (!key || bestehendeBezeichnungen.has(key)) continue;
      const eintrag = kandidaten.get(key) ?? {
        bezeichnung: q.bezeichnung,
        text: q.text,
        anzahl: 0,
        worksheetIds: [] as string[],
        themenbereich: w.themenbereich,
      };
      eintrag.anzahl++;
      if (!eintrag.worksheetIds.includes(w.id)) eintrag.worksheetIds.push(w.id);
      kandidaten.set(key, eintrag);
    }
  }

  let neue = 0;
  let uebersprungen = 0;
  for (const k of kandidaten.values()) {
    if (k.anzahl < 2) {
      uebersprungen++;
      continue;
    }
    const themenbereich = (THEMENBEREICH_KEYS as readonly string[]).includes(k.themenbereich)
      ? (k.themenbereich as ThemenbereichKey)
      : "gemischt";
    await legeWissensEntwurfAn({
      typ: "zitat",
      themenbereich,
      inhalt: { bezeichnung: k.bezeichnung, text: k.text },
      rechercheNotiz: `Automatisch aus ${k.anzahl} Arbeitsblättern übernommen (identische Angabe in mehreren unabhängigen Generierungen) - bitte inhaltlich gegenchecken, bevor freigegeben wird.`,
      quellWorksheetIds: k.worksheetIds,
    });
    neue++;
  }

  return {
    neueEntwuerfe: neue,
    uebersprungeneDuplikate: uebersprungen,
    durchsuchteArbeitsblaetter: durchsucht,
  };
}
