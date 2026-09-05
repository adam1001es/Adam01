/** Rollen eines Kontos (siehe Prisma-Schema User.role) - weiterhin ein einfacher String statt
 * einer eigenen Prisma-Enum, gleiche Konvention wie Worksheet.status/themenbereich.
 *
 * "moderator" darf Community/Forum moderieren (Forum-Meldungen bearbeiten, Forum-Beiträge
 * löschen, Konten vom Forum sperren), Arbeitsblatt-Meldungen einsehen/als bearbeitet markieren
 * (aber NICHT das Kontingent erstatten - das bleibt eine finanzielle, admin-exklusive
 * Entscheidung) und Wissensbasis-Einträge prüfen/freigeben. KEIN Zugriff auf Kontenverwaltung,
 * Tarif-/Rollenzuweisung oder die Kosten-/Umsatz-Übersicht - das bleibt "admin" exklusiv
 * vorbehalten, ebenso das Ernennen weiterer Moderator:innen/Admins selbst (siehe
 * app/api/admin/users/[id]/rolle/route.ts).
 */
export const ROLLEN = ["user", "moderator", "admin"] as const;
export type Rolle = (typeof ROLLEN)[number];

export const ROLLE_LABEL: Record<Rolle, string> = {
  user: "Konto",
  moderator: "Moderator:in",
  admin: "Admin",
};

export function hatModRechte(user: { role: string }): boolean {
  return user.role === "moderator" || user.role === "admin";
}
